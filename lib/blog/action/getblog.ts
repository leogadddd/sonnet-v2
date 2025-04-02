"use server";

import { redis } from "@/lib/redis/redis";
import { useSupabase as UseSupabase } from "@/lib/supabase/supabase-client";
import Blog from "@/lib/system/localdb/blog";
import { UserObject } from "@/lib/system/user/user";

interface GetBlogProps {
  force?: boolean;
  slug?: string;
}

export type BlogData = {
  blog: Blog;
  author: UserObject;
};

export const GetBlog = async ({
  force = false,
  slug = "",
}: GetBlogProps = {}): Promise<BlogData | null> => {
  if (!slug) {
    console.error("Missing Slug Parameter");
    return null;
  }

  const cacheKey = `blog:${slug}`;

  if (!force) {
    const cachedBlog = await redis.get(cacheKey);
    if (cachedBlog && typeof cachedBlog === "object") {
      return cachedBlog as BlogData;
    }
  }

  const supabase = UseSupabase();

  // Fetch blog first, then author concurrently
  const { data: blogData, error: blogError } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("deleted_at", 0)
    .single();

  if (blogError) {
    console.error("Error Fetching Blog Data:", blogError);
    return null;
  }

  // Fetch author in parallel to avoid waiting
  const [authorDataResult] = await Promise.all([
    supabase.from("users").select("*").eq("id", blogData.author_id).single(),
  ]);

  if (authorDataResult.error) {
    console.error("Error Fetching Author Data:", authorDataResult.error);
    return null;
  }

  const result = {
    blog: blogData,
    author: authorDataResult.data,
  };

  await redis.set(cacheKey, JSON.stringify(result), { ex: 900 });

  return result as BlogData;
};
