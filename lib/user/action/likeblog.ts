"use server";

import { getAccount } from "@/lib/auth/account";
import { getSupabase } from "@/lib/supabase/supabase-server";

export async function LikeBlog(blog_id: string) {
  const db = await getSupabase();
  if (!(await getAccount())) throw new Error("Sign in to like blogs.");
  const { error } = await db.rpc("toggle_blog_like", { target_blog: blog_id });
  if (error) throw new Error("Unable to update this like.");
  return getAccount();
}
