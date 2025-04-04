import React from "react";

import { HeroHeader } from "../(marketing)/components/hero5-header";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="flex h-full overflow-hidden">
      <HeroHeader />
      <main className="h-full flex-1 overflow-y-auto dark:bg-[#141414]">
        {children}
      </main>
    </div>
  );
};

export default PublicLayout;
