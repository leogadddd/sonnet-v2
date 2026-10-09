import { uploadImage } from "@/lib/storage/upload";
import { MAX_IMAGE_BYTES } from "@/lib/storage/validation";
import { createImageUpload } from "novel";
import { toast } from "sonner";

export function imageUploader(blogId: string) {
  return createImageUpload({
    onUpload: async (file: File) => {
      const promise = uploadImage(file, blogId);
      toast.promise(promise, {
        loading: "Uploading image…",
        success: "Image uploaded.",
        error: (error) => error.message,
      });
      return (await promise).url;
    },
    validateFn: (file) => {
      if (
        !["image/png", "image/jpeg", "image/gif", "image/webp"].includes(
          file.type,
        ) ||
        file.size > MAX_IMAGE_BYTES
      ) {
        toast.error("Choose a PNG, JPEG, GIF, or WebP image under 20 MB.");
        return false;
      }
      return true;
    },
  });
}
