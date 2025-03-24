"use client";

import React from "react";

import { TextEffect } from "@/components/motion-primitives/text-effect";
import RecentBlogs from "@/components/recent-blogs";
import { useUser } from "@/lib/store/use-user";

const AppPage = () => {
  const { user } = useUser();
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };
  return (
    <div className="flex flex-col h-screen w-full gap-y-4 pt-[48px] lg:max-w-xl xl:max-w-4xl mx-auto px-14 lg:px-0">
      <header className="mt-4 mb-2 flex justify-center md:justify-start w-full">
        <TextEffect
          preset="fade-in-blur"
          speedSegment={0.3}
          as="h1"
          className="text-balance text-3xl md:text-4xl font-semibold text-foreground/95"
        >
          {`${getGreeting()}, ${user?.first_name ?? "User"}!`}
        </TextEffect>
      </header>
      <div className="">
        <RecentBlogs />
      </div>
    </div>
  );
};

export default AppPage;
