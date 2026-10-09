import { safeRedirect } from "../lib/auth/redirect";
import {
  MAX_IMAGE_BYTES,
  imageType,
  readImage,
} from "../lib/storage/validation";
import { fromCloud, toCloud } from "../lib/system/blog-serialization";
import type Blog from "../lib/system/localdb/blog";
import { mergeAttributes } from "@tiptap/core";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

test("redirects cannot escape the app", () => {
  for (const value of [
    "https://evil.test",
    "//evil.test",
    "/\\\\evil.test",
    "/\nevil.test",
    "javascript:alert(1)",
  ]) {
    assert.equal(safeRedirect(value), "/app");
  }
  assert.equal(safeRedirect("/app?draft=1"), "/app?draft=1");
});
test("Tiptap backport blocks inherited executable attributes in ESM and CJS", () => {
  const require = createRequire(import.meta.url);
  for (const merge of [
    mergeAttributes,
    require("@tiptap/core").mergeAttributes,
  ]) {
    const attrs = merge(
      JSON.parse(
        '{"__proto__":{"onerror":"alert(1)","src":"evil"},"class":"a"}',
      ),
    );
    assert.equal(Object.getPrototypeOf(attrs), Object.prototype);
    assert.equal(attrs.onerror, undefined);
    assert.equal(attrs.src, undefined);
    const keys = [];
    for (const key in attrs) keys.push(key);
    assert.ok(!keys.includes("onerror"));
    assert.equal(attrs.class, "a");
  }
});
test("uploads reject executable formats and oversized streams", async () => {
  assert.equal(
    imageType(new TextEncoder().encode("<svg onload='alert(1)'>")),
    null,
  );
  assert.equal(
    imageType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]))?.mime,
    "image/png",
  );
  await assert.rejects(
    readImage(
      new Request("http://localhost/upload", {
        method: "POST",
        headers: { "content-length": String(MAX_IMAGE_BYTES + 1) },
        body: "x",
      }),
    ),
  );
});
test("sync preserves content and converts flags without sending protected counters", () => {
  const blog = {
    blog_id: "one",
    parent_blog: "",
    is_published: 1,
    likes: 999,
    is_featured: 1,
    content: { content_json: '{"type":"doc"}', content_html: "<p>Hello</p>" },
  } as Blog;
  const row = toCloud(blog);
  assert.equal(row.is_published, true);
  assert.equal(row.parent_blog, null);
  assert.ok(!("likes" in row));
  assert.ok(!("is_featured" in row));
  assert.deepEqual(fromCloud(row).content, blog.content);
  assert.equal(fromCloud(row).is_published, 1);
});
