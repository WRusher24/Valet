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

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  const { name, email, password } = parsed.data;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: "An account with this email already exists. Try signing in." };

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await db.insert(users).values({ name, email, passwordHash });
  } catch {
    return { error: "An account with this email already exists. Try signing in." };
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
    if (err instanceof AuthError) return { error: "Incorrect email or password." };
    throw err; // NEXT_REDIRECT
  }
  return {};
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
