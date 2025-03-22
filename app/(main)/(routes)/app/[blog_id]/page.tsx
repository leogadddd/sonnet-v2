"use client";

import React, { useMemo } from "react";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

import Cover from "@/components/cover";
import ErrorCenterComponent from "@/components/error";
import Toolbar from "@/components/toolbar";
import dbClient from "@/lib/system/localdb/client";
import { useLiveQuery } from "dexie-react-hooks";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });

const EditorPage = () => {
  const params = useParams();

  const blog = useLiveQuery(
    async () => await dbClient.getBlogById(params?.blog_id as string),
    [params?.blog_id],
  );

  if (blog === undefined) {
    return <></>;
  }

  if (!blog)
    return (
      <div className="h-full flex flex-col justify-center items-center pt-[48px] w-full">
        <ErrorCenterComponent
          title="Blog is not found!"
          subtitle="The blog that you are looking for is unavailable or has been deleted!"
        />
      </div>
    );

  return (
    <div className="h-full flex flex-col pt-[48px] w-full">
      <Cover />
      <div className="px-8 mx-auto max-w-md md:max-w-3xl lg:max-w-5xl md:px-24 w-full">
        <Toolbar />
        <Editor />
      </div>
    </div>
  );
};

export default EditorPage;
