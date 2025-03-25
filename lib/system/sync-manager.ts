import { useSupabase as UseSupabase } from "../supabase/supabase-client";
import { BlogDifferences, TimeFormatter, getBlogDifferences } from "../utils";
import Blog from "./localdb/blog";
import dbClient from "./localdb/client";
import SonnetDB from "./localdb/db";
import Log from "./localdb/log";
import { UserObject } from "./user/user";
import { SupabaseClient } from "@supabase/supabase-js";
import DiffMatchPatch from "diff-match-patch";

const dmp = new DiffMatchPatch();

export type Updates = {
  blog_id: string;
  update_source: "local" | "cloud";
  status: "missing" | "outdated" | "conflict";
  updated_at: number;
  difference?: BlogDifferences;
};

export class SyncManager {
  db: SonnetDB;
  supabase: SupabaseClient;
  user: UserObject;

  constructor(user: UserObject) {
    this.db = dbClient.db;
    this.supabase = UseSupabase();
    this.user = user;
  }

  async fetchCloudBlogs(): Promise<Blog[]> {
    const { data, error } = await this.supabase
      .from("blogs")
      .select("*")
      .eq("author_id", this.user.id);

    if (error) {
      console.error("Sync Fetch Cloud Error:", error);
      throw error;
    }

    return data || []; // Ensure we return an empty array if no data
  }

  async fetchLocalBlogs(): Promise<Blog[]> {
    return await this.db.blogs.toArray();
  }

  async check(): Promise<Updates[]> {
    if (!this.user.id) throw new Error("Not Authenticated");

    const [cloud_blogs, local_blogs] = await Promise.all([
      this.fetchCloudBlogs(),
      this.fetchLocalBlogs(),
    ]);

    const cloudBlogMap = new Map(
      cloud_blogs.map((blog) => [blog.blog_id, blog]),
    );
    const updates: Updates[] = [];

    // Check local blogs against cloud
    for (const local_blog of local_blogs) {
      const cloud_blog = cloudBlogMap.get(local_blog.blog_id);

      if (!cloud_blog) {
        // Cloud is missing this blog
        updates.push({
          blog_id: local_blog.blog_id,
          update_source: "cloud",
          status: "missing", // Should be uploaded to cloud
          updated_at: local_blog.updated_at,
        });
      } else if (cloud_blog.updated_at > local_blog.updated_at) {
        // Cloud version is newer
        updates.push({
          blog_id: local_blog.blog_id,
          update_source: "local",
          status: "outdated", // Should be updated locally
          updated_at: cloud_blog.updated_at,
          difference: getBlogDifferences(local_blog, cloud_blog),
        });
      } else if (cloud_blog.updated_at < local_blog.updated_at) {
        // Local version is newer
        updates.push({
          blog_id: local_blog.blog_id,
          update_source: "cloud",
          status: "outdated", // Should be updated on the cloud
          updated_at: local_blog.updated_at,
          difference: getBlogDifferences(local_blog, cloud_blog),
        });
      }

      // Remove processed blog from the cloud map
      cloudBlogMap.delete(local_blog.blog_id);
    }

    // Any remaining cloud blogs are missing locally
    for (const cloud_blog of cloudBlogMap.values()) {
      updates.push({
        blog_id: cloud_blog.blog_id,
        update_source: "local",
        status: "missing", // Should be downloaded to local
        updated_at: cloud_blog.updated_at,
      });
    }

    return updates;
  }

