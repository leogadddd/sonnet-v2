"use client";

import React, { useEffect, useState } from "react";

import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSonnetSync } from "@/lib/store/use-sonnetsync";
import { useUser } from "@/lib/store/use-user";
import Log from "@/lib/system/localdb/log";
import { shortcutManager } from "@/lib/system/shortcut-manager";
import { SyncManager, Updates } from "@/lib/system/sync-manager";
import { UserX } from "lucide-react";

const SonnetSyncModal = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [updates, setUpdates] = useState<Updates[]>([]);
  const [log, setLog] = useState<Log | null>(null);
  const { modal_state, onClose, toggle } = useSonnetSync();
  const { user } = useUser();

  const checkSync = async () => {
    if (!user?.id) return;

    setUpdates([]);
    setIsLoading(true);
    const syncManager = new SyncManager(user);
    const updateList = await syncManager.check();

    setUpdates(updateList);
    setIsLoading(false);
  };

  const sync = async () => {
    setIsLoading(true);
    setLog(null);
    setUpdates([]);
    if (!user?.id) return;
    const syncManager = new SyncManager(user);

    try {
      const { log_id } = await syncManager.sync();
      setIsLoading(false);

      const log = await syncManager.getSyncLog(log_id);
      if (log) return;
      setLog(log);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (modal_state) checkSync();
  }, [modal_state]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    };

    const shortcut = shortcutManager.registerShortcut(handler).ctrl().key("i");

    return () => shortcutManager.unregisterShortcut(shortcut, handler);
  }, []);

  return (
    <Dialog open={modal_state} onOpenChange={onClose}>
      <DialogContent className="p-2">
        <DialogHeader className="p-2">
          <DialogTitle>Sonnet Sync</DialogTitle>
        </DialogHeader>
        <div>
          {!user && (
            <div className="flex items-center justify-center h-24">
              <h1 className="text-sm text-muted-foreground flex items-center">
                <UserX className="h-4 w-4 mr-2" />
                Not Authenticated
              </h1>
            </div>
          )}

          {!!user && (
            <div>
              <div className="flex items-center gap-x-2">
                <Button onClick={checkSync} disabled={isLoading}>
                  Check
                </Button>
                <Button onClick={sync} disabled={isLoading}>
                  Sync
                </Button>
              </div>
              <div className="flex flex-col items-center justify-center h-24">
                {isLoading && (
                  <div className="">
                    <h1>
                      <Spinner />
                    </h1>
                  </div>
                )}
                {updates.map((update) => (
                  <div key={update.blog_id}>
                    {update.blog_id} - {update.status}
                  </div>
                ))}
                {!isLoading && updates.length === 0 && !log && (
                  <h1>Everything is up to date</h1>
                )}
                <p>{log && `${log}`}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SonnetSyncModal;
