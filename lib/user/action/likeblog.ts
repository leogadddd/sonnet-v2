"use server";

import { useUser } from "@/lib/store/use-user";
import { useSupabase as UseSupabase } from "@/lib/supabase/supabase-client";
import { User, UserObject } from "@/lib/system/user/user";

export const LikeBlog = async (
  blog_id: string,
  _user: User,
): Promise<UserObject | null> => {
  if (!_user.id) {
    console.error("Not Authenticated!");
    return null;
  }

  const supabase = UseSupabase();

  // Fetch user data
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("liked_blogs")
    .eq("id", _user.id)
    .single();

  if (userError) {
    console.error("Error fetching user data:", userError);
    return null;
  }

  const likedBlogs = userData.liked_blogs || [];

  const hasLiked = likedBlogs.includes(blog_id);

  // If liked, remove from array, else add to array
  const updatedLikedBlogs = hasLiked
    ? likedBlogs.filter((id: string) => id !== blog_id) // Unlike (Remove blog_id)
    : [...likedBlogs, blog_id]; // Like (Add blog_id)

  // Update the user's liked blogs list
  const { error: updateUserError } = await supabase
    .from("users")
    .update({ liked_blogs: updatedLikedBlogs })
    .eq("id", _user.id);

  if (updateUserError) {
    console.error("Error updating user liked blogs:", updateUserError);
    return null;
  }

  const rpcMethod = hasLiked ? "decrement_likes" : "increment_likes";

  const { error: updateLikesError } = await supabase.rpc(rpcMethod, {
    blog_id,
  });

  if (updateLikesError) {
    console.error("Error updating blog likes:", updateLikesError);
    return null;
  }

  const updatedUser: UserObject = { ..._user, liked_blogs: updatedLikedBlogs };

  console.log(
    hasLiked ? "Blog unliked successfully!" : "Blog liked successfully!",
  );

  return updatedUser;
};
