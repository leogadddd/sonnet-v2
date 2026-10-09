import { useUser } from "../store/use-user";
import { getSupabase } from "../supabase/supabase-client";
import { fromCloud, toCloud } from "./blog-serialization";
import type Blog from "./localdb/blog";
import dbClient from "./localdb/client";
import type SonnetDB from "./localdb/db";
import type Log from "./localdb/log";
import type { UserObject } from "./user/user";

export type Updates = {
  blog_id: string;
  update_source: "local" | "cloud";
  status:
    | "missing_on_local"
    | "missing_on_cloud"
    | "outdated_on_local"
    | "outdated_on_cloud"
    | "deleted_on_local";
  description: string;
  updated_at: number;
};
export class SyncManager {
  db: SonnetDB;
  constructor(private user: UserObject) {
    this.db = dbClient.db;
  }
  private assertAccount() {
    if (useUser.getState().user?.id !== this.user.id || this.db !== dbClient.db)
      throw new Error("Account changed. Sign in again before syncing.");
  }
  async fetchCloudBlogs(): Promise<Blog[]> {
    this.assertAccount();
    const all: Blog[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await getSupabase()
        .from("blogs")
        .select("*")
        .eq("author_id", this.user.id)
        .order("blog_id")
        .range(offset, offset + 499);
      if (error) throw error;
      all.push(...data.map(fromCloud));
      if (data.length < 500) return all;
    }
  }
  async fetchLocalBlogs(): Promise<Blog[]> {
    this.assertAccount();
    return this.db.blogs.toArray();
  }
  async check(): Promise<Updates[]> {
    const [cloud, local] = await Promise.all([
      this.fetchCloudBlogs(),
      this.fetchLocalBlogs(),
    ]);
    const remote = new Map(cloud.map((blog) => [blog.blog_id, blog]));
    const result: Updates[] = [];
    for (const blog of local) {
      const other = remote.get(blog.blog_id);
      if (!other || blog.updated_at !== other.updated_at)
        result.push({
          blog_id: blog.blog_id,
          update_source:
            other && other.updated_at > blog.updated_at ? "local" : "cloud",
          status: !other
            ? "missing_on_cloud"
            : other.updated_at > blog.updated_at
              ? "outdated_on_local"
              : "outdated_on_cloud",
          description: blog.deleted_at
            ? "Sync deletion"
            : !other
              ? "Upload draft"
              : "Sync latest changes",
          updated_at: blog.updated_at,
        });
      remote.delete(blog.blog_id);
    }
    for (const blog of remote.values())
      result.push({
        blog_id: blog.blog_id,
        update_source: "local",
        status: "missing_on_local",
        description: "Download from cloud",
        updated_at: blog.updated_at,
      });
    return result;
  }
  async saveBlog(blog: Blog): Promise<void> {
    this.assertAccount();
    if (blog.author_id !== this.user.id)
      throw new Error("This draft belongs to another account.");
    if (blog.parent_blog) {
      const parent = await this.db.blogs.get(blog.parent_blog);
      if (parent && parent.blog_id !== blog.blog_id)
        await this.saveBlog(parent);
    }
    const db = getSupabase();
    const { data: existing, error: lookupError } = await db
      .from("blogs")
      .select("blog_id")
      .eq("blog_id", blog.blog_id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    const row = toCloud(blog);
    if (existing) {
      delete row.blog_id;
      delete row.author_id;
      delete row.created_at;
    }
    this.assertAccount();
    const { error } = existing
      ? await db
          .from("blogs")
          .update(row)
          .eq("blog_id", blog.blog_id)
          .eq("author_id", this.user.id)
      : await db.from("blogs").insert(row);
    if (error) throw error;
    this.assertAccount();
    await this.db.blogs.update(blog.blog_id, { synced_at: Date.now() });
  }
  async sync(): Promise<{ log_id: string }> {
    const [cloud, local] = await Promise.all([
      this.fetchCloudBlogs(),
      this.fetchLocalBlogs(),
    ]);
    const remote = new Map(cloud.map((blog) => [blog.blog_id, blog]));
    for (const blog of local) {
      this.assertAccount();
      const other = remote.get(blog.blog_id);
      if (other && other.updated_at > blog.updated_at)
        await this.db.blogs.put(other);
      else if (!other || blog.updated_at > other.updated_at)
        await this.saveBlog(blog);
      else if (JSON.stringify(blog.content) !== JSON.stringify(other.content)) {
        throw new Error(
          'Conflicting versions of "' +
            blog.title +
            '". Your local draft is preserved; resolve the conflict before syncing.',
        );
      }
      remote.delete(blog.blog_id);
    }
    for (const blog of remote.values()) {
      this.assertAccount();
      await this.db.blogs.put(blog);
    }
    this.assertAccount();
    const log = await dbClient.generateLog({
      type: "Sync",
      title: "Synced successfully",
      content: { updatedBlogs: [] },
    });
    return { log_id: log.id! };
  }
  async getSyncLog(id: string): Promise<Log | null> {
    this.assertAccount();
    return (await this.db.logs.get(id)) ?? null;
  }
}
export const createSyncManager = (user: UserObject) => new SyncManager(user);
