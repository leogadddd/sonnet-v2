import type { Metadata } from "next";

import { EdgeStoreProvider } from "../lib/edgestore/edgestore";
import { poppins } from "./fonts";
import "./styles/globals.css";
import ModalsProvider from "@/components/modals";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/providers/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Sonnet",
  description:
    "Sonnet is a sleek and powerful MDX editor designed for seamless note-taking, documentation, and creative writing. Elevate your ideas with structured markdown and dynamic components—all in a beautifully minimal workspace",
  keywords: ["Blog", "Notion", "Editor"],
  authors: [{ name: "Jann Leo B. Gadil", url: "https://leogadil.com" }],
  applicationName: "Sonnet",
  creator: "Jann Leo B. Gadil",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <head>
        <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />
      </head> */}
      <body className={cn("antialiased", poppins.className)}>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          <EdgeStoreProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <Toaster position="bottom-right" />
              <ModalsProvider />
              {children}
            </ThemeProvider>
          </EdgeStoreProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
