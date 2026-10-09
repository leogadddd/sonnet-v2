import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { Workspace } from "@/components/auth/workspace";
import { getAccount } from "@/lib/auth/account";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await getAccount())) redirect("/sign-in");
  return <Workspace>{children}</Workspace>;
}
