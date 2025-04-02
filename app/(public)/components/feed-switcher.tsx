"use client";

import React, { useEffect, useState } from "react";

import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { useRouter, useSearchParams } from "next/navigation";

import { Category } from "@/components/modals/publish-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TabData, getTabs } from "@/lib/explore/action/getTabs";
import { useExplore } from "@/lib/store/use-explore";
import { explore } from "@/lib/system/localdb/client";
import { RefreshCcw } from "lucide-react";

const FeedSwitcher = () => {
  const { setInitial, changeTab, tabs } = useExplore();
  const [current, setCurrent] = useState<TabData | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (tab: TabData) => {
    setCurrent(tab);
    changeTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", tab.name);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    async function fetchTabs() {
      const category = searchParams.get("category");
      const data = await getTabs();
      setInitial(
        data,
        data.find((tab) => tab.name === category) ??
          data.find((tab) => tab.id === explore)!,
      );
      setCurrent(
        data.find((tab) => tab.name === category) ??
          data.find((tab) => tab.id === explore)!,
      );
    }

    fetchTabs();
  }, []);

  if (tabs.length === 0)
    return (
      <div className="flex">
        <div className="flex flex-1 gap-x-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-10" />
        </div>
      </div>
    );

  return (
    <div className="flex">
      <div className="flex flex-1 gap-x-2">
        {tabs.map((tab) => (
          <div key={tab.id}>
            <Button
              onClick={() => handleTabChange(tab)}
              variant={current?.name === tab.name ? "default" : "ghost"}
              className="cursor-pointer"
            >
              {tab.name}
            </Button>
          </div>
        ))}
      </div>
      {/* <Button
        size="icon"
        variant="outline"
        onClick={refresh}
        className="cursor-pointer"
      >
        <RefreshCcw
          className={isRefreshingBlogs ? "animate-spin" : ""}
          style={{ animationDirection: "reverse" }}
        />
      </Button> */}
    </div>
  );
};

export default FeedSwitcher;
