"use client";

import React, { useState } from "react";

import { useParams } from "next/navigation";

import { SingleImageDropzone } from "../single-image-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEdgeStore } from "@/lib/edgestore/edgestore";
import { useCoverImage } from "@/lib/store/use-cover-image";
import { useUser } from "@/lib/store/use-user";
import { useSupabase } from "@/lib/supabase/supabase-client";
import dbClient from "@/lib/system/localdb/client";
import { UploadedImage } from "@/lib/system/storage/image/image";
import { useLiveQuery } from "dexie-react-hooks";

const CoverImageModal = () => {
  const { user } = useUser();
  const supabase = useSupabase();
  const params = useParams();
  const { edgestore } = useEdgeStore();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [file, setFile] = useState<File>();
  const { modal_state, url, onClose } = useCoverImage();

  const blog = useLiveQuery(
    async () => await dbClient.getBlogById(params?.blog_id as string),
    [params?.blog_id],
  );

  const close = () => {
    setFile(undefined);
    setIsSubmitting(false);
    onClose();
  };

  const onChange = async (file?: File) => {
    if (file && user && blog) {
      setIsSubmitting(true);
      setFile(file);

      const res = await edgestore.publicFiles.upload({
        file,
        options: { replaceTargetUrl: url },
      });

      const image = new UploadedImage({
        user_id: user?.id,
        blog_id: blog?.blog_id,
        image_url: res.url,
        file_size: res.size,
        uploaded_at: res.uploadedAt.getTime(),
      });

      const existing_id = blog?.cover_image?.uploaded_image_id;

      if (existing_id) {
        const { error: existing_error } = await supabase
          .from("uploaded_images")
          .select("id")
          .eq("id", existing_id)
          .single();

        if (existing_error) {
          console.error("Error Checking Image Database", existing_error);
          return;
        }

        const { error } = await supabase
          .from("uploaded_images")
          .update(image)
          .eq("id", existing_id);

        if (error) {
          console.error("Error Uploading Image");
          return;
        }

        await blog?.updateCoverImage({
          ...image,
          id: existing_id,
        });
      } else {
        const { data, error } = await supabase
          .from("uploaded_images")
          .insert(image)
          .select("id");

        if (error) {
          console.error("Error Uploading Image");
          return;
        }

        await blog?.updateCoverImage({
          ...image,
          id: data[0].id,
        });
      }

      close();
    }
  };

  return (
    <Dialog open={modal_state} onOpenChange={onClose}>
      <DialogContent className="p-2">
        <DialogHeader className="p-2 pb-0">
          <DialogTitle>Cover</DialogTitle>
        </DialogHeader>
        <SingleImageDropzone
          className="w-full"
          value={file}
          onChange={onChange}
          disabled={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CoverImageModal;
