const MAX_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 1600;
const OK_TYPE = /^image\/(jpeg|png|webp)$/;

/** Browser-side: downscales large phone photos so they stay under the serverless body limit. */
export async function prepareImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 2.5 * 1024 * 1024 && OK_TYPE.test(file.type)) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.86));
    if (!blob) throw new Error("encode failed");
    return new File([blob], "outfit.jpg", { type: "image/jpeg" });
  } catch {
    if (OK_TYPE.test(file.type) && file.size <= MAX_BYTES) return file;
    throw new Error("We couldn't read that photo. Please use a JPEG, PNG or WebP image under 4 MB.");
  }
}
