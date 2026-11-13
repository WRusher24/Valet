import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-obsidian px-5 pb-8 pt-7 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] uppercase tracking-editorial text-bronze">{eyebrow}</p>
        <h1 className="mt-2 text-4xl leading-tight !text-white">{title}</h1>
        {children && <div className="mt-5">{children}</div>}
      </div>
    </section>
  );
}
