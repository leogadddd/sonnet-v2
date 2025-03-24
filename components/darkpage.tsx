"use client";

import React, { useEffect } from "react";

import { useTheme } from "next-themes";

const DarkPage = ({ children }: { children: React.ReactNode }) => {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("dark");
  });
  return <>{children}</>;
};

export default DarkPage;
