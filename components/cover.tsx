import React from "react";

import Image from "next/image";
import { useParams } from "next/navigation";

import ConfirmModal from "./modals/confirm-modal";
import { Button } from "./ui/button";
import { useEdgeStore } from "@/lib/edgestore/edgestore";
import { useCoverImage } from "@/lib/store/use-cover-image";
import { useSupabase } from "@/lib/supabase/supabase-client";
import Blog, { cover_image } from "@/lib/system/localdb/blog";
import { cn } from "@/lib/utils";
import { ImageIcon, Trash } from "lucide-react";

interface CoverProps {
  blog: Blog;
  isPreview?: boolean;
  isViewer?: boolean;
}

const Cover = ({ blog, isPreview, isViewer }: CoverProps) => {
  const supabase = useSupabase();
  const { onReplace } = useCoverImage();
  const { edgestore } = useEdgeStore();

  const onRemove = async () => {
    if (isPreview || !blog?.cover_image) return;

    const cover_image: cover_image = blog?.cover_image;
    await supabase
      .from("uploaded_images")
      .delete()
      .eq("id", cover_image.uploaded_image_id);
    await blog?.updateCoverImage(null);
    await edgestore.publicFiles.delete({
      url: blog?.cover_image?.image_url as string,
    });
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
        !cover_image ? "min-h-20" : "min-h-72",
      )}
    >
      {!!cover_image && (
        <>
          <Image
            src={cover_image.image_url as string}
            fill
            alt="Cover Image for the Blog"
            className="object-cover object-center"
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
