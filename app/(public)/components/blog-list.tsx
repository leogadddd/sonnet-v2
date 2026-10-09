"use client";

import { useEffect, useState } from "react";

import BlogItem from "./blog-item";
import { Button } from "@/components/ui/button";
import { type BlogData, getBlogs } from "@/lib/explore/action/getBlogs";
import { useExplore } from "@/lib/store/use-explore";

function CategoryBlogs({
  tab,
}: {
  tab: NonNullable<ReturnType<typeof useExplore.getState>["currentTab"]>;
}) {
  const [blogs, setBlogs] = useState<BlogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setMore] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getBlogs({ tab })
      .then((result) => {
        if (active) {
          setBlogs(result);
          setMore(result.length === 10);
        }
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab]);
  async function more() {
    setLoading(true);
    setError("");
    try {
      const result = await getBlogs({ tab, cursor: blogs.at(-1)?.blog_id });
      setBlogs((current) => [...current, ...result]);
      setMore(result.length === 10);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load blogs.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="mt-3 border-t">
      {blogs.map((blog) => (
        <BlogItem key={blog.blog_id} blog={blog} />
      ))}
      {loading && (
        <p role="status" className="py-8">
          Loading blogs…
        </p>
      )}
      {error && (
        <p role="alert" className="py-8">
          {error}
        </p>
      )}
      {!loading && !error && !blogs.length && (
        <p className="py-12 text-center text-muted-foreground">
          No published blogs yet. Your next idea could be the first.
        </p>
      )}
      {hasMore && (
        <Button disabled={loading} onClick={more}>
          Load more
        </Button>
      )}
    </div>
  );
}
export default function BlogList() {
  const tab = useExplore((state) => state.currentTab);
  return tab ? (
    <CategoryBlogs key={tab.id} tab={tab} />
  ) : (
    <p className="py-8">Choose a category to explore.</p>
  );
}
