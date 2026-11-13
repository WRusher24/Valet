import type { ColorView } from "@/lib/queries";

interface SwatchProps {
  color: ColorView;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SIZES = {
  sm: "h-10 w-5",
  md: "h-[72px] w-9",
  lg: "h-24 w-12",
} as const;

/** Vertical capsule swatch with hex + colour name. */
export function Swatch({ color, size = "md", showLabel = true }: SwatchProps) {
  return (
    <figure className="flex min-w-0 flex-col items-center gap-2 text-center">
      <span
        className={`${SIZES[size]} block rounded-full border border-bronze shadow-[inset_0_0_0_2px_#fff]`}
        style={{ backgroundColor: color.hex }}
        role="img"
        aria-label={`${color.name} ${color.hex}`}
      />
      {showLabel && (
        <figcaption className="max-w-[84px] leading-tight">
          <span className="block text-[11px] font-medium text-obsidian">{color.name}</span>
          <span className="block text-[10px] uppercase tracking-wide text-charcoal/70">{color.hex.toUpperCase()}</span>
        </figcaption>
      )}
    </figure>
  );
}
