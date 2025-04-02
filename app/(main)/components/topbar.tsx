"use client";

import React from "react";

import BlogUpdateStatus from "./blogupdate-status";
import TopbarIcon from "./topbar-icon";
import TopbarMenuButton from "./topbar-menu-button";
import TopbarTitle from "@/components/topbar-title";

const TopBar = () => {
  return (
    <div className="flex-1 min-h-[48px] flex items-center justify-between">
      <div className="flex items-center">
        <TopbarIcon />
        <TopbarTitle />
      </div>
      <div className="flex items-center pr-2">
        <BlogUpdateStatus />
        <TopbarMenuButton />
      </div>
    </div>
  );
};

export default TopBar;
