"use client";

import React, { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import BlogItem from "./blog-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getBlogs } from "@/lib/explore/action/getBlogs";
import { useExplore } from "@/lib/store/use-explore";

const BlogList = () => {
  const {
    currentTab,
    blogs,
    cursor,
    hasMore,
    isLoadingMore,
    loadMoreBlogs,
    setLoadingMore,
    reset, // Use reset function
  } = useExplore();

  const pathname = usePathname();
  const [isFetching, setIsFetching] = useState(false); // Flag to track fetch status

  const loadBlogs = () => {
    if (isFetching) return; // Skip fetching if already fetching
    setIsFetching(true); // Set fetching flag
    setLoadingMore(true);
    getBlogs({ tab: currentTab, limit: 10, cursor })
      .then((newBlogs) => {
        loadMoreBlogs(newBlogs);
      })
      .finally(() => {
        setIsFetching(false); // Reset fetching flag when done
      });
  };

  // Ensure that blogs are loaded only once or when `currentTab` changes
  useEffect(() => {
    if (!currentTab || blogs.length > 0) return; // Skip if currentTab is null or blogs are already loaded
    loadBlogs();
  }, [currentTab, blogs.length]);

  // Reset Zustand store on pathname change
  useEffect(() => {
    reset(); // Clear store on pathname change
  }, [pathname, reset]);

  if (blogs.length === 0 || blogs === undefined || blogs === null)
    return (
      <div className="mt-3 pt-3 border-t flex flex-col">
        {[...Array(3)].map((_, index) => (
          <Skeleton key={index} className="h-48 mt-2" />
        ))}
        <Skeleton key={"loadmore-skeleton"} className="h-12 mt-2" />
      </div>
    );

  return (
    <div className="mt-3 pt-3 border-t flex flex-col">
      {blogs.length !== 0 &&
        blogs.map((blog) => <BlogItem key={blog.blog_id} blog={blog} />)}
      {blogs.length !== 0 &&
        (hasMore ? (
          <button
            role="button"
            disabled={isLoadingMore}
            onClick={() => loadBlogs()}
            className="flex mt-12 items-center justify-center text-center py-2 text-sm text-muted-foreground cursor-pointer hover:bg-muted-foreground/8 rounded-lg transition-colors"
          >
            {isLoadingMore ? <Spinner /> : "Load More"}
          </button>
        ) : (
          <div className="flex items-center justify-center text-center h-24">
            <h1 className="text-sm text-muted-foreground/50">
              you have reached the end!
            </h1>
          </div>
        ))}
    </div>
  );
};

export default BlogList;