  async sync(): Promise<{ log_id: string }> {
    if (!this.user.id) throw new Error("Not Authenticated");

    const timeStart = Date.now();

    const [cloud_blogs, local_blogs] = await Promise.all([
      this.fetchCloudBlogs(),
      this.fetchLocalBlogs(),
    ]);

    const cloudBlogMap = new Map(
      cloud_blogs.map((blog) => [blog.blog_id, blog]),
    );
    const localBlogMap = new Map(
      local_blogs.map((blog) => [blog.blog_id, blog]),
    );

    const sorted_local_blogs = local_blogs.sort((a, b) => {
      if (a.parent_blog && !b.parent_blog) return 1;
      if (!a.parent_blog && b.parent_blog) return -1;
      return 0;
    });

    const syncLog = [];

    for (const local_blog of sorted_local_blogs) {
      const cloud_blog = cloudBlogMap.get(local_blog.blog_id);

      if (!cloud_blog) {
        if (local_blog.deleted_at === 0) {
          await this.save_to_cloud(local_blog);
          syncLog.push({
            blog_id: local_blog.blog_id,
            action: "Uploaded to cloud",
          });
        }
      } else {
        const conflictResult = await this.resolve_conflict(
          local_blog,
          cloud_blog,
        );
        syncLog.push({
          blog_id: local_blog.blog_id,
          action: `Conflict resolved: ${conflictResult}`,
        });
        await this.save_to_cloud(conflictResult);
      }
      cloudBlogMap.delete(local_blog.blog_id);
    }

    for (const [blog_id, cloud_blog] of cloudBlogMap) {
      if (!localBlogMap.has(blog_id) && cloud_blog.deleted_at === 0) {
        await this.save_to_local(cloud_blog);
        syncLog.push({ blog_id, action: "Downloaded from cloud" });
      }
    }

    const softDeletionResults = await this.soft_deletions(
      local_blogs,
      cloud_blogs,
    );
    softDeletionResults.forEach(({ toDeleteFromCloud, toDeleteFromLocal }) => {
      toDeleteFromCloud.forEach((blog_id) =>
        syncLog.push({ blog_id, action: "Deleted from cloud" }),
      );
      toDeleteFromLocal.forEach((blog_id) =>
        syncLog.push({ blog_id, action: "Deleted from local" }),
      );
    });

    const timeEnd = Date.now();
    const difference = TimeFormatter.difference(timeStart, timeEnd);

    const log = await dbClient.generateLog({
      type: "Sync",
      title: "Sync Blogs",
      content: {
        duration: difference,
        updatedBlogs: syncLog,
      },
    });

    return { log_id: log.id! };
  }

  private async soft_deletions(local: Blog[], cloud: Blog[]) {
    const cloudBlogMap = new Map(cloud.map((blog) => [blog.blog_id, blog]));

    const toDeleteFromCloud: string[] = [];
    const toDeleteFromLocal: string[] = [];

    for (const localBlog of local) {
      if (localBlog.deleted_at > 0) {
        if (cloudBlogMap.has(localBlog.blog_id)) {
          toDeleteFromCloud.push(localBlog.blog_id);
        }
        toDeleteFromLocal.push(localBlog.blog_id);
      }
    }

    for (const cloudBlog of cloud) {
      if (
        cloudBlog.deleted_at > 0 &&
        !local.find((blog) => blog.blog_id === cloudBlog.blog_id)
      ) {
        toDeleteFromLocal.push(cloudBlog.blog_id);
      }
    }

    await Promise.allSettled([
      this.delete_batch_from_cloud(toDeleteFromCloud),
      this.delete_batch_from_local(toDeleteFromLocal),
    ]);

    return [{ toDeleteFromCloud, toDeleteFromLocal }];
  }

  private async resolve_conflict(local: Blog, cloud: Blog): Promise<Blog> {
    // If cloud is newer, replace local
    if (local.updated_at < cloud.updated_at) {
      console.log(`Cloud version is newer, updating local.`);
      return cloud;
    }

    // If local is newer, replace cloud
    if (local.updated_at > cloud.updated_at) {
      console.log(`Local version is newer, updating cloud.`);
      return local;
    }

    // If timestamps are the same, deep merge
    console.log(`Conflict detected, merging.`);
    const mergedDoc = this.merge_tiptap_json(local, cloud);
    mergedDoc.updated_at = Date.now(); // Update timestamp
    return mergedDoc;
  }

