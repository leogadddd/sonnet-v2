import { useUser } from "@/lib/store/use-user";
import dbClient from "@/lib/system/localdb/client";
import { SyncManager } from "@/lib/system/sync-manager";

export async function uploadImage(
  file: File,
  blogId?: string,
): Promise<{ id: string; url: string; size: number }> {
  const user = useUser.getState().user;
  if (!user) throw new Error("Sign in to upload images.");
  if (blogId) {
    const blog = await dbClient.getBlogById(blogId);
    if (!blog) throw new Error("Blog unavailable.");
    await new SyncManager(user).saveBlog(blog);
  }
  const response = await fetch(
    blogId
      ? "/api/upload?blog_id=" + encodeURIComponent(blogId)
      : "/api/upload?kind=avatar",
    {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Upload failed.");
  return result;
}
export async function deleteImage(id: string) {
  const response = await fetch("/api/images/" + encodeURIComponent(id), {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Unable to delete image.");
}
