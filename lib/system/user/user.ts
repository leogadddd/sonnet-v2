export type PlanType = { currentPlan: "Free" | "Pro" };
export type PublicProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
};
export type UserObject = PublicProfile & {
  email: string;
  is_verified: boolean;
  plan: PlanType;
  liked_blogs: string[];
  saved_blogs: string[];
  synced_blog_count: number;
  total_storage_used: number;
};
export type User = UserObject;
