"use server";

import type { TabData } from "./getTabs";
import { getSupabase } from "@/lib/supabase/supabase-server";

export type BlogData = {
  blog_id: string;
  category_id: string;
  author_id: string;
};
export interface GetBlogsProps {
  force?: boolean;
  tab?: TabData | null;
  limit?: number;
  cursor?: string | null;
}
export async function getBlogs({
  tab = null,
  limit = 10,
  cursor = null,
}: GetBlogsProps = {}): Promise<BlogData[]> {
  if (!tab) return [];
  const db = await getSupabase();
  let query = db
    .from("blogs")
    .select("blog_id,category_id,author_id")
    .eq("category_id", tab.id)
    .eq("is_published", true)
    .eq("is_archived", false)
    .eq("is_on_explore", true)
    .eq("deleted_at", 0)
    .order("blog_id", { ascending: false })
    .limit(Math.max(1, Math.min(50, Math.floor(limit))));
  if (cursor) query = query.lt("blog_id", cursor);
  const { data, error } = await query;
  if (error) throw new Error("Unable to load blogs.");
  return data ?? [];
}
