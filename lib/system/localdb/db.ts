import Blog from "./blog";
import Dexie, { type EntityTable } from "dexie";

export default class SonnetDB extends Dexie {
  blogs!: EntityTable<Blog, "blog_id">; // Temporarily use `any`

  constructor() {
    super("SonnetDB");
    this.version(1).stores({
      blogs:
        "blog_id, [is_archived+deleted_at], [slug+deleted_at], [blog_id+deleted_at], [parent_blog+is_archived+is_pinned], is_preview, is_archived, parent_blog, [parent_blog+is_archived+deleted_at], updated_at, archived_at, deleted_at, slug",
    });

    // Lazy import inside a function
    import("./blog").then((mod) => {
      this.blogs.mapToClass(mod.default);
    });
  }
}
