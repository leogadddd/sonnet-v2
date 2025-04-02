"use server";

import { redis } from "@/lib/redis/redis";
import { useSupabase as UseSupabase } from "@/lib/supabase/supabase-client";

export type TabData = {
  id: string;
  name: string;
  blogs: string[];
};

export interface GetTabsProps {
  force?: boolean;
}

export const getTabs = async ({ force = false }: GetTabsProps = {}) => {
  const cacheKey = `explore:tabs`;

  if (!force) {
    const cachedTabs = await redis.get(cacheKey);
    if (cachedTabs && typeof cachedTabs === "object") {
      return cachedTabs as TabData[];
    }
  }

  const supabase = UseSupabase();

  const { data: published, error: publishedErrors } = await supabase
    .from("blog_categories")
    .select("*");

  if (publishedErrors) {
    console.error("Error Fetching Published Categories", publishedErrors);
    return [];
  }

  const ids = published.map((c) => c.category_id);

  if (ids.length === 0) return [];

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .in("id", ids);

  if (categoriesError) {
    console.error("Error Fetching Categories:", categoriesError);
    return [];
  }

  const result = [
    ...categories.map((c) => ({
      id: c.id,
      name: c.name,
      blogs: [
        ...published
          .filter((p) => p.category_id === c.id)
          .map((p) => p.blog_id),
      ],
    })),
  ] as TabData[];

  await redis.set(cacheKey, JSON.stringify(result), { ex: 900 });

  return result;
};
