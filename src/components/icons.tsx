import type { SVGProps } from "react";

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

type P = SVGProps<SVGSVGElement>;

export const ExploreIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="8" cy="9" r="4.5" /><circle cx="16" cy="9" r="4.5" /><circle cx="12" cy="15.5" r="4.5" /></svg>
);
export const ShirtIcon = (p: P) => (
  <svg {...base} {...p}><path d="M8 3L3 6.5l2.5 4L8 9v12h8V9l2.5 1.5 2.5-4L16 3a4 4 0 0 1-8 0z" /></svg>
);
export const ShuffleIcon = (p: P) => (
  <svg {...base} {...p}><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
);
export const LogIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" /></svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const HeartIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base} width={18} height={18} fill={filled ? "currentColor" : "none"} {...p}>
    <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" />
  </svg>
);
export const CalendarIcon = (p: P) => (
  <svg {...base} width={18} height={18} {...p}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
);
export const TrashIcon = (p: P) => (
  <svg {...base} width={16} height={16} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
);
export const LogoutIcon = (p: P) => (
  <svg {...base} width={18} height={18} {...p}><path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base} width={16} height={16} {...p}><path d="M5 12.5l4.5 4.5L19 7" /></svg>
);
