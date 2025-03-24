import React from "react";

import DarkPage from "@/components/darkpage";

const MarketingLayout = ({ children }: { children: React.ReactNode }) => {
  return <DarkPage>{children}</DarkPage>;
};

export default MarketingLayout;
