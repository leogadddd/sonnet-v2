import React, { Suspense, useMemo } from "react";

import FeedSwitcher from "../../components/feed-switcher";
import FooterSection from "@/app/(marketing)/components/footer";
import BlogList from "@/components/blog-list";
import { Skeleton } from "@/components/ui/skeleton";

const ExplorePage = () => {
  return (
    <div>
      <main className="pt-32 w-full min-h-screen flex flex-col lg:flex-row mx-auto max-w-7xl px-6 md:px-27 relative">
        <div className="flex-1 w-full">
          <Suspense fallback={<Skeleton className="h-9 rounded-xl" />}>
            <FeedSwitcher />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-48 rounded-xl" />}>
            <BlogList />
          </Suspense>
        </div>
        <div className="lg:w-82 xl:w-90 lg:pl-4 hidden lg:flex flex-col gap-y-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-4 rounded-xl" />
          <Skeleton className="h-4 rounded-xl" />
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;
