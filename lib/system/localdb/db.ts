import Blog from "./blog";
import Log from "./log";
import Dexie, { type EntityTable } from "dexie";

export default class SonnetDB extends Dexie {
  blogs!: EntityTable<Blog, "blog_id">;
  logs!: EntityTable<Log, "id">;
  constructor(accountId: string) {
    super("SonnetDB:" + accountId, { autoOpen: false });
    this.version(1).stores({
      blogs:
        "blog_id, [is_archived+deleted_at], [slug+deleted_at], [blog_id+deleted_at], [parent_blog+is_archived+is_pinned], is_preview, is_archived, parent_blog, [parent_blog+is_archived+deleted_at], updated_at, archived_at, deleted_at, slug",
      logs: "id, call_from, created_at, type, user_id",
    });
    this.blogs.mapToClass(Blog);
    this.logs.mapToClass(Log);
  }
}
