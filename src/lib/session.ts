import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

/** Returns the signed-in user or redirects to /login. */
export async function requireUser(): Promise<CurrentUser> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect("/login");
  return { id: user.id, name: user.name ?? "Member", email: user.email ?? "" };
}

/** Same as requireUser but returns null (for server actions that answer with an error state). */
export async function getUserOrNull(): Promise<CurrentUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  return { id: user.id, name: user.name ?? "Member", email: user.email ?? "" };
}
