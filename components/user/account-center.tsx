"use client";

import { type FormEvent, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { uploadImage } from "@/lib/storage/upload";
import { useUser } from "@/lib/store/use-user";
import { getSupabase } from "@/lib/supabase/supabase-client";
import { useAuth } from "@/providers/auth-provider";

export default function AccountCenter() {
  const user = useUser((state) => state.user);
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  if (!user) return null;
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await run(async () => {
      const { error } = await getSupabase()
        .from("users")
        .update({
          first_name: String(data.get("first_name")).trim(),
          last_name: String(data.get("last_name")).trim(),
          username: String(data.get("username")).trim() || null,
        })
        .eq("id", user!.id);
      if (error) throw error;
      await refresh();
      setMessage("Profile updated.");
    });
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your account</h1>
      <form onSubmit={save} className="space-y-3">
        <label className="block text-sm">
          First name
          <Input
            name="first_name"
            defaultValue={user.first_name ?? ""}
            maxLength={100}
          />
        </label>
        <label className="block text-sm">
          Last name
          <Input
            name="last_name"
            defaultValue={user.last_name ?? ""}
            maxLength={100}
          />
        </label>
        <label className="block text-sm">
          Username
          <Input
            name="username"
            defaultValue={user.username ?? ""}
            pattern="[a-zA-Z0-9_]{3,32}"
          />
        </label>
        <Button disabled={busy}>Save profile</Button>
      </form>
      <label className="block text-sm">
        Avatar
        <Input
          aria-label="Avatar"
          type="file"
          disabled={busy}
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file)
              void run(async () => {
                const image = await uploadImage(file);
                const { error } = await getSupabase()
                  .from("users")
                  .update({ image_url: image.url })
                  .eq("id", user.id);
                if (error) throw error;
                await refresh();
                setMessage("Avatar updated.");
              });
          }}
        />
      </label>
      <p className="text-sm">
        {user.email} · {user.is_verified ? "Verified" : "Unverified"}
      </p>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const email = String(new FormData(event.currentTarget).get("email"));
          void run(async () => {
            const { error } = await getSupabase().auth.updateUser(
              { email },
              { emailRedirectTo: window.location.origin + "/auth/callback" },
            );
            if (error) throw error;
            setMessage("Check both email addresses to confirm the change.");
          });
        }}
      >
        <label className="block text-sm">
          New email
          <Input name="email" type="email" autoComplete="email" required />
        </label>
        <Button disabled={busy}>Change email</Button>
      </form>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const password = String(
            new FormData(event.currentTarget).get("password"),
          );
          void run(async () => {
            const { error } = await getSupabase().auth.updateUser({ password });
            if (error) throw error;
            setMessage("Password updated.");
          });
        }}
      >
        <label className="block text-sm">
          New password
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </label>
        <Button disabled={busy}>Change password</Button>
      </form>
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
      <Button
        variant="destructive"
        disabled={busy}
        onClick={() =>
          run(async () => {
            const { error } = await getSupabase().auth.signOut();
            if (error) throw error;
            router.replace("/sign-in");
            router.refresh();
          })
        }
      >
        Sign out
      </Button>
    </div>
  );
}
