"use client";

import React from "react";

import BlogList from "../../components/blog-list";
import ExploreHero from "../../components/hero-section";

const ExplorePage = () => {
  return (
    <div>
      <ExploreHero />
      <div>
        <BlogList />
      </div>
    </div>
  );
};

export default ExplorePage;
