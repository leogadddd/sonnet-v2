import React, { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import dbClient from "@/lib/system/localdb/client";
import { TimeFormatter } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";

const BlogUpdateStatus = () => {
  const [status, setStatus] = useState<string>("just now");

  const params = useParams();

  const blog = useLiveQuery(
    async () => await dbClient.getBlogById(params?.blog_id as string),
    [params?.blog_id],
  );

  useEffect(() => {
    if (blog) {
      if (blog.synced_at !== 0) {
        setStatus(`synced ${TimeFormatter.timeAgo(blog.synced_at)}`);
        return;
      }

      setStatus("not yet synced");
    }
  }, [blog?.synced_at]);

  if (!blog) return <></>;

  return (
    <div className="text-xs text-muted-foreground flex items-center px-2 pr-6">
      <h1>{status}</h1>
    </div>
  );
};

export default BlogUpdateStatus;
