"use client";

import type { ReactNode } from "react";

import ModalsProvider from "@/components/modals";
import SearchCommand from "@/components/search-command";
import SettingsInitializer from "@/components/settings-initializer";
import SideBar from "@/components/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/providers/auth-provider";

export function Workspace({ children }: { children: ReactNode }) {
  const { isLoaded, userId, error, refresh } = useAuth();
  if (error)
    return (
      <div role="alert" className="p-8">
        {error}
        <button onClick={refresh} className="ml-4 underline">
          Retry
        </button>
      </div>
    );
  if (!isLoaded || !userId)
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  return (
    <div key={userId} className="flex h-full overflow-hidden">
      <ModalsProvider />
      <SettingsInitializer />
      <SearchCommand />
      <SideBar />
      <main className="h-full flex-1 overflow-y-auto dark:bg-[#141414]">
        {children}
      </main>
    </div>
  );
}
