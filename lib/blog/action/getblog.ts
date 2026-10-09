"use server";

import { getSupabase } from "@/lib/supabase/supabase-server";
import { fromCloud } from "@/lib/system/blog-serialization";
import type Blog from "@/lib/system/localdb/blog";
import type { PublicProfile } from "@/lib/system/user/user";

export type BlogData = { blog: Blog; author: PublicProfile };
export async function GetBlog({
  slug = "",
}: { force?: boolean; slug?: string } = {}): Promise<BlogData | null> {
  if (!slug) return null;
  const db = await getSupabase();
  const { data: blog, error } = await db
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_archived", false)
    .eq("deleted_at", 0)
    .maybeSingle();
  if (error || !blog) return null;
  const { data: author } = await db
    .from("public_profiles")
    .select("*")
    .eq("id", blog.author_id)
    .maybeSingle();
  return author ? { blog: fromCloud(blog), author } : null;
}
