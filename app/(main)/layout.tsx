"use client";

import React, { useEffect } from "react";

import { useRouter } from "next/navigation";

import SearchCommand from "@/components/search-command";
import SideBar from "@/components/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/lib/store/use-user";
import { useAuth } from "@clerk/nextjs";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { setUserByClerkId } = useUser();
  const { isSignedIn, isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!userId) return;

    setUserByClerkId(userId);
    if (!isSignedIn && isLoaded) return router.push("/");
  }, [isSignedIn, isLoaded]);

  if (!isLoaded || !isSignedIn || !userId) {
    return (
      <div className="flex h-full justify-center items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <SearchCommand />
      <SideBar />
      <main className="h-full flex-1 overflow-y-auto dark:bg-[#141414]">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
