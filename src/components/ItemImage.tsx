"use client";

import { useEffect, useRef, useState } from "react";

interface ItemImageProps {
  src: string;
  alt: string;
  /** Shown instead of a broken-image icon when the photo can't load. */
  fallbackLabel: string;
  fallbackHex?: string;
  priority?: boolean;
  className?: string;
}

/** Square-cropped wardrobe photo with a graceful, icon-free fallback. */
export function ItemImage({ src, alt, fallbackLabel, fallbackHex = "#FAF9F6", priority = false, className = "" }: ItemImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (img?.complete) {
      if (img.naturalWidth === 0) setFailed(true);
      else setLoaded(true);
    }
  }, [src]);

  return (
    <div className={`relative aspect-square w-full overflow-hidden bg-surface ${className}`}>
      {failed ? (
        <div
          role="img"
          aria-label={`${alt} (photo unavailable)`}
          className="flex h-full w-full items-end justify-center p-2"
          style={{ backgroundColor: fallbackHex }}
        >
          <span className="rounded-full bg-obsidian/75 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
            {fallbackLabel}
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
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
