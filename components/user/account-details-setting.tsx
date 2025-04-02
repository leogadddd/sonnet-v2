import React from "react";

import { Avatar, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { useUser } from "@/lib/store/use-user";
import { cn } from "@/lib/utils";

const AccountDetailsSettings = () => {
  const { user } = useUser();

  if (user === null) {
    return (
      <div className="min-h-16 bg-secondary/50 border rounded-md flex items-center justify-center">
        <h1>Not Authenticated</h1>
      </div>
    );
  }

  return (
    <div className="min-h-16 px-4 flex items-center border rounded-md gap-x-2">
      <Avatar className="h-9 w-9">
        <AvatarImage src={user.image_url!} />
      </Avatar>
      <div className="flex flex-col flex-1">
        <h1 className="text-sm font-semibold">
          {user.first_name} {user.last_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {user.email_addresses[0].email_address}
        </p>
      </div>
      <div>
        <Badge className={cn(user.plan.currentPlan == "Pro" && "bg-[#ff914d]")}>
          {user.plan.currentPlan}
        </Badge>
      </div>
    </div>
  );
};

export default AccountDetailsSettings;
