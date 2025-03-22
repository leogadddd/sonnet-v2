"use client";

import Link from "next/link";

import { Spinner } from "@/components/ui/spinner";
import { SignInButton, useAuth } from "@clerk/nextjs";

export default function MarketingPage() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    <div className="flex items-center justify-center">
      <Spinner />
    </div>;
  }

  return (
    <div className="flex h-screen w-full items-center justify-center gap-x-2">
      {!isSignedIn ? <SignInButton /> : <Link href={"/app"}>App</Link>}
    </div>
  );
}
