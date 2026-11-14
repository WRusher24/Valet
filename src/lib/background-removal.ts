/**
 * Browser-only background removal for wardrobe photos.
 *
 * Runs @imgly/background-removal (ONNX Runtime Web / WASM) entirely on the user's device. The model
 * and WASM binaries are self-hosted under /imgly (copied from @imgly/background-removal-data by
 * scripts/copy-imgly-assets.mjs), so there is no third-party service and no API key.
 */

const INPUT_MAX_EDGE = 1600;
const OUTPUT_MAX_EDGE = 1400;
const OUTPUT_MAX_BYTES = 3.6 * 1024 * 1024; // the upload endpoint accepts at most 4 MB
const ALPHA_THRESHOLD = 12;
const PADDING_RATIO = 0.04;
const MIN_SUBJECT_AREA_RATIO = 0.01;

export interface CutoutProgress {
  /** 0–1 while the model downloads, null while it is computing (no measurable progress). */
  fraction: number | null;
  label: string;
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image."))), type, quality);
  });
}

/** Decodes the photo (respecting EXIF orientation) and scales it down so inference stays fast. */
async function downscale(file: Blob): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("We couldn't read that photo. Please use a JPEG, PNG or WebP image.");
  }
  try {
    const scale = Math.min(1, INPUT_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = makeCanvas(bitmap.width * scale, bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser can't process images here.");
    ctx.fillStyle = "#ffffff"; // flatten any transparency in the source before segmentation
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await toBlob(canvas, "image/jpeg", 0.92);
  } finally {
    bitmap.close();
  }
}

/** Crops a transparent cutout to its visible pixels (plus a little padding) and caps its size. */
async function trimAndEncode(cutout: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(cutout);
  try {
    const full = makeCanvas(bitmap.width, bitmap.height);
    const fullCtx = full.getContext("2d", { willReadFrequently: true });
    if (!fullCtx) throw new Error("Your browser can't process images here.");
    fullCtx.drawImage(bitmap, 0, 0);
    const { data, width, height } = fullCtx.getImageData(0, 0, full.width, full.height);

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y++) {
      const row = y * width * 4;
      for (let x = 0; x < width; x++) {
        if ((data[row + x * 4 + 3] ?? 0) > ALPHA_THRESHOLD) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0 || (maxX - minX + 1) * (maxY - minY + 1) < width * height * MIN_SUBJECT_AREA_RATIO) {
      throw new Error("We couldn't find the item in that photo. Try a clearer shot, or keep the original background.");
    }

    const pad = Math.round(Math.max(maxX - minX, maxY - minY) * PADDING_RATIO);
    const sx = Math.max(0, minX - pad);
    const sy = Math.max(0, minY - pad);
    const sw = Math.min(width, maxX + pad + 1) - sx;
    const sh = Math.min(height, maxY + pad + 1) - sy;

    let scale = Math.min(1, OUTPUT_MAX_EDGE / Math.max(sw, sh));
    for (let attempt = 0; attempt < 5; attempt++) {
      const out = makeCanvas(sw * scale, sh * scale);
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("Your browser can't process images here.");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(full, sx, sy, sw, sh, 0, 0, out.width, out.height);
      const blob = await toBlob(out, "image/png");
      if (blob.size <= OUTPUT_MAX_BYTES) return blob;
      scale *= 0.8;
    }
    throw new Error("The cutout is too large to upload. Try a photo with a simpler background.");
  } finally {
    bitmap.close();
  }
}

/**
 * Removes the background from a photo and returns a trimmed, transparent PNG.
 * Throws an Error with a user-presentable message if anything goes wrong.
 */
export async function removeBackgroundFromImage(
  source: Blob,
  onProgress?: (progress: CutoutProgress) => void,
): Promise<File> {
  if (typeof window === "undefined") throw new Error("Background removal only runs in the browser.");

  onProgress?.({ fraction: 0, label: "Preparing photo…" });
  const input = await downscale(source);

  const totals = new Map<string, { current: number; total: number }>();
  let highest = 0;
  const report = (key: string, current: number, total: number) => {
    if (!key.startsWith("fetch")) return;
    totals.set(key, { current, total });
    let c = 0;
    let t = 0;
    for (const v of totals.values()) {
      c += v.current;
      t += v.total;
    }
    highest = Math.max(highest, t > 0 ? Math.min(1, c / t) : 0);
    onProgress?.(
      highest >= 0.999
        ? { fraction: null, label: "Isolating garment…" }
        : { fraction: highest, label: "Loading cutout engine…" },
    );
  };

  let cutout: Blob;
  try {
    const { removeBackground } = await import("@imgly/background-removal");
    cutout = await removeBackground(input, {
      publicPath: `${window.location.origin}/imgly/`,
      model: "small",
      output: { format: "image/png", quality: 1 },
      progress: report,
    });
  } catch (err) {
    console.error("Background removal failed:", err);
    throw new Error(
      "Background removal isn't available right now. You can keep the original background instead.",
    );
  }

  onProgress?.({ fraction: null, label: "Finishing cutout…" });
  const trimmed = await trimAndEncode(cutout);
  return new File([trimmed], "cutout.png", { type: "image/png" });
}
