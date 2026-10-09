"use client";

import { useEffect, useState } from "react";

import { Button } from "../ui/button";
import { useUser } from "@/lib/store/use-user";
import { SyncManager, type Updates } from "@/lib/system/sync-manager";
import { useAuth } from "@/providers/auth-provider";

export default function SonnetSyncCenter() {
  const user = useUser((state) => state.user);
  const { refresh } = useAuth();
  const [updates, setUpdates] = useState<Updates[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!user) return;
    let active = true;
    new SyncManager(user)
      .check()
      .then((result) => {
        if (active) setUpdates(result);
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [user]);
  if (!user) return null;
  async function run(sync: boolean) {
    if (!user) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const manager = new SyncManager(user);
      if (sync) {
        await manager.sync();
        setMessage("Your changes are synced.");
        await refresh();
      }
      setUpdates(await manager.check());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sync failed. Your drafts are preserved.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Drafts are saved on this device. Sync to make them available on your
        other devices.
      </p>
      <p className="text-sm">
        {user.synced_blog_count} cloud documents ·{" "}
        {(user.total_storage_used / 1024 / 1024).toFixed(1)} MB of images
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <ul className="space-y-2">
        {updates.map((item) => (
          <li key={item.blog_id} className="text-sm">
            {item.description}
          </li>
        ))}
      </ul>
      {!updates.length && !error && (
        <p className="text-sm">Everything is up to date.</p>
      )}
      <div className="flex gap-2">
        <Button disabled={busy} variant="outline" onClick={() => run(false)}>
          Check
        </Button>
        <Button disabled={busy} onClick={() => run(true)}>
          {busy ? "Working…" : "Sync"}
        </Button>
      </div>
    </div>
  );
}
