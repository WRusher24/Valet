import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] uppercase tracking-editorial text-bronze">404</p>
      <h1 className="mt-2 text-4xl">Page not found</h1>
      <p className="mt-2 text-charcoal/70">That look doesn&apos;t exist, or it isn&apos;t yours to see.</p>
      <Link href="/" className="btn-primary mt-6">Back to Explore</Link>
    </main>
  );
}
