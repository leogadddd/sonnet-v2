import React from "react";

import { useTheme } from "next-themes";

import { Avatar, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const AppUser = () => {
  const { theme } = useTheme();
  const clerk = useClerk();
  const { user } = useUser();

  if (!user) return <></>;

  return (
    <div className="min-h-[70px] flex items-center justify-start px-4">
      <div className="flex items-center">
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
          <AvatarImage src={user.imageUrl} />
        </Avatar>
        <div className="ml-2 text-sm/4">
          <h1 className="font-semibold flex items-center gap-1">
            {/* {user?.firstName} */}
            {/* <span className="text-xs font-normal text-muted-foreground/50">{`(${user?.username})`}</span> */}
          </h1>
          <span className="text-xs text-muted-foreground">
            {/* {user?.emailAddresses[0].emailAddress} */}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AppUser;
