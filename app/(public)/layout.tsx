import React from "react";

import FooterSection from "../(marketing)/components/footer";
import { HeroHeader } from "../(marketing)/components/hero5-header";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => (
  <>
    <HeroHeader />
    <main className="">{children}</main>
    <FooterSection />
  </>
);

export default PublicLayout;
