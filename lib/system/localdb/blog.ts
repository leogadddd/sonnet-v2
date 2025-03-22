import { blogActions } from "./actions";
import dbClient from "./client";
import type SonnetDB from "./db";
import { getReadTime } from "@/lib/utils";
import { Entity } from "dexie";
import { LucideIcon } from "lucide-react";
import { Toaster, toast } from "sonner";

export type BlogActionInternal = {
  icon: LucideIcon;
  name: string;
  description: string;
  disable: boolean | ((ctx: Blog) => boolean);
  action: (ctx: Blog, args: any) => {};
  shortcut?: {
    keys: string;
    register: (handler: (event: KeyboardEvent) => void) => void;
  };
};

export type BlogAction = {
  icon: LucideIcon;
  name: string;
  description: string;
  disable: boolean | ((ctx: Blog) => boolean);
  action: (args?: any) => {};
  shortcut?: {
    keys: string;
    register: (handler: (event: KeyboardEvent) => void) => void;
  };
};

export type EdgestoreResponse = {
  url: string;
  size: number;
  uploadedAt: Date;
  metadata: Record<string, never>;
  path: Record<string, never>;
  pathOrder: string[];
};

export default class Blog extends Entity<SonnetDB> {
  blog_id!: string;
  title!: string;
  slug!: string;
  author_id!: string;
  parent_blog!: string | null;

  description!: string;
  content!: string;
  cover_image!: string | null;
  icon!: string | null;

  tags!: string[];
  likes!: number;
  views!: number;
  comments!: number;
  shares!: number;
  read_time!: number;

  is_pinned!: number;
  is_featured!: number;
  is_published!: number;
  is_archived!: number;
  is_preview!: number;
  is_on_explore!: number;

  published_at!: number;
  archived_at!: number;
  created_at!: number;
  updated_at!: number;
  deleted_at!: number;
  synced_at!: number;

  async updateTitle(title: string) {
    await dbClient.updateBlog(this.blog_id, {
      title: title,
    });
  }

  async createNewPage(data: Partial<Blog>): Promise<{ id: string | null }> {
    return await dbClient.createPage({
      ...data,
      parent_blog: this.blog_id,
    });
  }

  async setPin(isPin: boolean) {
    await dbClient.updateBlog(this.blog_id, {
      is_pinned: isPin ? 1 : 0,
    });
  }

  async moveToTrash() {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const recursiveArchive = async (blog_id: string) => {
          const children = await dbClient.getBlogChildrenById(blog_id);

          for (const child of children) {
            await dbClient.updateBlog(child.blog_id, {
              is_archived: 1,
              archived_at: Date.now(),
            });

            await recursiveArchive(child.blog_id);
          }
        };

        await recursiveArchive(this.blog_id);

        await dbClient.updateBlog(this.blog_id, {
          is_archived: 1,
          archived_at: Date.now(),
        });

        resolve(0);
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: "Moving Blog to Trash",
      success: "Moved the Blog to Trash",
      error: "Failed to move Blog to trash",
    });
  }

  async restoreFromTrash() {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const recursiveRestore = async (blog_id: string) => {
          const children = await dbClient.getBlogChildrenById(blog_id);

          for (const child of children) {
            await dbClient.updateBlog(child.blog_id, {
              is_archived: 0,
              archived_at: 0,
            });

            await recursiveRestore(child.blog_id);
          }
        };

        await recursiveRestore(this.blog_id);

        await dbClient.updateBlog(this.blog_id, {
          is_archived: 0,
          archived_at: 0,
        });

        resolve(0);
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: "Moveng Blog out of the Trash",
      success: "Moved the blog out of the Trash",
      error: "Failed to move Blog out of thetrash",
    });
  }

  async updateDescription(description: string) {
    await dbClient.updateBlog(this.blog_id, {
      description: description,
    });
  }

  async updateCoverImage(response: EdgestoreResponse | null) {
    await dbClient.updateBlog(this.blog_id, {
      cover_image: response?.url ?? null,
    });
  }

  async updateIcon(icon: string | null) {
    await dbClient.updateBlog(this.blog_id, {
      icon: icon ?? null,
    });
  }

  async updateContent(content: string) {
    await dbClient.updateBlog(this.blog_id, {
      content: content ?? "",
      read_time: getReadTime(content),
    });
  }

  async delete() {
    await dbClient.softDeleteBlog(this.blog_id);
  }

  get actions(): BlogAction[] {
    const actions = blogActions
      .filter((action) =>
        typeof action.disable === "function"
          ? action.disable(this)
          : action.disable,
      )
      .map((action) => ({
        ...action,
        disable:
          typeof action.disable === "function"
            ? !action.disable(this)
            : !action.disable,
        action: (args?: any) => action.action(this, args),
      }));
    return actions;
  }
}
