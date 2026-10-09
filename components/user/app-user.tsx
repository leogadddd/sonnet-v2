"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useUser } from "@/lib/store/use-user";

export default function AppUser() {
  const { user } = useUser();
  if (!user) return null;
  return (
    <Link
      href="/app/account"
      className="min-h-[70px] flex items-center gap-2 px-4 hover:opacity-75"
    >
      <Avatar>
        <AvatarImage src={user.image_url ?? undefined} />
        <AvatarFallback>{user.first_name?.slice(0, 1) ?? "S"}</AvatarFallback>
      </Avatar>
      <div className="text-sm">
        <p className="font-semibold">
          {user.first_name || user.username || "Your account"}
        </p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>
    </Link>
  );
}
