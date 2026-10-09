"use client";

import { type FormEvent, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { safeRedirect } from "@/lib/auth/redirect";
import { getSupabase } from "@/lib/supabase/supabase-client";

export type AuthMode =
  "sign-in" | "sign-up" | "forgot-password" | "reset-password";
const titles: Record<AuthMode, string> = {
  "sign-in": "Welcome back",
  "sign-up": "Start writing with Sonnet",
  "forgot-password": "Reset your password",
  "reset-password": "Choose a new password",
};
export function AuthForm({ mode }: { mode: AuthMode }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const db = getSupabase();
    const callback = window.location.origin + "/auth/callback";
    try {
      if (mode === "sign-in") {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(
          safeRedirect(new URLSearchParams(window.location.search).get("next")),
        );
        router.refresh();
      } else if (mode === "sign-up") {
        const { error } = await db.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callback,
            data: { first_name: String(form.get("name") ?? "").trim() },
          },
        });
        if (error) throw error;
        setMessage("Check your email to confirm your account, then sign in.");
      } else if (mode === "forgot-password") {
        const { error } = await db.auth.resetPasswordForEmail(email, {
          redirectTo: callback + "?next=/reset-password",
        });
        if (error) throw error;
        setMessage(
          "If an account exists for that email, a password reset link is on its way.",
        );
      } else {
        const {
          data: { user },
        } = await db.auth.getUser();
        if (!user)
          throw new Error("This reset link has expired. Request a new one.");
        const { error } = await db.auth.updateUser({ password });
        if (error) throw error;
        await db.auth.signOut();
        router.replace("/sign-in?message=password-updated");
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border bg-background p-8">
        <Link href="/" className="text-sm text-muted-foreground">
          ← Sonnet
        </Link>
        <h1 className="text-2xl font-semibold">{titles[mode]}</h1>
        <form onSubmit={submit} className="space-y-4">
          {mode === "sign-up" && (
            <label className="block text-sm">
              Name
              <Input
                name="name"
                autoComplete="given-name"
                maxLength={100}
                required
              />
            </label>
          )}
          {mode !== "reset-password" && (
            <label className="block text-sm">
              Email
              <Input name="email" type="email" autoComplete="email" required />
            </label>
          )}
          {mode !== "forgot-password" && (
            <label className="block text-sm">
              Password
              <Input
                name="password"
                type="password"
                autoComplete={
                  mode === "sign-in" ? "current-password" : "new-password"
                }
                minLength={mode === "sign-in" ? 1 : 12}
                maxLength={128}
                required
              />
            </label>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
          <Button className="w-full" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "sign-in"
                ? "Sign in"
                : mode === "sign-up"
                  ? "Create account"
                  : mode === "forgot-password"
                    ? "Send reset link"
                    : "Save password"}
          </Button>
        </form>
        <nav className="flex flex-wrap gap-4 text-sm underline">
          {mode !== "sign-in" && <Link href="/sign-in">Sign in</Link>}
          {mode === "sign-in" && (
            <>
              <Link href="/sign-up">Create account</Link>
              <Link href="/forgot-password">Forgot password?</Link>
            </>
          )}
          {mode === "reset-password" && (
            <Link href="/forgot-password">Request a new link</Link>
          )}
        </nav>
      </div>
    </main>
  );
}
