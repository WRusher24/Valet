import type { ColorView } from "@/lib/queries";

interface SwatchProps {
  color: ColorView;
  size?: "sm" | "md" | "lg" | "fill" | "hero";
  showLabel?: boolean;
}

const SIZES = {
  sm: "h-10 w-5",
  md: "h-[72px] w-9",
  lg: "h-24 w-12",
  fill: "h-44 w-full sm:h-52",
  hero: "h-56 w-full sm:h-72",
} as const;

/** Vertical capsule swatch with hex + colour name. */
export function Swatch({ color, size = "md", showLabel = true }: SwatchProps) {
  return (
    <figure className={`flex min-w-0 flex-col items-center gap-2 text-center ${size === "fill" || size === "hero" ? "flex-1" : ""}`}>
      <span
        className={`${SIZES[size]} block rounded-full border border-bronze shadow-[inset_0_0_0_2px_#fff]`}
        style={{ backgroundColor: color.hex }}
        role="img"
        aria-label={`${color.name} ${color.hex}`}
      />
      {showLabel && (
        <figcaption className="w-full leading-tight">
          <span className="block text-[11px] font-medium text-obsidian">{color.name}</span>
          <span className="block text-[10px] uppercase tracking-wide text-charcoal/70">{color.hex.toUpperCase()}</span>
        </figcaption>
      )}
    </figure>
  );
}
