"use server";

import { BlogData } from "./getBlogs";
import { redis } from "@/lib/redis/redis";
import { useSupabase as UseSupabase } from "@/lib/supabase/supabase-client";

interface GetBlogItemProps {
  force?: boolean;
  blog: BlogData;
}

export type BlogItem = {
  author: {
    id: string;
    first_name: string;
    last_name: string;
    image_url: string;
  } | null;
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
  category: {
    id: string;
    name: string;
  } | null;
};

export const getBlogItem = async ({
  force = false,
  blog,
}: GetBlogItemProps): Promise<BlogItem | null> => {
  if (!blog) {
    console.error("Missing BlogItem Parameter");
    return null;
  }

  const cacheKey = `explore:blog-item:${blog.blog_id}`;
  console.log(cacheKey);

  if (!force) {
    const cachedBlogItem = await redis.get(cacheKey);

    if (cachedBlogItem && typeof cachedBlogItem === "object") {
      return cachedBlogItem as BlogItem;
    }
  }

  const supabase = UseSupabase();

  const author = supabase
    .from("users")
    .select("id,first_name,last_name,image_url")
    .eq("id", blog.author_id)
    .single();

  const category = supabase
    .from("categories")
    .select("id,name")
    .eq("id", blog.category_id)
    .single();

  const _blog = supabase
    .from("blogs")
    .select(
      "blog_id,icon,slug,title,description,cover_image,read_time,likes,comments,shares,published_at",
    )
    .eq("blog_id", blog.blog_id)
    .single();

  const { data: authorData, error: authorError } = await author;
  const { data: categoryData, error: categoryError } = await category;
  const { data: blogData, error: blogError } = await _blog;

  if (authorError || categoryError || blogError) {
    console.error("Supabase Errors:", {
      authorError,
      categoryError,
      blogError,
    });
    return null;
  }
  const cover_image = JSON.parse(blogData.cover_image);
  delete blogData.cover_image;

  const result = {
    author: authorData,
    category: categoryData,
    blog: {
      ...blogData,
      id: blogData.blog_id,
      cover_url: cover_image ? cover_image.image_url : null,
    },
  } as BlogItem;

  console.log(result);

  await redis.set(cacheKey, JSON.stringify(result), { ex: 900 });

  return result;
};
