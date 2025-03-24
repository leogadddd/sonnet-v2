import React from "react";

import { useParams } from "next/navigation";

import ContextMenu from "./context-menu";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/store/use-settings";
import dbClient from "@/lib/system/localdb/client";
import { shortcutManager } from "@/lib/system/shortcut-manager";
import { useLiveQuery } from "dexie-react-hooks";
import { Ellipsis, LucideIcon, Settings } from "lucide-react";

export type MenuActions = {
  icon: LucideIcon;
  name: string;
  description: string;
  disable: boolean | (() => boolean);
  shortcut?: {
    keys: string;
    register: (handler: (event: KeyboardEvent) => void) => void;
  };
  action: () => void;
};

const TopbarMenuButton = () => {
  const settings = useSettings();
  const params = useParams();

  const blog = useLiveQuery(
    async () => await dbClient.getBlogById(params?.blog_id as string),
    [params?.blog_id],
  );

  const menu: MenuActions[] = [
    {
      name: "Settings",
      description: "Open Settings",
      icon: Settings,
      disable: false,
      shortcut: {
        keys: "⌘+,",
        register: (handler) =>
          shortcutManager.registerShortcut(handler).ctrl().key(","),
      },
      action: () => settings.onOpen(),
    },
  ];

  return (
    <ContextMenu
      opt={
        blog ? [...menu, { title: "Blog Actions", opt: blog.actions }] : menu
      }
      side="bottom"
      alignOffset={-50}
      contentStyle="mr-2 mt-1"
    >
      <Button size="icon" variant="ghost">
        <Ellipsis className="h-6 w-6" />
      </Button>
    </ContextMenu>
  );
};

export default TopbarMenuButton;
