"use client";

import { useEffect, useRef, useState } from "react";
import type { ColorView } from "@/lib/queries";

interface OutfitImageProps {
  src: string;
  alt: string;
  colors: ColorView[];
  priority?: boolean;
}

/** Outfit photo that degrades to a palette-striped placeholder instead of a broken-image icon. */
export function OutfitImage({ src, alt, colors, priority = false }: OutfitImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    if (img.complete) {
      if (img.naturalWidth === 0) setFailed(true);
      else setLoaded(true);
    }
  }, [src]);

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface">
      {failed ? (
        <div role="img" aria-label={`${alt} (photo unavailable)`} className="flex h-full w-full">
          {colors.map((c, i) => (
            <span key={`${c.hex}-${i}`} className="h-full flex-1" style={{ backgroundColor: c.hex }} />
          ))}
          <span className="absolute inset-x-0 bottom-0 bg-obsidian/70 px-4 py-2 text-center text-[10px] uppercase tracking-editorial text-white">
            Palette preview
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
