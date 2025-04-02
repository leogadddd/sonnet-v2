import React, { useEffect, useState } from "react";

import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import AccountDetailsSettings from "../user/account-details-setting";
import { useUser } from "@/lib/store/use-user";
import { GetLastSyncedLog } from "@/lib/system/localdb/client";
import Log from "@/lib/system/localdb/log";
import { Updates, useSyncManager } from "@/lib/system/sync-manager";
import { UserObject } from "@/lib/system/user/user";
import {
  TimeFormatter,
  formatBytes,
  getMaxStorage,
  getMaxSyncBlogs,
} from "@/lib/utils";

const SonnetSyncCenter = () => {
  const [lastsynclog, setLastSyncLog] = useState<Log>();
  const { user } = useUser();
  const [mounted, setMounted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [updates, setUpdates] = useState<Updates[]>([]);
  if (!user) return <></>;

  const syncManager = useSyncManager(user);

  const check = async () => {
    setIsLoading(true);
    setUpdates([]);
    const updates = await syncManager.check();
    setUpdates(updates);
    setIsLoading(false);
    setLastSyncLog(await GetLastSyncedLog());
  };

  const sync = async () => {
    setIsLoading(true);
    setUpdates([]);
    await syncManager.sync();
    setIsLoading(false);
    setLastSyncLog(await GetLastSyncedLog());
  };

  useEffect(() => {
    if (!mounted) check();
    setMounted(true);
  }, []);

  return (
    <div className="h-full pb-2">
      <div className="flex flex-col gap-y-2 h-full">
        <div className="my-2">
          <p className="text-sm text-muted-foreground">
            Control how your content is saved and accessed across devices.
            Manage your sync settings here.
          </p>
        </div>
        <AccountDetailsSettings />
        <SonnetSyncCenter.BlogSync user={user} />
        <SonnetSyncCenter.ImageSync user={user} />
        <div className="rounded-md border flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <h1>
                <Spinner />
              </h1>
            </div>
          )}
          {!isLoading && updates.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <h1 className="text-sm text-muted-foreground">
                Nothing needs to be sync
              </h1>
            </div>
          )}
          {updates.map((update) => (
            <div
              key={`${update.blog_id}-sync-updates`}
              className="flex flex-col w-full justify-between p-2 text-sm "
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <p className="">id: {update.blog_id}</p>
                <p>source: {update.update_source}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="">description: {update.description}</p>
                <p>{TimeFormatter.timeAgo(update.updated_at)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-x-2 justify-end">
          <h1 className="text-sm px-2 text-muted-foreground">
            last synced {TimeFormatter.timeAgo(lastsynclog?.created_at!)}
          </h1>
          <Button disabled={isLoading} onClick={check} variant="outline">
            Check
          </Button>
          <Button
            disabled={isLoading || updates.length === 0}
            onClick={sync}
            variant="outline"
          >
            Sync
          </Button>
        </div>
      </div>
    </div>
  );
};

interface BlogSyncDetailsProps {
  user: UserObject;
}

const BlogSyncDetails = ({ user }: BlogSyncDetailsProps) => {
  const maxBlogs = getMaxSyncBlogs(user.plan);
  return (
    <div>
      <h1 className="text-xs font-bold text-muted-foreground">Blogs</h1>
      <div className="flex justify-between my-1">
        <h1 className="text-sm">synced blogs</h1>
        <p className="text-sm flex gap-x-1">
          <span className="font-bold">{user.synced_blog_count}</span>
          <span className="text-muted-foreground">
            / {maxBlogs === -1 ? "Unlimited" : maxBlogs}
          </span>
        </p>
      </div>
    </div>
  );
};

interface StorageSyncDetailsProps {
  user: UserObject;
}

const StorageSyncDetails = ({ user }: StorageSyncDetailsProps) => {
  const maxBytes = getMaxStorage(user.plan);
  return (
    <div>
      <h1 className="text-xs font-bold text-muted-foreground">Storage</h1>
      <div className="flex justify-between my-1">
        <h1 className="text-sm">usage</h1>
        <p className="text-sm flex gap-x-1">
          <span className="font-bold">
            {formatBytes(user.total_storage_used)} used
          </span>
          <span className="text-muted-foreground">
            out of {maxBytes === -1 ? "Unlimited" : formatBytes(maxBytes)}
          </span>
        </p>
      </div>
    </div>
  );
};

SonnetSyncCenter.BlogSync = BlogSyncDetails;
SonnetSyncCenter.ImageSync = StorageSyncDetails;

export default SonnetSyncCenter;
