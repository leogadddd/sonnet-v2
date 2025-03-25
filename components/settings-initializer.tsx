"use client";

import React, { useEffect } from "react";

import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

import { useSettings } from "@/lib/store/use-settings";

const SettingsInitializer = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { settings } = useSettings();

  useEffect(() => {
    if (!pathname.includes("/app")) return;
    if (theme !== (settings.darkmode ? "dark" : "light"))
      setTheme(settings.darkmode ? "dark" : "light");
  }, [settings.darkmode, theme, setTheme, pathname]);
  return <></>;
};

export default SettingsInitializer;
