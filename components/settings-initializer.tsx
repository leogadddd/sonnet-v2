"use client";

import React, { useEffect } from "react";

import { useTheme } from "next-themes";

import { useSettings } from "@/lib/store/use-settings";

const SettingsInitializer = () => {
  const { theme, setTheme } = useTheme();
  const { settings } = useSettings();

  useEffect(() => {
    if (theme !== (settings.darkmode ? "dark" : "light"))
      setTheme(settings.darkmode ? "dark" : "light");
  }, [settings.darkmode, theme, setTheme]);
  return <></>;
};

export default SettingsInitializer;
