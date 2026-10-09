import type Blog from "./localdb/blog";

export const booleanFields = [
  "is_pinned",
  "is_featured",
  "is_published",
  "is_archived",
  "is_preview",
  "is_on_explore",
] as const;
const writableFields = [
  "blog_id",
  "author_id",
  "parent_blog",
  "title",
  "slug",
  "description",
  "content",
  "category_id",
  "cover_image",
  "icon",
  "read_time",
  "is_pinned",
  "is_published",
  "is_archived",
  "is_preview",
  "is_on_explore",
  "published_at",
  "created_at",
  "updated_at",
  "archived_at",
  "deleted_at",
  "synced_at",
] as const;
export function toCloud(blog: Blog): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const key of writableFields) row[key] = blog[key];
  for (const key of booleanFields) if (key in row) row[key] = !!blog[key];
  row.parent_blog = blog.parent_blog || null;
  return row;
}
export function fromCloud(row: Record<string, unknown>): Blog {
  const blog = { ...row } as unknown as Blog;
  for (const key of booleanFields) blog[key] = row[key] ? 1 : 0;
  blog.parent_blog = blog.parent_blog || "";
  return blog;
}