  private merge_tiptap_json(localDoc: any, cloudDoc: any): any {
    const merged = { ...localDoc };

    // Merge content arrays (paragraphs)
    const localContent = localDoc.content || [];
    const cloudContent = cloudDoc.content || [];

    const mergedContent = [];

    for (
      let i = 0;
      i < Math.max(localContent.length, cloudContent.length);
      i++
    ) {
      const localPara = localContent[i];
      const cloudPara = cloudContent[i];

      if (!localPara) {
        mergedContent.push(cloudPara);
      } else if (!cloudPara) {
        mergedContent.push(localPara);
      } else {
        // Merge paragraph content if both exist
        mergedContent.push(this.merge_paragraphs(localPara, cloudPara));
      }
    }

    merged.content = mergedContent;
    return merged;
  }

  private merge_paragraphs(localPara: any, cloudPara: any): any {
    if (JSON.stringify(localPara) === JSON.stringify(cloudPara)) {
      return localPara; // No changes
    }

    const localText = localPara.content.map((c: any) => c.text).join("");
    const cloudText = cloudPara.content.map((c: any) => c.text).join("");

    if (localText === cloudText) {
      return localPara; // Same text, different structure—keep local.
    }

    // Compute the diff between local and cloud text
    const diff = dmp.diff_main(cloudText, localText);
    dmp.diff_cleanupSemantic(diff);

    // Convert diff output into merged content
    const mergedContent = diff.map(([op, text]) => {
      if (op === 1) return { type: "text", text: text, mark: "added" }; // Local addition
      if (op === -1) return { type: "text", text: text, mark: "removed" }; // Cloud-only content
      return { type: "text", text: text }; // Unchanged
    });

    return { ...localPara, content: mergedContent };
  }

  private async save_to_cloud(blog: Blog) {
    try {
      console.log(`Saving blog ${blog.blog_id} to cloud storage...`);

      if (blog.parent_blog === "") blog.parent_blog = null;

      const { error } = await this.supabase
        .from("blogs")
        .upsert(blog, { onConflict: "blog_id" });
      if (error) throw error;

      await this.db.blogs.update(blog.blog_id, {
        synced_at: Date.now(),
      });
      console.log(`✅ Blog ${blog.blog_id} successfully saved to cloud.`);
    } catch (error) {
      console.error(`❌ Error saving blog ${blog.blog_id} to cloud:`, error);
    }
  }

  private async save_to_local(blog: Blog) {
    try {
      await this.db.transaction("rw", this.db.blogs, async () => {
        console.log(`Saving blog ${blog.blog_id} to local storage...`);

        if (blog.parent_blog === null) blog.parent_blog = "";

        blog.is_pinned = blog.is_pinned ? 1 : 0;
        blog.is_featured = blog.is_featured ? 1 : 0;
        blog.is_archived = blog.is_archived ? 1 : 0;
        blog.is_preview = blog.is_preview ? 1 : 0;
        blog.is_on_explore = blog.is_on_explore ? 1 : 0;
        blog.is_published = blog.is_published ? 1 : 0;

        blog.synced_at = Date.now();

        await this.db.blogs.put(blog);
      });
      console.log(`✅ Blog ${blog.blog_id} successfully saved to local.`);
    } catch (error) {
      console.error(`❌ Error saving blog ${blog.blog_id} to local:`, error);
    }
  }

  private async delete_batch_from_local(blogIds: string[]) {
    if (blogIds.length === 0) return;
    try {
      console.log(`Deleting ${blogIds.length} blogs from local storage...`);
      await this.db.blogs.bulkDelete(blogIds);
      console.log(
        `✅ Successfully deleted ${blogIds.length} blogs from local storage.`,
      );
    } catch (error) {
      console.error("❌ Error deleting from local storage:", error);
    }
  }

  private async delete_batch_from_cloud(blogIds: string[]) {
    if (blogIds.length === 0) return;
    try {
      console.log(`Deleting ${blogIds.length} blogs from cloud...`);
      const { error } = await this.supabase
        .from("blogs")
        .delete()
        .in("blog_id", blogIds);
      if (error) throw error;
      console.log(
        `✅ Successfully deleted ${blogIds.length} blogs from cloud.`,
      );
    } catch (error) {
      console.error("❌ Error deleting from cloud:", error);
    }
  }

  async getSyncLog(id: string): Promise<Log | null> {
    return (await this.db.logs.get(id)) ?? null;
  }
}
