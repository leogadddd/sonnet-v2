import React from "react";

import { useTheme } from "next-themes";

import { Avatar, AvatarImage } from "../ui/avatar";
import { useUser } from "@/lib/store/use-user";
import { useClerk } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const AppUser = () => {
  const { theme } = useTheme();
  const clerk = useClerk();
  const { user } = useUser();

  if (!user) return <></>;

  return (
    <div className="min-h-[70px] flex items-center justify-start px-4">
      <div className="flex items-center">
        {user?.image_url && (
          <Avatar
            role="button"
            className="hover:opacity-75 cursor-pointer transition-opacity"
            onClick={() =>
              clerk.openUserProfile({
                appearance: {
                  baseTheme: theme === "dark" ? dark : undefined,
                },
              })
            }
          >
            <AvatarImage src={user?.image_url} />
          </Avatar>
        )}
        <div className="ml-2 text-sm/4">
          <h1 className="font-semibold flex items-center gap-1">
            {user?.first_name}
            <span className="text-xs font-normal text-muted-foreground/50">{`(${user?.username})`}</span>
          </h1>
          <span className="text-xs text-muted-foreground">
            {user?.email_addresses[0].email_address}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AppUser;
