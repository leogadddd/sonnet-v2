import { getSupabase } from "@/lib/supabase/supabase-server";
import type { UserObject } from "@/lib/system/user/user";
import "server-only";

export async function getAccount(): Promise<UserObject | null> {
  const db = await getSupabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data: profile, error } = await db
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error || !profile || profile.is_banned || profile.is_deleted) return null;
  const [{ count }, { data: images }, { data: likes }] = await Promise.all([
    db
      .from("blogs")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id)
      .eq("deleted_at", 0),
    db.from("uploaded_images").select("file_size").eq("user_id", user.id),
    db.from("blog_likes").select("blog_id").eq("user_id", user.id),
  ]);
  return {
    id: user.id,
    username: profile.username,
    first_name: profile.first_name,
    last_name: profile.last_name,
    image_url: profile.image_url,
    email: user.email ?? "",
    is_verified: !!user.email_confirmed_at,
    plan: profile.plan,
    saved_blogs: profile.saved_blogs,
    liked_blogs: (likes ?? []).map((like) => like.blog_id),
    synced_blog_count: count ?? 0,
    total_storage_used: (images ?? []).reduce(
      (sum, image) => sum + image.file_size,
      0,
    ),
  };
}
