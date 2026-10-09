"use server";

import type { BlogData } from "./getBlogs";
import { getSupabase } from "@/lib/supabase/supabase-server";
import type { PublicProfile } from "@/lib/system/user/user";

export type BlogItem = {
  author: PublicProfile | null;
  blog: {
    id: string;
    icon: string;
    title: string;
    description: string;
    cover_url: string | null;
    read_time: number;
    likes: number;
    comments: number;
    shares: number;
    published_at: number;
    slug: string;
  } | null;
  category: { id: string; name: string } | null;
};
export async function getBlogItem({
  blog,
}: {
  force?: boolean;
  blog: BlogData;
}): Promise<BlogItem | null> {
  const db = await getSupabase();
  const { data: row } = await db
    .from("blogs")
    .select("*")
    .eq("blog_id", blog.blog_id)
    .eq("is_published", true)
    .eq("is_archived", false)
    .eq("deleted_at", 0)
    .maybeSingle();
  if (!row) return null;
  const [{ data: author }, { data: category }] = await Promise.all([
    db
      .from("public_profiles")
      .select("*")
      .eq("id", row.author_id)
      .maybeSingle(),
    db
      .from("categories")
      .select("id,name")
      .eq("id", row.category_id)
      .maybeSingle(),
  ]);
  return {
    author,
    category,
    blog: {
      id: row.blog_id,
      icon: row.icon,
      title: row.title,
      description: row.description,
      cover_url: row.cover_image?.image_url ?? null,
      read_time: row.read_time,
      likes: row.likes,
      comments: row.comments,
      shares: row.shares,
      published_at: row.published_at,
      slug: row.slug,
    },
  };
}
