import { BottomNav } from "@/components/BottomNav";
import { LogoutIcon } from "@/components/icons";
import { logoutAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const firstName = user.name.split(" ")[0] ?? user.name;
  return (
    <div className="min-h-screen pb-28">
      <header className="bg-obsidian text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <span className="font-display text-2xl tracking-[0.25em] !text-white">VALET</span>
          <form action={logoutAction} className="flex items-center gap-3">
            <span className="text-xs text-white/70">Hello, {firstName}</span>
            <button type="submit" className="flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 text-xs text-white">
              <LogoutIcon /> Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
      <BottomNav />
    </div>
  );
}
