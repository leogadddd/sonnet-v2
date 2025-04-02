import { NextResponse } from "next/server";

import { redis } from "@/lib/redis/redis";
import { useSupabase as UseSupabase } from "@/lib/supabase/supabase-client";
import { EmailAddressJSON } from "@clerk/backend";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json(
      { error: "Missing user ID parameter" },
      { status: 400 },
    );
  }

  const cacheKey = `user_info:${userId}`;

  const cachedUser = await redis.get(cacheKey);
  if (cachedUser && typeof cachedUser === "object") {
    console.log(`⚠️ Cache hit for user ${userId}, returning cache`);
    return NextResponse.json(cachedUser);
  }

  console.log(`⚠️ Cache miss for user ${userId}, fetching from Supabase`);
  const supabase = await UseSupabase();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("is_deleted", false)
    .eq("deleted_at", 0)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Error fetching user", details: error },
      { status: 500 },
    );
  }

  const result = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    clerk_id: user.clerk_id,
    username: user.username,
    email_addresses: user.email_addresses.map(
      (email_object: EmailAddressJSON) => ({
        email: email_object.email_address,
        verified:
          email_object.verification?.status === "verified" ? true : false,
      }),
    ),
    image_url: user.image_url,
    verified: user.is_verified,
    synced_blogs: user.synced_blog_count,
    storage_used: user.total_storage_used,
  };

  await redis.set(cacheKey, JSON.stringify(result), { ex: 1800 });

  //
  console.log("");

  return NextResponse.json(result);
}
