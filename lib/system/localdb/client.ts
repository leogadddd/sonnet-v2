"use client";

import { handleDatabaseOperation } from "../errors/errorhandlers";
import Blog from "./blog";
import SonnetDB from "./db";
import Log from "./log";
import { useUser } from "@/lib/store/use-user";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

export class SonnetDBClient {
  private static instance: SonnetDBClient;
  db: SonnetDB;

  private constructor() {
    this.db = new SonnetDB();
  }

  public static getInstance(): SonnetDBClient {
    if (!SonnetDBClient.instance) {
      SonnetDBClient.instance = new SonnetDBClient();
    }
    return SonnetDBClient.instance;
  }

  private createLogInstance(data: Partial<Log>): Log {
    const uuid = crypto.randomUUID();

    return {
      id: uuid,
      user_id: data.user_id,
      title: data.title ?? "General Log",
      type: data.type ?? "General",
      call_from: data.call_from ?? "Sonnet",
      content: data.content ?? null,

      created_at: data.created_at ?? Date.now(),
    } as Log;
  }

  // ✅ Factory function to create Blog objects
  private createBlogInstance(data: Partial<Blog>): Blog {
    const uuid = crypto.randomUUID();

    return {
      ...data,
      blog_id: data.blog_id ?? uuid,
      parent_blog: data.parent_blog ?? "",
      title: data.title
        ? data.title
        : data.parent_blog
          ? "New Page"
          : "New Blog",
      slug: data.slug ?? uuid,
      author_id: data.author_id,

      icon: data.icon ?? null,
      description: data.description ?? "",
      content: data.content ?? "",
      cover_image: data.cover_image ?? null,
      tags: data.tags ?? [],

      likes: data.likes ?? 0,
      views: data.views ?? 0,
      comments: data.comments ?? 0,
      shares: data.shares ?? 0,
      read_time: data.read_time ?? 0,

      is_pinned: data.is_pinned ?? 0,
      is_featured: data.is_featured ?? 0,
      is_published: data.is_published ?? 1,
      is_archived: data.is_archived ?? 0,
      is_preview: data.is_preview ?? 0,
      is_on_explore: data.is_on_explore ?? 1,

      published_at: data.published_at ?? Date.now(),
      created_at: data.created_at ?? Date.now(),
      updated_at: data.updated_at ?? Date.now(),
      archived_at: data.archived_at ?? 0,
      deleted_at: data.deleted_at ?? 0,
      synced_at: data.synced_at ?? 0,
    } as Blog;
  }

  // ✅ Add a blog
  async createBlog(data: Partial<Blog>): Promise<{ id: string | null }> {
    return handleDatabaseOperation(async () => {
      const { user } = useUser.getState();

      if (!user) {
        console.error("Not Authenticated");
        throw new Error("Not Authenticated");
      }

      const blog = this.createBlogInstance({
        ...data,
        author_id: user.id,
      });
      const promise = this.db.blogs.add(blog);

      toast.promise(promise, {
        loading: "Creating...",
        success: "Created a New Blog",
        error: "Error Creating New Blog",
      });

      await promise;
      return { id: blog.blog_id };
    }, "Failed to create blog.");
  }

  async generateLog(data: Partial<Log>): Promise<{ id: string | null }> {
    return handleDatabaseOperation(async () => {
      const { user } = useUser.getState();

      if (!user) return { id: null };

      const log = this.createLogInstance({
        ...data,
        user_id: user.id,
      });

      await this.db.logs.add(log);

      return { id: log.id };
    }, `Failed to Log this ${data.table?.toString()}`);
  }

  // ✅ Add a page
  async createPage(data: Partial<Blog>): Promise<{ id: string | null }> {
    return handleDatabaseOperation(async () => {
      const { user } = useUser.getState();

      if (!user) {
        console.error("Not Authenticated");
        throw new Error("Not Authenticated");
      }

      const existingParent = await this.getBlogById(data.parent_blog as string);

      if (!existingParent) {
        console.error("Invalid Parent Blog");
        throw new Error("Invalid Parent Blog");
      }

      if (existingParent.author_id !== user.id) {
        console.error("Not Permitted");
        throw new Error("Not Permitted");
      }

      const blog = this.createBlogInstance({
        ...data,
        author_id: user.id,
      });
      const promise = this.db.blogs.add(blog);

      toast.promise(promise, {
        loading: "Creating...",
        success: "Created a New page",
        error: "Error Creating New Page",
      });

      await promise;
      return { id: blog.blog_id };
    }, "Failed to create page.");
  }

