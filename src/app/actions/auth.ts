"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn, signOut } from "@/auth";

export interface FormState {
  error?: string;
}

const registerSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(80, "Name is too long."),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(200),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be 128 characters or fewer."),
});

function describeDbError(err: unknown): string {
  console.error("Database error during auth:", err);
  const message = err instanceof Error ? err.message : "";
  const code = (err as { code?: string }).code;
  if (code === "42P01" || /relation .* does not exist/i.test(message)) {
    return "The database tables haven't been created yet. Run `npm run db:push && npm run db:seed` against your Neon database.";
  }
  if (/DATABASE_URL/.test(message)) return "DATABASE_URL is not configured on the server.";
  return "We couldn't reach the database. Check DATABASE_URL and try again.";
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  const { name, email, password } = parsed.data;

  try {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) return { error: "An account with this email already exists. Try signing in." };
  } catch (err) {
    return { error: describeDbError(err) };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await db.insert(users).values({ name, email, passwordHash });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "23505") return { error: "An account with this email already exists. Try signing in." };
    return { error: describeDbError(err) };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Your account was created, but sign-in failed. Please sign in manually." };
    throw err; // NEXT_REDIRECT
  }
  return {};
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") return { error: "Incorrect email or password." };
      return { error: "Sign-in is temporarily unavailable. Check that the database tables exist and AUTH_SECRET is set." };
    }
    throw err; // NEXT_REDIRECT
  }
  return {};
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
