"use client";

import React, { useEffect, useRef, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import Blog from "@/lib/system/localdb/blog";
import dbClient, { RecentBlogs } from "@/lib/system/localdb/client";
import { TimeFormatter, cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock1,
  Clock2,
  Clock3,
  Clock4,
  Clock5,
  Clock6,
  Clock7,
  Clock8,
  Clock9,
  Clock10,
  Clock11,
  Clock12,
  Divide,
  Plus,
} from "lucide-react";

const RecentBlogsList = () => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const router = useRouter();
  const blogs = RecentBlogs() || [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });

      setTimeout(checkScroll, 600);
    }
  };

  const createNewBlog = async () => {
    await dbClient
      .createBlog({
        title: "New Blog",
      })
      .then(({ id }: { id: string | null }) => {
        router.push(`/app/${id}`);
      });
  };

  useEffect(() => {
    const handleResize = () => {
      setTimeout(checkScroll, 100);
    };

    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
    }
    window.addEventListener("resize", handleResize);

    setTimeout(checkScroll, 100);

    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [blogs]);

  return (
    <div className="relative mt-4 w-full">
      {/* Section Title */}
      <div>
        <h1 className="text-muted-foreground flex items-center text-sm">
          <ClockIcon className="h-4 w-4 mr-2" />
          Recent Blogs
        </h1>
      </div>

      {/* Scrollable Blog List with Fade Effect */}
      <div className="relative">
        {/* Left Fade Effect */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-[#141414] to-transparent transition-opacity duration-500 pointer-events-none",
            canScrollLeft ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="mt-3 pb-3 flex gap-x-3 overflow-x-auto max-w-full scroll-smooth snap-x snap-mandatory"
        >
          {blogs && (
            <div
              role="button"
              key={`Create a new Blog Button`}
              onClick={createNewBlog}
              className="snap-start shrink-0 w-48 cursor-pointer min-h-32"
            >
              <div className="h-full hover:bg-accent/5 bg-background text-muted-foreground flex flex-col items-center justify-center border border-accent/75 rounded-xl">
                <Plus />
                <h1 className="text-sm ">Create a new Blog</h1>
              </div>
            </div>
          )}
          {blogs.toReversed().map((blog, index) => (
            <div
              key={index}
              role="button"
              className="snap-start shrink-0 w-48 cursor-pointer"
            >
              <RecentBlogsList.Item blog={blog} />
            </div>
          ))}
        </div>

        {/* Right Fade Effect */}
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-[#141414] to-transparent transition-opacity duration-500 pointer-events-none",
            canScrollRight ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      {/* Left Scroll Button */}
      <button
        onClick={() => scroll("left")}
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-transparent transition duration-300 p-2 rounded-full z-10",
          canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <ChevronLeft className="text-white w-6 h-6" />
      </button>

      {/* Right Scroll Button */}
      <button
        onClick={() => scroll("right")}
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-transparent transition duration-300 p-2 rounded-full z-10",
          canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <ChevronRight className="text-white w-6 h-6" />
      </button>
    </div>
  );
};

interface ItemProps {
  blog: Blog;
}

const Item = ({ blog }: ItemProps) => {
  const router = useRouter();

  const onClick = () => {
    router.push(`/app/${blog?.blog_id}`);
  };

  return (
    <div className="group overflow-hidden relative min-h-32 bg-background hover:bg-accent/5 w-48 border border-accent/75 rounded-xl ">
      <div
        className={cn(
          "absolute top-0 w-full bg-primary/8 h-13",
          blog?.cover_image &&
            "opacity-60 group-hover:opacity-100 transition-opacity",
        )}
      >
        {blog?.cover_image?.image_url && (
          <Image
            src={blog?.cover_image.image_url}
            alt="Cover Image of the Blog"
            fill
            className="object-cover"
          />
        )}
      </div>
      <div className="relative flex flex-col py-2 h-32 z-[10]">
        <div className="flex-1">
          <div className="px-2 h-[32px] w-fit flex items-center">
            {blog?.icon && (
              <div className={`shrink-0 text-[18px]`}>{blog?.icon}</div>
            )}
          </div>
          <div
            className="px-3 font-bold overflow-hidden text-ellipsis break-all line-clamp-2 cursor-pointer"
            onClick={onClick}
          >
            {blog?.title}
          </div>
        </div>
        <div className="px-3 text-xs text-muted-foreground">
          {TimeFormatter.timeAgo(blog?.updated_at)}
        </div>
      </div>
    </div>
  );
};

const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => {
  const hours = new Date().getHours() % 12 || 12; // Convert to 12-hour format
  const clockMap: Record<number, React.ElementType> = {
    1: Clock1,
    2: Clock2,
    3: Clock3,
    4: Clock4,
    5: Clock5,
    6: Clock6,
    7: Clock7,
    8: Clock8,
    9: Clock9,
    10: Clock10,
    11: Clock11,
    12: Clock12,
  };

  const ClockComponent = clockMap[hours] || Clock;

  return <ClockComponent {...props} />;
};

RecentBlogsList.Item = Item;

export default RecentBlogsList;
