import React, { useMemo, useState } from "react";

import { useTheme } from "next-themes";
import { useParams } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEmojiPicker } from "@/lib/store/use-emoji-picker";
import dbClient from "@/lib/system/localdb/client";
import { cn } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { FileIcon } from "lucide-react";

const TopbarIcon = () => {
  const params = useParams();
  const { onOpen } = useEmojiPicker();

  const blog = useLiveQuery(
    async () => await dbClient.getBlogById(params?.blog_id as string),
    [params?.blog_id],
  );

  const isActive = params?.blog_id === blog?.blog_id;

  if (!blog) return <></>;

  return (
    <div role="button" onClick={onOpen}>
      {blog?.icon ? (
        <div className={`shrink-0 text-[18px]`}>{blog?.icon}</div>
      ) : (
        <FileIcon
          className={cn("shrink-0 h-[18px]", isActive && "text-foreground")}
        />
      )}
    </div>
  );
};

export default TopbarIcon;
