import React from "react";

import { HeroHeader } from "../(marketing)/components/hero5-header";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div>
      <HeroHeader />
      <main>{children}</main>
    </div>
  );
};

export default PublicLayout;
