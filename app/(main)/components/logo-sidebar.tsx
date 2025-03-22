"use client";

import { memo } from "react";

import Image from "next/image";

const size = { width: 125, height: 50 };

const Logo = () => {
  return (
    <div
      style={{ width: size.width, height: size.height }}
      className="object-contain flex items-center justify-center"
    >
      <Image
        src="/light-logo-text.png"
        alt="Logo"
        width={size.width}
        height={size.height}
        priority
        className="dark:hidden shrink-0"
      />
      <Image
        src="/dark-logo-text.png"
        alt="Logo"
        width={size.width}
        height={size.height}
        priority
        className="hidden dark:block shrink-0"
      />
    </div>
  );
};

export default memo(Logo);
