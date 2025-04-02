// blogActions.ts
import { BlogActionInternal } from "./blog";
import { usePublish } from "@/lib/store/use-publish";
import { Lock, Pin, Share, Trash, Unlock } from "lucide-react";

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
    name: "Lock",
    description: "Lock this blog so it doesnt get edited.",
    icon: Lock,
    disable: (ctx) => ctx.is_preview === 0,
    action: async (ctx) => {
      await ctx.lock();
    },
  },
  {
    name: "Unlock",
    description: "Lock this blog so it doesnt get edited.",
    icon: Unlock,
    disable: (ctx) => ctx.is_preview === 1,
    action: async (ctx) => {
      await ctx.unlock();
    },
  },
  {
    name: "Publish",
    description: "Publish this blog",
    icon: Share,
    disable: (ctx) => !!ctx.blog_id,
    action: async (ctx) => {
      const { openWithBlog } = usePublish.getState();
      openWithBlog(ctx.blog_id);
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
