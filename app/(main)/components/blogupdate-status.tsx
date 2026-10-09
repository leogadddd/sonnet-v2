import { useParams } from "next/navigation";

import dbClient from "@/lib/system/localdb/client";
import { TimeFormatter } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";

export default function BlogUpdateStatus() {
  const params = useParams();
  const blog = useLiveQuery(
    () => dbClient.getBlogById(params?.blog_id as string),
    [params?.blog_id],
  );
  if (!blog) return null;
  const status = !blog.synced_at
    ? "not yet synced"
    : blog.updated_at > blog.synced_at
      ? "unsynced changes"
      : "synced " + TimeFormatter.timeAgo(blog.synced_at);
  return (
    <div className="text-xs text-muted-foreground flex items-center px-2 pr-6">
      <p>{status}</p>
    </div>
  );
}