  // ✅ Get a single blog by ID
  async getBlogById(blog_id: string): Promise<Blog | null> {
    if (!blog_id) return null;
    return handleDatabaseOperation(async () => {
      const blog = await this.db.blogs
        .where(["blog_id", "deleted_at"])
        .equals([blog_id, 0])
        .first();
      return blog || null;
    }, `Failed to fetch blog with ID ${blog_id}`);
  }

  async getBlogBySlug(slug: string): Promise<Blog | null> {
    return handleDatabaseOperation(async () => {
      const blog = await this.db.blogs
        .where(["slug", "deleted_at"])
        .equals([slug, 0])
        .first();
      return blog || null;
    }, `Failed to fetch blog with slug ${slug}`);
  }

  async getBlogChildrenById(blog_id: string): Promise<Blog[]> {
    return handleDatabaseOperation(async () => {
      return await this.db.blogs.where("parent_blog").equals(blog_id).toArray();
    }, `Failed to fetch blog children with ID ${blog_id}`);
  }

  // ✅ Update a blog
  async updateBlog(blog_id: string, updates: Partial<Blog>): Promise<number> {
    console.log(updates);
    return handleDatabaseOperation(
      () =>
        this.db.blogs.update(blog_id, {
          ...updates,
          updated_at: Date.now(),
        }),
      `Failed to update blog with ID ${blog_id}.`,
    );
  }

  // ✅ Soft delete a blog
  async softDeleteBlog(blog_id: string): Promise<number> {
    return handleDatabaseOperation(() => {
      const promise = new Promise<number>(async (resolve, reject) => {
        try {
          const recursiveSoftDelete = async (blog_id: string) => {
            const children = await dbClient.getBlogChildrenById(blog_id);

            for (const child of children) {
              await dbClient.updateBlog(child.blog_id, {
                deleted_at: Date.now(),
              });

              await recursiveSoftDelete(child.blog_id);
            }
          };

          await recursiveSoftDelete(blog_id);

          await dbClient.updateBlog(blog_id, {
            deleted_at: Date.now(),
          });

          resolve(0);
        } catch (error) {
          console.log(error);
          reject(error);
        }
      });

      toast.promise(promise, {
        loading: "Deleting Blog",
        success: "Blog deleted!",
        error: "Failed to delete Blog",
      });

      return promise;
    }, `Failed to soft delete blog with ID ${blog_id}.`);
  }

  // ✅ Hard delete a blog
  async deleteBlog(blog_id: string): Promise<void> {
    return handleDatabaseOperation(
      () => this.db.blogs.delete(blog_id),
      `Failed to permanently delete blog with ID ${blog_id}.`,
    );
  }
}

// ✅ Singleton instance
const dbClient = SonnetDBClient.getInstance();
export default dbClient;

// ✅ Separate Hooks for Client Components
export function SidebarBlogs(parent_blog?: string, pin: boolean = false) {
  return useLiveQuery(
    () =>
      dbClient.db.blogs
        .where(["parent_blog", "is_archived", "is_pinned"])
        .equals([parent_blog ?? "", 0, pin ? 1 : 0])
        .sortBy("created_at"),
    [],
  );
}

export function AllBlogs() {
  return useLiveQuery(
    () =>
      dbClient.db.blogs
        .where(["is_archived", "deleted_at"])
        .equals([0, 0])
        .sortBy("updated_at"),
    [],
  );
}

export function TrashBoxBlogs(parent_blog?: string) {
  return useLiveQuery(
    () =>
      dbClient.db.blogs
        .where(["parent_blog", "is_archived", "deleted_at"])
        .equals([parent_blog ?? "", 1, 0])
        .sortBy("archived_at"),
    [],
  );
}

export function RecentBlogs() {
  return useLiveQuery(
    () => dbClient.db.blogs.where("is_archived").equals(0).sortBy("updated_at"),
    [],
  );
}
