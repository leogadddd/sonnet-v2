"use client";

import { useState } from "react";

import { useParams } from "next/navigation";

import { SingleImageDropzone } from "../single-image-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { deleteImage, uploadImage } from "@/lib/storage/upload";
import { useCoverImage } from "@/lib/store/use-cover-image";
import { useUser } from "@/lib/store/use-user";
import dbClient from "@/lib/system/localdb/client";
import { UploadedImage } from "@/lib/system/storage/image/image";
import { SyncManager } from "@/lib/system/sync-manager";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

export default function CoverImageModal() {
  const params = useParams();
  const { modal_state, onClose } = useCoverImage();
  const [busy, setBusy] = useState(false);
  const blog = useLiveQuery(
    () => dbClient.getBlogById(params?.blog_id as string),
    [params?.blog_id],
  );
  async function onChange(file?: File) {
    const user = useUser.getState().user;
    if (!file || !blog || !user) return;
    setBusy(true);
    try {
      const oldId = blog.cover_image?.uploaded_image_id;
      const result = await uploadImage(file, blog.blog_id);
      await blog.updateCoverImage(
        Object.assign(
          new UploadedImage({
            user_id: user.id,
            blog_id: blog.blog_id,
            image_url: result.url,
            file_size: result.size,
            uploaded_at: Date.now(),
          }),
          { id: result.id },
        ),
      );
      const updated = await dbClient.getBlogById(blog.blog_id);
      if (updated) await new SyncManager(user).saveBlog(updated);
      if (oldId) await deleteImage(oldId);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={modal_state} onOpenChange={() => !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cover image</DialogTitle>
        </DialogHeader>
        <SingleImageDropzone
          disabled={busy}
          onChange={onChange}
          dropzoneOptions={{
            maxSize: 20 * 1024 * 1024,
            accept: {
              "image/png": [],
              "image/jpeg": [],
              "image/gif": [],
              "image/webp": [],
            },
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
