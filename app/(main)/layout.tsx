"use client";

import React, { useEffect } from "react";

import { useRouter } from "next/navigation";

import ModalsProvider from "@/components/modals";
import SearchCommand from "@/components/search-command";
import SettingsInitializer from "@/components/settings-initializer";
import SideBar from "@/components/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/lib/store/use-user";
import { useAuth } from "@clerk/nextjs";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { setUserByClerkId } = useUser();
  const { isSignedIn, isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) return router.push("/");

    setUserByClerkId(userId);
    if (!isSignedIn) return router.push("/");
  }, [isSignedIn, isLoaded, router, setUserByClerkId, userId]);

  if (!isLoaded || !isSignedIn || !userId) {
    return (
      <div className="flex h-full justify-center items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <ModalsProvider />
      <SettingsInitializer />
      <SearchCommand />
      <SideBar />
      <main className="h-full flex-1 overflow-y-auto dark:bg-[#141414]">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
