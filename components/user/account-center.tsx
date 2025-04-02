import React from "react";

import { useTheme } from "next-themes";

import ConfirmModal from "../modals/confirm-modal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import AccountDetailsSettings from "./account-details-setting";
import { useSettings } from "@/lib/store/use-settings";
import { useUser } from "@/lib/store/use-user";
import { useClerk } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { CheckCircle } from "lucide-react";

const AccountCenter = () => {
  const { theme } = useTheme();
  const clerk = useClerk();
  const { user, setUser } = useUser();
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

  const signOut = () => {
    clerk.signOut();
    setUser(null);
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
        <AccountDetailsSettings />
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
          <div className="flex flex-col gap-x-2">
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
        <div className="my-12 flex items-center justify-between gap-x-2">
          <Button onClick={openAccountCenter} variant="outline">
            Open Account Center
          </Button>
          <ConfirmModal
            onConfirm={signOut}
            title="Logout?"
            subText="You need to Log back in again."
            confirmText="Logout"
          >
            <Button variant="destructive">Logout</Button>
          </ConfirmModal>
        </div>
      </div>
    </div>
  );
};

export default AccountCenter;
