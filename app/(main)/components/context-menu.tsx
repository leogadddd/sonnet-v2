import React, { ReactNode } from "react";

import { MenuActions } from "./topbar-menu-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlogAction } from "@/lib/system/localdb/blog";
import { cn } from "@/lib/utils";

type OptCollection = {
  title: string;
  opt: (BlogAction | MenuActions)[];
};

interface ContextMenuProps {
  opt: (BlogAction | MenuActions | OptCollection)[];
  children: ReactNode;
  side?: "right" | "top" | "bottom" | "left" | undefined;
  sideOffset?: number | undefined;
  alignOffset?: number | undefined;
  contentStyle?: string | undefined;
}

const ContextMenu = ({
  opt,
  side = "left",
  sideOffset,
  children,
  alignOffset,
  contentStyle,
}: ContextMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side ?? "bottom"}
        sideOffset={sideOffset ?? 0}
        alignOffset={alignOffset ?? 0}
        className={cn("rounded-lg bg-background w-52", contentStyle)}
      >
        {opt.length === 0 && (
          <div className="flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No Actions Available
            </p>
          </div>
        )}

        {opt.map((action, index) => {
          if ("title" in action) {
            // It's an OptCollection
            return (
              <div key={index}>
                {index !== 0 && <DropdownMenuSeparator />}
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  {action.title}
                </p>
                {action.opt.map((subAction) => {
                  const Icon = subAction.icon;

                  if (subAction.shortcut) {
                    subAction.shortcut.register(subAction.action);
                  }

                  return (
                    <DropdownMenuItem
                      key={subAction.name}
                      onClick={() => subAction.action()}
                      className="flex justify-between"
                    >
                      <div className="flex items-center gap-x-2">
                        <Icon className="h-4 w-4" />
                        <p>{subAction.name}</p>
                      </div>
                      {subAction.shortcut && (
                        <div>
                          <div className="bg-secondary/70 ring ring-secondary/70 px-1.5 py-0.5 rounded-sm text-muted-foreground/90 flex items-center ">
                            <p className="text-xs">{subAction.shortcut.keys}</p>
                          </div>
                        </div>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </div>
            );
          } else {
            // It's a single action
            const Icon = action.icon;

            if (action.shortcut) {
              action.shortcut.register(action.action);
            }

            return (
              <DropdownMenuItem
                key={action.name}
                onClick={() => action.action()}
                className="flex justify-between"
              >
                <div className="flex items-center gap-x-2">
                  <Icon className="h-4 w-4" />
                  <p>{action.name}</p>
                </div>
                {action.shortcut && (
                  <div>
                    <div className="bg-secondary/60 ring ring-secondary/70 px-1.5 py-0.5 rounded-sm text-muted-foreground/90 flex items-center ">
                      <p className="text-xs">{action.shortcut.keys}</p>
                    </div>
                  </div>
                )}
              </DropdownMenuItem>
            );
          }
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ContextMenu;
