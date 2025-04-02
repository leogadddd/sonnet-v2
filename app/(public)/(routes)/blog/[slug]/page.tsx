"use client";

import React, { useEffect, useState } from "react";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

import Cover from "@/components/cover";
import ErrorCenterComponent from "@/components/error";
import Toolbar from "@/components/toolbar";
import { BlogData, GetBlog } from "@/lib/blog/action/getblog";

const Viewer = dynamic(() => import("@/components/editor"), { ssr: false });

const ViewerPage = () => {
  const params = useParams();
  const [data, setData] = useState<BlogData | null | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      const data = await GetBlog({ slug: params?.slug as string });

      setData(data);
    };

    fetchData();
  }, [params?.slug]);

  if (data === undefined) {
    return <></>;
  }

  if (!data?.blog)
    return (
      <div className="h-full flex flex-col justify-center items-center pt-[48px] w-full">
        <ErrorCenterComponent
          title="Blog is not found!"
          subtitle="The blog that you are looking for is unavailable or has been deleted!"
        />
      </div>
    );

  return (
    <>
      <div className="h-full flex flex-col pt-[48px] w-full">
        <Cover blog={data.blog} isPreview isViewer />
        <div className="px-8 mx-auto max-w-md md:max-w-3xl lg:max-w-4xl md:px-24 w-full">
          <Toolbar isPreview blog={data.blog} isViewer />
          <Viewer isPreview blog={data.blog} isViewer />
        </div>
      </div>
    </>
  );
};

export default ViewerPage;
