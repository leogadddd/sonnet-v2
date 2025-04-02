"use server";

import { TabData } from "./getTabs";
import { redis } from "@/lib/redis/redis";
import { useSupabase as UseSupabase } from "@/lib/supabase/supabase-client";

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

export const getBlogs = async ({
  force = false,
  tab = null,
  limit = 10,
  cursor = null,
}: GetBlogsProps = {}) => {
  if (!tab) {
    console.error(`Missing Tab Parameter`);
    return [];
  }

  const cacheKey = `explore:${tab.name}:blogs:cursor:${cursor || "first"}`;

  if (!force) {
    const cachedBlogs = await redis.get(cacheKey);
    if (cachedBlogs && typeof cachedBlogs === "object") {
      return cachedBlogs as BlogData[];
    }
  }

  const supabase = UseSupabase();

  let query = supabase
    .from("blogs")
    .select("blog_id,author_id,category_id")
    .eq("category_id", tab.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.gt("blog_id", cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.log("Error Fetching Blog Data", error);
    return [];
  }

  await redis.set(cacheKey, JSON.stringify(data), { ex: 900 });

  return data as BlogData[];
};
