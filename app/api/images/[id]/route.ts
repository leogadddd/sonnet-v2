import { NextResponse } from "next/server";

import { getAccount } from "@/lib/auth/account";
import { adminClient } from "@/lib/supabase/admin";
import { getSupabase } from "@/lib/supabase/supabase-server";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getSupabase();
  const { data: image } = await db
    .from("uploaded_images")
    .select("storage_path,content_type")
    .eq("id", id)
    .maybeSingle();
  if (!image)
    return new Response("Image unavailable", { status: 404, headers });
  const { data, error } = await db.storage
    .from("images")
    .download(image.storage_path);
  if (error || !data)
    return new Response("Image unavailable", { status: 404, headers });
  return new Response(data, {
    headers: {
      ...headers,
      "Content-Type": image.content_type,
      "Content-Disposition": "inline",
    },
  });
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return new Response("Invalid origin", { status: 403 });
  const user = await getAccount();
  if (!user) return new Response("Sign in to continue", { status: 401 });
  const { id } = await params;
  const db = await getSupabase();
  const { data: image } = await db
    .from("uploaded_images")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!image) return new Response("Image unavailable", { status: 404 });
  const admin = adminClient();
  const { error } = await admin.storage
    .from("images")
    .remove([image.storage_path]);
  if (error) return new Response("Unable to delete image", { status: 500 });
  const { error: deleteError } = await admin
    .from("uploaded_images")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (deleteError)
    return new Response("Unable to delete image details", { status: 500 });
  return NextResponse.json({ deleted: true }, { headers });
}
