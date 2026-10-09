import { NextResponse } from "next/server";

import { getAccount } from "@/lib/auth/account";
import { imageType, readImage } from "@/lib/storage/validation";
import { adminClient } from "@/lib/supabase/admin";
import { getSupabase } from "@/lib/supabase/supabase-server";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const user = await getAccount();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to upload images." },
      { status: 401 },
    );
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind") === "avatar" ? "avatar" : "blog";
  const blogId = kind === "blog" ? params.get("blog_id") : null;
  const db = await getSupabase();
  if (kind === "blog") {
    const { data } = await db
      .from("blogs")
      .select("blog_id")
      .eq("blog_id", blogId)
      .eq("author_id", user.id)
      .eq("deleted_at", 0)
      .maybeSingle();
    if (!data)
      return NextResponse.json(
        { error: "Save this blog to the cloud before uploading." },
        { status: 403 },
      );
  }
  let bytes: Uint8Array;
  try {
    bytes = await readImage(request);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 413 },
    );
  }
  const type = imageType(bytes);
  if (!type)
    return NextResponse.json(
      { error: "Choose a PNG, JPEG, GIF, or WebP image." },
      { status: 415 },
    );
  const id = crypto.randomUUID();
  const storagePath = user.id + "/" + id + "." + type.extension;
  const url = "/api/images/" + id;
  const admin = adminClient();
  const { error: uploadError } = await admin.storage
    .from("images")
    .upload(storagePath, bytes, { contentType: type.mime, upsert: false });
  if (uploadError)
    return NextResponse.json(
      { error: "Image upload failed." },
      { status: 500 },
    );
  const { error } = await admin.from("uploaded_images").insert({
    id,
    user_id: user.id,
    blog_id: blogId,
    kind,
    storage_path: storagePath,
    image_url: url,
    content_type: type.mime,
    file_size: bytes.length,
    uploaded_at: Date.now(),
  });
  if (error) {
    await admin.storage.from("images").remove([storagePath]);
    return NextResponse.json(
      { error: "Could not save image details." },
      { status: 500 },
    );
  }
  return NextResponse.json(
    { id, url, size: bytes.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}
