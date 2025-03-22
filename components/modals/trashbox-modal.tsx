"use client";

import React, { useCallback, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { Button } from "../ui/button";
import ConfirmModal from "./confirm-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTrashbox } from "@/lib/store/use-trash-box";
import Blog from "@/lib/system/localdb/blog";
import dbClient, { TrashBoxBlogs } from "@/lib/system/localdb/client";
import { cn } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronDown, ChevronRight, FileIcon, Trash, Undo } from "lucide-react";

const TrashBoxModal = () => {
  const { modal_state, onClose } = useTrashbox();

  return (
    <Dialog open={modal_state} onOpenChange={onClose}>
      <DialogContent className="p-2">
        <DialogHeader className="p-2 pb-0">
          <DialogTitle>Trash</DialogTitle>
        </DialogHeader>
        <div className="h-[200px] overflow-y-auto overflow-x-hidden rounded-lg bg-muted-foreground/5">
          <TrashBoxModal.BlogsList />
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface BlogsListProps {
  parent_blog?: string;
  level?: number;
}

TrashBoxModal.BlogsList = ({ parent_blog = "", level = 0 }: BlogsListProps) => {
  const blogs = TrashBoxBlogs(parent_blog) || [];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const onExpand = useCallback((blog_id: string) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [blog_id]: !prevExpanded[blog_id],
    }));
  }, []);

  if (!blogs) return null;

  return (
    <>
      {blogs.length === 0 && level === 0 && (
        <div className="text-center text-muted-foreground h-full flex flex-col gap-y-2 items-center justify-center">
          <Trash />
          <p className="text-sm">No Blogs in Trash</p>
        </div>
      )}
      <p
        style={{
          paddingLeft: level ? `${level * 10 + 10}px` : "12px",
        }}
        className={cn(
          "hidden text-xs dark:text-muted-foreground/50 text-muted-foreground ml-4 py-1 truncate w-full",
          expanded && level !== 0 && blogs.length === 0 && "block",
        )}
      >
        No Pages inside
      </p>
      {blogs?.map((blog) => (
        <div key={blog?.blog_id}>
          <TrashBoxModal.BlogItem
            id={blog.blog_id}
            level={level + 1}
            expanded={expanded[blog.blog_id]}
            onExpand={() => onExpand(blog.blog_id)}
          />
          {expanded[blog.blog_id] && (
            <TrashBoxModal.BlogsList
              parent_blog={blog.blog_id}
              level={level + 1}
            />
          )}
        </div>
      ))}
      {blogs && <div />}
    </>
  );
};

interface BlogItemProps {
  id: string;
  level: number;
  expanded: boolean;
  onExpand: () => void;
}

TrashBoxModal.BlogItem = ({ id, level, expanded, onExpand }: BlogItemProps) => {
  const router = useRouter();
  const params = useParams();

  const blog = useLiveQuery(async () => await dbClient.getBlogById(id), [id]);

  const Restore = () => {
    blog?.restoreFromTrash();
  };

  const Delete = () => {
    blog?.delete();
  };

  const onClick = () => {
    router.push(`/app/${blog?.blog_id}`);
  };

  const isActive = params?.blog_id === blog?.blog_id;

  return (
    <div
      className="group/blogItem min-h-[32px] flex items-center hover:bg-accent/50 rounded-lg"
      style={{
        paddingLeft: level ? `${level * 7 + 7}px` : "7px",
      }}
    >
      <div
        role="button"
        onClick={onExpand}
        className={cn(
          "group/expand",
          !expanded &&
            "opacity-0 group-hover/blogItem:opacity-100 transition-opacity",
        )}
      >
        <div className="group-hover/expand:bg-foreground/15 rounded-sm">
          {!expanded ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>
      {blog?.icon ? (
        <div className={`shrink-0 mr-2 text-[18px]`}>{blog?.icon}</div>
      ) : (
        <FileIcon
          className={cn(
            "shrink-0 h-[18px] mr-2",
            isActive && "text-foreground",
          )}
        />
      )}
      <div
        onClick={onClick}
        className={cn(
          "font-normal w-full truncate h-full min-h-[30px] flex items-center cursor-pointer",
          isActive && "font-semibold text-foreground",
        )}
      >
        <div className="w-full truncate">{blog?.title}</div>
      </div>
      <div className="flex gap-x-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-sm text-muted-foreground"
          onClick={Restore}
        >
          <Undo className="mr-2" />
          Restore
        </Button>
        <ConfirmModal onConfirm={Delete}>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm text-red-400 hover:text-red-300"
          >
            <Trash className="mr-2" />
            Delete
          </Button>
        </ConfirmModal>
      </div>
    </div>
  );
};

export default TrashBoxModal;
