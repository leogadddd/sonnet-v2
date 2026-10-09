import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
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
const email = "sonnet-test-" + Date.now() + "@example.com";
const password = "Sonnet-test-password-2026!";
test("registration and email confirmation open an isolated workspace", async ({
  page,
  request,
}) => {
  await page.goto("/sign-up");
  await page.getByLabel("Name", { exact: true }).fill("Test Writer");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  let messageId = "";
  await expect
    .poll(async () => {
      const result = await request.get("http://localhost:8025/api/v1/messages");
      const json = await result.json();
      messageId = json.messages?.find(
        (message: { To: { Address: string }[] }) =>
          message.To.some((to) => to.Address === email),
      )?.ID;
      return !!messageId;
    })
    .toBe(true);
  const mail = await (
    await request.get("http://localhost:8025/api/v1/message/" + messageId)
  ).json();
  const link = mail.HTML.match(/href="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&");
  expect(link).toBeTruthy();
  await page.goto(link);
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText(/Test Writer!/)).toBeVisible();
  const account = await (
    await page.request.get("/api/user?id=another-user")
  ).json();
  expect(account.email).toBe(email);

  await page.goto("/app/account");
  await expect(
    page.getByRole("heading", { name: "Your account" }),
  ).toBeVisible();
  await page.getByLabel("First name", { exact: true }).fill("Updated Writer");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status")).toHaveText("Profile updated.");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  expect((await page.request.get("/api/user")).status()).toBe(401);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/sign-in/);
  await page.goto("/forgot-password");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByRole("button", { name: "Send reset link", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("password reset link");
  let resetId = "";
  await expect
    .poll(async () => {
      const json = await (
        await request.get("http://localhost:8025/api/v1/messages")
      ).json();
      resetId = json.messages?.find(
        (message: { ID: string; To: { Address: string }[]; Subject: string }) =>
          message.ID !== messageId &&
          message.To.some((to) => to.Address === email) &&
          /reset/i.test(message.Subject),
      )?.ID;
      return !!resetId;
    })
    .toBe(true);
  const resetMail = await (
    await request.get("http://localhost:8025/api/v1/message/" + resetId)
  ).json();
  const resetLink = resetMail.HTML.match(/href="([^"]+)"/)?.[1]?.replaceAll(
    "&amp;",
    "&",
  );
  await page.goto(resetLink);
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByLabel("Password", { exact: true }).fill(password + "-new");
  await page
    .getByRole("button", { name: "Save password", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sign-in/);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByText("Invalid login credentials", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill(password + "-new");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.goto(resetLink);
  await expect(page).toHaveURL(/\/auth\/error/);
});
test.afterAll(async () => {
  const { data } = await admin.auth.admin.listUsers();
  const user = data.users.find((user) => user.email === email);
  if (user) await admin.auth.admin.deleteUser(user.id);
});
