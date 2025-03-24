import React from "react";

import { useTheme } from "next-themes";

import { Avatar, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useSettings } from "@/lib/store/use-settings";
import { useUser } from "@/lib/store/use-user";
import { useClerk } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { CheckCircle } from "lucide-react";

const AccountCenter = () => {
  const { theme } = useTheme();
  const clerk = useClerk();
  const { user } = useUser();
  const { onClose } = useSettings();

  if (!user) return <></>;

  const openAccountCenter = () => {
    clerk.openUserProfile({
      appearance: {
        baseTheme: theme === "dark" ? dark : undefined,
      },
    });
    onClose();
  };

  return (
    <div>
      <div className="flex flex-col gap-y-2">
        <div className="my-2">
          <p className="text-sm text-muted-foreground">
            Manage your Sonnet account details here. Your account is securely
            handled through our authentication provider.
          </p>
        </div>
        <div className="flex p-4 border rounded-md my-4">
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
            <AvatarImage src={user.image_url!} />
          </Avatar>
          <div className="ml-2 text-sm/4">
            <h1 className="font-semibold flex items-center gap-1">
              {user?.first_name}
              <span className="text-xs font-normal text-muted-foreground/50">{`(${user?.username})`}</span>
            </h1>
            <span className="text-xs text-muted-foreground">
              {user?.email_addresses[0].email_address}
            </span>
          </div>
          <div className="flex items-center px-2">
            <div className="px-2 border rounded-sm">
              <h1 className="text-xs">{user?.plan.currentPlan}</h1>
            </div>
          </div>
        </div>
        <div>
          <h1 className="text-sm text-muted-foreground">Name: </h1>
          <div className="flex gap-x-2">
            <Input
              value={user?.first_name}
              placeholder="First Name"
              readOnly
              disabled
            />
            <Input
              value={user?.last_name}
              placeholder="Last Name"
              readOnly
              disabled
            />
          </div>
        </div>
        <div>
          <h1 className="text-sm text-muted-foreground">Username: </h1>
          <div className="flex gap-x-2">
            <Input
              value={user?.username}
              placeholder="Username"
              readOnly
              disabled
            />
          </div>
        </div>
        <div>
          <h1 className="text-sm text-muted-foreground">
            Email{user?.email_addresses.length > 1 && "s"}:{" "}
          </h1>
          <div className="flex gap-x-2">
            {user?.email_addresses.map((email) => (
              <div key={email.id} className="flex items-center gap-x-2 w-full">
                <Input
                  value={email?.email_address}
                  placeholder="Email Address"
                  readOnly
                  disabled
                />
                {email.verification?.status === "verified" && (
                  <h1 className="text-sm text-green-500 flex items-center">
                    verified <CheckCircle className="h-4 w-4 ml-2" />{" "}
                  </h1>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="my-12 flex items-center justify-center">
          <Button onClick={openAccountCenter}>Open Account Center</Button>
        </div>
      </div>
    </div>
  );
};

export default AccountCenter;
