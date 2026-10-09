"use client";

import React, { useEffect, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BlogItem as BlogItemDataType,
  getBlogItem,
} from "@/lib/explore/action/getBlogItem";
import { BlogData } from "@/lib/explore/action/getBlogs";
import { useUser } from "@/lib/store/use-user";
import { LikeBlog } from "@/lib/user/action/likeblog";
import { TimeFormatter, cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface BlogItemProps {
  blog: BlogData;
}

const BlogItem = ({ blog }: BlogItemProps) => {
  const router = useRouter();

  const { user, setUser } = useUser();
  const [data, setData] = useState<BlogItemDataType | null>(null);

  const handleOpenBlog = () => {
    router.push(`/blog/${data?.blog?.slug}`);
  };

  useEffect(() => {
    if (!blog) return;

    const fetchBlogItem = async () => {
      getBlogItem({ blog: blog }).then(setData);
    };

    fetchBlogItem();
  }, [blog]);

  if (data === null)
    return <Skeleton key={blog.blog_id} className="h-48 mt-2" />;

  return (
    <div className="py-6 pb-2 border-b">
      {/* UPPER */}
      <div className="flex items-center justify-between gap-x-1 text-xs">
        <div className="flex items-center gap-x-1">
          <Avatar className="h-6 w-6 mr-1">
            <AvatarImage src={data?.author?.image_url ?? undefined} />
          </Avatar>
          <h1 className="font-semibold">
            {data?.author?.first_name} {data?.author?.last_name}
          </h1>
          <p className="text-muted-foreground">posted on</p>
          <h1 className="font-semibold">{data?.category?.name}</h1>
        </div>
        <div className="flex items-center sm:hidden">
          <h4 className="text-muted-foreground">
            {TimeFormatter.timeAgo(data?.blog?.published_at ?? 0)}
          </h4>
        </div>
      </div>
      {/* MIDDLE */}
      <div className="flex gap-x-4 mt-3">
        <div className="flex flex-col gap-y-2 flex-1">
          <h1
            role="button"
            onClick={handleOpenBlog}
            className="flex items-center text-2xl sm:text-3xl font-semibold break-words cursor-pointer"
          >
            {data?.blog?.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data?.blog?.description}
          </p>
        </div>
        <div className="flex items-center justify-center">
          {data?.blog?.cover_url ? (
            <>
              <div className="overflow-hidden rounded-xl w-[200px] h-auto hidden sm:block">
                <Image
                  src={data?.blog?.cover_url ?? ""}
                  alt={`${data?.blog?.title}-cover`}
                  width={200}
                  height={200}
                />
              </div>
              <div className="overflow-hidden rounded-xl w-[100px] h-auto block sm:hidden">
                <Image
                  src={data?.blog?.cover_url ?? ""}
                  alt={`${data?.blog?.title}-cover`}
                  width={100}
                  height={100}
                />
              </div>
            </>
          ) : (
            <span className="text-6xl flex items-center">
              {data?.blog?.icon}
            </span>
          )}
        </div>
      </div>
      {/* BOTTOM */}
      <div className="mt-3 h-8 flex gap-x-4 justify-between text-muted-foreground">
        <div className="hidden items-center sm:flex">
          <h4 className="text-xs text-muted-foreground">
            {TimeFormatter.timeAgo(data?.blog?.published_at ?? 0)}
          </h4>
        </div>
        <div className="flex items-center flex-1 gap-x-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={!user || !data.blog}
            aria-label={
              user?.liked_blogs.includes(data.blog?.id ?? "")
                ? "Unlike blog"
                : "Like blog"
            }
            onClick={async () => {
              if (!data.blog) return;
              try {
                const updated = await LikeBlog(data.blog.id);
                if (updated) {
                  setUser(updated);
                  const next = await getBlogItem({ blog });
                  setData(next);
                }
              } catch (cause) {
                toast.error(
                  cause instanceof Error
                    ? cause.message
                    : "Unable to like blog.",
                );
              }
            }}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                user?.liked_blogs.includes(data.blog?.id ?? "") &&
                  "text-red-500 fill-current",
              )}
            />
            {data.blog?.likes ?? 0}
          </Button>
        </div>
        <div className="items-center hidden sm:flex">
          <h4 className="text-xs text-muted-foreground">
            {data?.blog?.read_time} min
            {(data?.blog?.read_time ?? 0) > 1 ? "s" : ""} read
          </h4>
        </div>
      </div>
    </div>
  );
};

export default BlogItem;
