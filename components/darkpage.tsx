"use client";

import React, { useEffect } from "react";

import { useTheme } from "next-themes";

const DarkPage = ({ children }: { children: React.ReactNode }) => {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);
  return <>{children}</>;
};

export default DarkPage;
