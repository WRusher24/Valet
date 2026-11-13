"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExploreIcon, LogIcon, PlusIcon, ShirtIcon, ShuffleIcon } from "./icons";

const ITEMS = [
  { href: "/", label: "Explore", Icon: ExploreIcon, match: (p: string) => p === "/" || p.startsWith("/combos") },
  { href: "/by-item", label: "By Item", Icon: ShirtIcon, match: (p: string) => p.startsWith("/by-item") },
  { href: "/shuffle", label: "Shuffle", Icon: ShuffleIcon, match: (p: string) => p.startsWith("/shuffle") },
  { href: "/log", label: "Log", Icon: LogIcon, match: (p: string) => p.startsWith("/log") },
  { href: "/add", label: "Add", Icon: PlusIcon, match: (p: string) => p.startsWith("/add") },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/15 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-between px-2">
        {ITEMS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium uppercase tracking-wide transition ${
                  active ? "text-obsidian" : "text-charcoal/55"
                }`}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full transition ${
                    active ? "bg-obsidian text-white" : ""
                  }`}
                >
                  <Icon />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
