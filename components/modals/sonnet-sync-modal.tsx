"use client";

import { useEffect } from "react";

import SonnetSyncCenter from "../sync/sonnetsync-center";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useSonnetSync } from "@/lib/store/use-sonnetsync";
import { shortcutManager } from "@/lib/system/shortcut-manager";

export default function SonnetSyncModal() {
  const { modal_state, onClose, toggle } = useSonnetSync();
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      event.preventDefault();
      toggle();
    };
    const shortcut = shortcutManager.registerShortcut(handler).ctrl().key("i");
    return () => shortcutManager.unregisterShortcut(shortcut, handler);
  }, [toggle]);
  return (
    <Dialog open={modal_state} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sonnet Sync</DialogTitle>
        </DialogHeader>
        {modal_state && <SonnetSyncCenter />}
      </DialogContent>
    </Dialog>
  );
}
