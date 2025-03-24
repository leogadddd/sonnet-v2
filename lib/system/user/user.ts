import { EmailAddressJSON } from "@clerk/backend";

export type UserObject = {
  id: string;
  clerk_id: string;

  username: string | null;
  email_addresses: EmailAddressJSON[];
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;

  plan: PlanType;

  liked_blogs: string[];
  saved_blogs: string[];

  is_verified: boolean;
  is_banned: boolean;
  is_deleted: boolean;

  synced_blog_count: number;
  total_storage_used: number;

  preference: object; //for now

  deleted_at: number;
  created_at: number;
  updated_at: number;
};

export type NewUser = {
  clerk_id: string;

  username: string | null;
  email_addresses: EmailAddressJSON[];
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
};

export type PlanType = {
  currentPlan: "Free" | "Pro";
};

export type Preference = {
  isDarkMode: boolean;
};

export class User {
  id!: string;
  clerk_id!: string;

  username!: string;
  email_addresses!: EmailAddressJSON[];
  first_name!: string;
  last_name!: string;
  image_url!: string | null;

  plan: PlanType = { currentPlan: "Free" };

  liked_blogs: string[] = [];
  saved_blogs: string[] = [];

  is_verified: boolean = false;
  is_banned: boolean = false;
  is_deleted: boolean = false;

  synced_blog_count: number = 0;
  total_storage_used: number = 0;

  preference: Preference = { isDarkMode: true };

  deleted_at: number = 0;
  created_at: number = Date.now();
  updated_at: number = Date.now();

  constructor(user: NewUser | UserObject) {
    Object.assign(this, user);
  }

  toJSON() {
    return {
      id: this.id,
      clerk_id: this.clerk_id,
      username: this.username,
      email_addresses: this.email_addresses,
      first_name: this.first_name,
      last_name: this.last_name,
      image_url: this.image_url,
      plan: this.plan,
      liked_blogs: this.liked_blogs,
      saved_blogs: this.saved_blogs,
      is_verified: this.is_verified,
      is_banned: this.is_banned,
      is_deleted: this.is_deleted,
      synced_blog_count: this.synced_blog_count,
      total_storage_used: this.total_storage_used,
      preference: this.preference,
      deleted_at: this.deleted_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
