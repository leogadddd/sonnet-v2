import Blog from "./blog";
import Log from "./log";
import Dexie, { type EntityTable } from "dexie";

export default class SonnetDB extends Dexie {
  blogs!: EntityTable<Blog, "blog_id">; // Temporarily use `any`
  logs!: EntityTable<Log, "id">;

  constructor() {
    super("SonnetDB");
    this.version(1).stores({
      blogs:
        "blog_id, [is_archived+deleted_at], [slug+deleted_at], [blog_id+deleted_at], [parent_blog+is_archived+is_pinned], is_preview, is_archived, parent_blog, [parent_blog+is_archived+deleted_at], updated_at, archived_at, deleted_at, slug",
      logs: "id, call_from, created_at, type, user_id",
    });

    // Lazy import inside a function
    import("./blog").then((mod) => {
      this.blogs.mapToClass(mod.default);
    });

    import("./log").then((mod) => {
      this.logs.mapToClass(mod.default);
    });

    this.cleanupOldLogs();

    setInterval(() => this.cleanupOldLogs(), 24 * 60 * 60 * 1000);
  }

  async cleanupOldLogs() {
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
    const oldLogs = await this.logs
      .where("created_at")
      .below(oneMonthAgo)
      .toArray();

    if (oldLogs.length > 0) {
      console.log(`Deleting ${oldLogs.length} old logs...`);
      await this.logs.bulkDelete(oldLogs.map((log) => log.id));
    }
  }
}
