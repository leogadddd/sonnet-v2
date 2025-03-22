"use client";

import React, { useState } from "react";

import { useParams } from "next/navigation";

import { SingleImageDropzone } from "../single-image-dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEdgeStore } from "@/lib/edgestore/edgestore";
import { useCoverImage } from "@/lib/store/use-cover-image";
import dbClient from "@/lib/system/localdb/client";
import { useLiveQuery } from "dexie-react-hooks";

const CoverImageModal = () => {
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
    if (file) {
      setIsSubmitting(true);
      setFile(file);

      const res = await edgestore.publicFiles.upload({
        file,
        options: { replaceTargetUrl: url },
      });

      await blog?.updateCoverImage(res);

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
