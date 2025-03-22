import React from "react";

import Image from "next/image";
import Link from "next/link";

import { Button } from "./ui/button";
import { Home, Telescope } from "lucide-react";

interface ErrorCenterComponentProps {
  title?: string;
  subtitle?: string;
  errorCode?: string;
}

const ErrorCenterComponent = ({
  title,
  subtitle,
  errorCode,
}: ErrorCenterComponentProps) => {
  return (
    <div className="flex flex-col items-center gap-y-2 text-center">
      <Image
        src={"/colored-logo.png"}
        alt="Sonnet Logo"
        width={30}
        height={30}
      />
      <h1 className="font-bold text-2xl">{title ?? "Something went wrong"}</h1>
      <p className="text-muted-foreground mb-4 text-sm max-w-sm">
        {subtitle ?? "Im sorry about this. We'll do better"}
      </p>
      <div className="flex gap-x-2 my-4 mb-12">
        <Button variant="ghost" asChild>
          <Link href="/explore">
            <Telescope className="mr-2" />
            Explore
          </Link>
        </Button>
        <Button asChild>
          <Link href="/app">
            <Home className="mr-2" />
            Home
          </Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground/25">{errorCode}</p>
    </div>
  );
};

export default ErrorCenterComponent;
