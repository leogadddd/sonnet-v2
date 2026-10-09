import { expect, test } from "@playwright/test";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
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
if (env.NEXT_PUBLIC_SUPABASE_URL !== "http://localhost:8000")
  throw new Error(
    "Browser tests only run against the disposable local backend.",
  );
const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);
const password = "Sonnet-workspace-test-2026!";
const stamp = Date.now();
const users: { id: string; email: string; client: SupabaseClient }[] = [];
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aE7sAAAAASUVORK5CYII=",
  "base64",
);
test.beforeAll(async () => {
  for (const name of ["alice", "bob"]) {
    const email = "sonnet-" + name + "-" + stamp + "@example.com";
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: name },
    });
    if (error || !data.user) throw error ?? new Error("No test user");
    const client = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false } },
    );
    const login = await client.auth.signInWithPassword({ email, password });
    if (login.error) throw login.error;
    users.push({ id: data.user.id, email, client });
  }
});
test.afterAll(async () => {
  for (const user of users) {
    const { data: images } = await admin
      .from("uploaded_images")
      .select("storage_path")
      .eq("user_id", user.id);
    if (images?.length)
      await admin.storage
        .from("images")
        .remove(images.map((image) => image.storage_path));
    await admin.from("uploaded_images").delete().eq("user_id", user.id);
    await admin.from("blogs").delete().eq("author_id", user.id);
    await admin.auth.admin.deleteUser(user.id);
  }
});
test("draft editing, cloud sync, images, publishing and account isolation", async ({
  page,
  request,
}) => {
  const [alice, bob] = users;
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(alice.email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page
    .getByRole("button", { name: "Create a new Blog", exact: true })
    .click();
  await expect(page).toHaveURL(/\/app\/[0-9a-f-]{36}$/);
  const blogId = new URL(page.url()).pathname.split("/").at(-1)!;
  const editor = page.locator(".tiptap");
  await expect(editor).toBeVisible();
  await editor.fill("A private draft that survives reload.");
  await expect
    .poll(async () => {
      return page.evaluate(async (id) => {
        const databases = await indexedDB.databases();
        const name = databases.find((db) => db.name === "SonnetDB:" + id)?.name;
        if (!name) return "";
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const r = indexedDB.open(name);
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        });
        const rows = await new Promise<{ content: { content_html: string } }[]>(
          (resolve, reject) => {
            const r = db.transaction("blogs").objectStore("blogs").getAll();
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
          },
        );
        db.close();
        return rows[0]?.content.content_html;
      }, alice.id);
    })
    .toContain("A private draft");
  await page.reload();
  await expect(editor).toContainText("A private draft");
  await editor.evaluate((element, bytes) => {
    const clipboard = new DataTransfer();
    clipboard.items.add(
      new File([new Uint8Array(bytes)], "inline.png", { type: "image/png" }),
    );
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: clipboard,
        bubbles: true,
        cancelable: true,
      }),
    );
  }, Array.from(png));
  await expect(editor.locator("img")).toHaveAttribute("src", /\/api\/images\//);
  await page.keyboard.press("Control+i");
  const syncDialog = page.getByRole("dialog", {
    name: "Sonnet Sync",
    exact: true,
  });
  await expect(syncDialog).toBeVisible();
  await syncDialog.getByRole("button", { name: "Sync", exact: true }).click();
  await expect(syncDialog.getByRole("status")).toContainText("synced");
  await page.keyboard.press("Escape");
  expect(
    (await alice.client.from("blogs").select("*").eq("blog_id", blogId)).data
      ?.length,
  ).toBe(1);
  expect(
    (await bob.client.from("blogs").select("*").eq("blog_id", blogId)).data,
  ).toEqual([]);
  expect(
    (
      await bob.client
        .from("blogs")
        .update({ title: "Stolen" })
        .eq("blog_id", blogId)
        .select()
    ).data,
  ).toEqual([]);
  expect(
    (
      await alice.client
        .from("blogs")
        .update({ author_id: bob.id })
        .eq("blog_id", blogId)
    ).error,
  ).toBeTruthy();
  expect(
    (
      await alice.client
        .from("users")
        .update({ plan: { currentPlan: "Pro" } })
        .eq("id", alice.id)
    ).error,
  ).toBeTruthy();
  expect(
    (await bob.client.from("users").select("*").eq("id", alice.id)).data,
  ).toEqual([]);
  const unauthenticated = await request.post("/api/upload?blog_id=" + blogId, {
    headers: { origin: "http://localhost:3000", "content-type": "image/png" },
    data: png,
  });
  expect(unauthenticated.status()).toBe(401);
  const forged = await page.request.post("/api/upload?blog_id=" + blogId, {
    headers: { origin: "http://localhost:3000", "content-type": "image/png" },
    data: "<svg onload='alert(1)'/>",
  });
  expect(forged.status()).toBe(415);
  const upload = await page.request.post("/api/upload?blog_id=" + blogId, {
    headers: { origin: "http://localhost:3000", "content-type": "image/png" },
    data: png,
  });
  expect(upload.status(), await upload.text()).toBe(200);
  const image = await upload.json();
  expect((await page.request.get(image.url)).status()).toBe(200);
  expect((await request.get(image.url)).status()).toBe(404);
  await page.keyboard.press("Control+p");
  const publishDialog = page.getByRole("dialog", {
    name: "Publish",
    exact: true,
  });
  await expect(publishDialog).toBeVisible();
  await publishDialog
    .getByRole("button", { name: "Publish", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Publish", exact: true })
    .click();
  await expect(
    publishDialog.getByRole("button", { name: "Unpublish", exact: true }),
  ).toBeVisible();
  expect((await request.get(image.url)).status()).toBe(200);
  expect(
    (await bob.client.rpc("toggle_blog_like", { target_blog: blogId })).error,
  ).toBeNull();
  expect(
    (
      await alice.client
        .from("blogs")
        .select("likes")
        .eq("blog_id", blogId)
        .single()
    ).data?.likes,
  ).toBe(1);
  expect(
    (await bob.client.rpc("toggle_blog_like", { target_blog: blogId })).error,
  ).toBeNull();
  expect(
    (
      await alice.client
        .from("blogs")
        .select("likes")
        .eq("blog_id", blogId)
        .single()
    ).data?.likes,
  ).toBe(0);
  const anonymousPage = await page.context().browser()!.newPage();
  await anonymousPage.goto("http://localhost:3000/blog/" + blogId);
  await expect(anonymousPage.locator(".tiptap")).toContainText(
    "A private draft",
  );
  await expect(anonymousPage.locator(".tiptap")).toHaveAttribute(
    "contenteditable",
    "false",
  );
  await anonymousPage.close();
  await publishDialog
    .getByRole("button", { name: "Unpublish", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Unpublish", exact: true })
    .click();
  await expect(
    publishDialog.getByRole("button", { name: "Publish", exact: true }),
  ).toBeVisible();
  expect((await request.get(image.url)).status()).toBe(404);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "add cover", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Cover image", exact: true })
    .locator('input[type="file"]')
    .setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: png });
  await expect(
    page.getByRole("img", { name: "Cover Image for the Blog", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Cover image", exact: true }),
  ).not.toBeVisible();
  await page.goto("/app/account");
  await page
    .getByLabel("Avatar", { exact: true })
    .setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: png });
  await expect(page.getByRole("status")).toHaveText("Avatar updated.");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByLabel("Email", { exact: true }).fill(bob.email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/" + blogId);
  await expect(
    page.getByText("Blog is not found!", { exact: true }),
  ).toBeVisible();
  expect((await page.request.get(image.url)).status()).toBe(404);
  expect(
    (
      await page.request.delete(image.url, {
        headers: { origin: "http://localhost:3000" },
      })
    ).status(),
  ).toBe(404);
  await page.goto("/app/account");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByLabel("Email", { exact: true }).fill(alice.email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/" + blogId);
  await expect(page.locator(".tiptap")).toContainText("A private draft");
});
