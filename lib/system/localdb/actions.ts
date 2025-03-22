// blogActions.ts
import { BlogActionInternal } from "./blog";
import { Pin, Trash } from "lucide-react";

export const blogActions: BlogActionInternal[] = [
  {
    name: "Pin",
    description: "Add this blog to your Pin",
    icon: Pin,
    disable: (ctx) => ctx.is_pinned === 0,
    action: async (ctx) => {
      await ctx.setPin(true);
    },
  },
  {
    name: "Unpin",
    description: "Remove this blog from your Pin",
    icon: Pin,
    disable: (ctx) => ctx.is_pinned === 1,
    action: async (ctx) => {
      await ctx.setPin(false);
    },
  },
  {
    name: "Move to Trash",
    description: "Move this blog to trash.",
    icon: Trash,
    disable: (ctx) => ctx.is_archived === 0,
    action: async (ctx) => {
      await ctx.moveToTrash();
    },
  },
  {
    name: "Restore to Trash",
    description: "Move this blog out of the trash.",
    icon: Trash,
    disable: (ctx) => ctx.is_archived === 1,
    action: async (ctx) => {
      await ctx.restoreFromTrash();
    },
  },
];
