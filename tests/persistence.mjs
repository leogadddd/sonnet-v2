import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .trim()
    .split("\n")
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);
assert.equal(
  env.NEXT_PUBLIC_SUPABASE_URL,
  "http://localhost:8000",
  "Only use the disposable local backend.",
);
const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);
const email = "sonnet-persistence-" + Date.now() + "@example.com";
const password = "Persistence-test-password-2026!";
const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error || !data.user) throw error ?? new Error("No test user");
const user = data.user;
const blogId = crypto.randomUUID();
const objectPath = user.id + "/" + crypto.randomUUID() + ".png";
try {
  const { error: blogError } = await admin.from("blogs").insert({
    blog_id: blogId,
    author_id: user.id,
    slug: blogId,
    title: "Persistence test",
    created_at: Date.now(),
    updated_at: Date.now(),
  });
  if (blogError) throw blogError;
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aE7sAAAAASUVORK5CYII=",
    "base64",
  );
  const { error: imageError } = await admin.storage
    .from("images")
    .upload(objectPath, bytes, { contentType: "image/png" });
  if (imageError) throw imageError;
  execFileSync(process.execPath, ["scripts/backend.mjs", "stop"], {
    stdio: "inherit",
  });
  execFileSync(process.execPath, ["scripts/backend.mjs", "start"], {
    stdio: "inherit",
  });
  const client = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false } },
  );
  let signIn = await client.auth.signInWithPassword({ email, password });
  // A socket pooled before the restart can fail once when reused.
  for (let attempt = 0; signIn.error?.status === 0 && attempt < 5; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    signIn = await client.auth.signInWithPassword({ email, password });
  }
  assert.equal(signIn.error, null);
  assert.equal(
    (await client.from("blogs").select("title").eq("blog_id", blogId).single())
      .data?.title,
    "Persistence test",
  );
  const download = await admin.storage.from("images").download(objectPath);
  assert.equal(download.error, null);
  assert.deepEqual(Buffer.from(await download.data.arrayBuffer()), bytes);
  console.log("PASS: account, blog, and image survived backend stop/start.");
} finally {
  await admin.storage.from("images").remove([objectPath]);
  await admin
    .from("blogs")
    .delete()
    .eq("blog_id", blogId)
    .eq("author_id", user.id);
  await admin.auth.admin.deleteUser(user.id);
}
