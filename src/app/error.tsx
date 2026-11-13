"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="mt-2 text-charcoal/70">Please try again in a moment.</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">Try again</button>
    </main>
  );
}
