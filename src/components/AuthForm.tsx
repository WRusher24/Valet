"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type FormState } from "@/app/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    mode === "login" ? loginAction : registerAction,
    {},
  );
  const isLogin = mode === "login";

  return (
    <main className="flex min-h-screen flex-col bg-obsidian">
      <div className="px-6 pb-10 pt-14 text-center text-white">
        <p className="font-display text-5xl tracking-[0.3em] !text-white">VALET</p>
        <p className="mt-3 text-[11px] uppercase tracking-editorial text-bronze">The morning colour lookbook</p>
      </div>
      <div className="flex-1 rounded-t-[2rem] bg-white px-6 pb-10 pt-8">
        <div className="mx-auto max-w-sm">
          <h1 className="text-3xl">{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-charcoal/70">
            {isLogin ? "Sign in to open your lookbook." : "Instant access — no approval needed."}
          </p>
          <form action={action} className="mt-7 space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="label">Name</label>
                <input id="name" name="name" autoComplete="name" required maxLength={80} className="field" />
              </div>
            )}
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required className="field" />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                minLength={isLogin ? undefined : 8}
                className="field"
              />
              {!isLogin && <p className="mt-1 text-xs text-charcoal/60">At least 8 characters.</p>}
            </div>
            {state.error && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">
                {state.error}
              </p>
            )}
            <button type="submit" disabled={pending} className="btn-primary w-full !py-4">
              {pending ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm">
            {isLogin ? "New to Valet? " : "Already have an account? "}
            <Link href={isLogin ? "/register" : "/login"} className="font-medium text-obsidian underline underline-offset-4">
              {isLogin ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
