"use client";

import { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { type TabData, getTabs } from "@/lib/explore/action/getTabs";
import { useExplore } from "@/lib/store/use-explore";

const defaultCategory = "12a3368a-1960-465e-9de0-22ecbb1703c2";
export default function FeedSwitcher() {
  const { tabs, currentTab, setInitial, changeTab } = useExplore();
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  useEffect(() => {
    let active = true;
    getTabs()
      .then((data) => {
        if (active)
          setInitial(
            data,
            data.find((tab) => tab.name === category) ??
              data.find((tab) => tab.id === defaultCategory) ??
              data[0],
          );
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [category, setInitial]);
  function select(tab: TabData) {
    changeTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", tab.name);
    router.replace("?" + params.toString(), { scroll: false });
  }
  if (error) return <p role="alert">{error}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          onClick={() => select(tab)}
          variant={currentTab?.id === tab.id ? "default" : "ghost"}
        >
          {tab.name}
        </Button>
      ))}
    </div>
  );
}
