"use server";

import { getSupabase } from "@/lib/supabase/supabase-server";

export type TabData = { id: string; name: string; blogs: string[] };
export interface GetTabsProps {
  force?: boolean;
}
export async function getTabs(): Promise<TabData[]> {
  const db = await getSupabase();
  const { data, error } = await db
    .from("categories")
    .select("id,name")
    .order("name");
  if (error) throw new Error("Unable to load categories.");
  return (data ?? []).map((row) => ({ ...row, blogs: [] }));
}
