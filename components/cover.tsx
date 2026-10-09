import React from "react";

import Image from "next/image";

import ConfirmModal from "./modals/confirm-modal";
import { Button } from "./ui/button";
import { deleteImage } from "@/lib/storage/upload";
import { useCoverImage } from "@/lib/store/use-cover-image";
import { useUser } from "@/lib/store/use-user";
import Blog from "@/lib/system/localdb/blog";
import dbClient from "@/lib/system/localdb/client";
import { SyncManager } from "@/lib/system/sync-manager";
import { cn } from "@/lib/utils";
import { ImageIcon, Trash } from "lucide-react";
import { toast } from "sonner";

interface CoverProps {
  blog: Blog;
  isPreview?: boolean;
  isViewer?: boolean;
}

const Cover = ({ blog, isPreview, isViewer }: CoverProps) => {
  const { onReplace } = useCoverImage();

  const onRemove = async () => {
    if (isPreview || !blog?.cover_image) return;

    try {
      const id = blog.cover_image.uploaded_image_id;
      await blog.updateCoverImage(null);
      const user = useUser.getState().user;
      const updated = await dbClient.getBlogById(blog.blog_id);
      if (user && updated) await new SyncManager(user).saveBlog(updated);
      await deleteImage(id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove cover.",
      );
    }
  };

  const cover_image = isViewer
    ? typeof blog?.cover_image === "string"
      ? JSON.parse(blog?.cover_image)
      : blog?.cover_image
    : blog?.cover_image;

  return (
    <div
      className={cn(
        "relative w-full bg-transparent group",
        !cover_image ? (isViewer ? "" : "min-h-20") : "min-h-96",
        isViewer &&
          (!cover_image ? "overflow-hidden" : "overflow-hidden my-12"),
      )}
    >
      {!!cover_image && (
        <>
          <Image
            src={cover_image.image_url as string}
            fill
            alt="Cover Image for the Blog"
            className={cn("object-cover object-center")}
          />
          {/* <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent h-20" /> */}
        </>
      )}
      {!isPreview && !!cover_image && (
        <div className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity absolute w-full h-full p-4 py-6 flex items-end justify-end gap-x-2">
          <Button
            size="sm"
            className="text-muted-foreground text-xs border-none bg-transparent hover:bg-background/50"
            onClick={() => onReplace(cover_image?.image_url as string)}
          >
            <ImageIcon className="mr-2" />
            Change Cover
          </Button>
          <ConfirmModal onConfirm={onRemove}>
            <Button
              size="sm"
              className="text-muted-foreground text-xs border-none bg-transparent hover:bg-background/50"
            >
              <Trash className="mr-2" />
              Remove
            </Button>
          </ConfirmModal>
        </div>
      )}
    </div>
  );
};

export default Cover;
