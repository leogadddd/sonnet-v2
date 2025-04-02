import Blog from "./system/localdb/blog";
import { PlanType } from "./system/user/user";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class TimeFormatter {
  static timeAgo(timestamp: number): string {
    if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
      return "Invalid date";
    }

    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 0) return "Future date"; // Handle future timestamps

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const date = new Date(timestamp);

    if (seconds < 1) return "just now";
    if (seconds < 60) return `${seconds} sec ago`;
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    if (date.getFullYear() !== new Date().getFullYear()) {
      options.year = "numeric";
    }

    return new Intl.DateTimeFormat("en-US", options).format(date);
  }

  static difference(start: number, end: number): string {
    const diff = end - start;

    if (diff < 1000) return `${diff} millisecond${diff !== 1 ? "s" : ""}`;

    const seconds = (diff / 1000).toFixed(1);
    return `${seconds} second${parseFloat(seconds) !== 1 ? "s" : ""}`;
  }
}

export function getReadTime(jsonString: string) {
  const wordsPerMinute = 200;

  // Parse JSON
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Invalid JSON format ${error}`);
  }

  // Function to extract text recursively
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function extractText(content: any[]): string {
    return content
      .map((block) => {
        if (block.type === "text") return block.text;
        if (block.content) return extractText(block.content);
        return "";
      })
      .join(" ");
  }

  // Extract and clean text
  const cleanedText = extractText(parsed.content).replace(/\s+/g, " ").trim();
  const wordCount = cleanedText.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);

  return readTime;
}

export type BlogDifferences = {
  hasDifferences: boolean;
  fields: Partial<Record<keyof Blog, { local: Blog; cloud: Blog }>>;
};

export const getMaxSyncBlogs = (plan: PlanType): number => {
  if (plan.currentPlan === "Pro") return -1;
  return 5;
};

export const getMaxStorage = (plan: PlanType): number => {
  if (plan.currentPlan === "Pro") return -1;
  return 1048576 * 500;
};

export const formatBytes = (
  bytes: number,
  decimalPlaces: number = 2,
): string => {
  if (bytes <= 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);

  return `${value.toFixed(decimalPlaces)} ${sizes[i]}`;
};

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Remove consecutive hyphens
}

export function normalize(text: string): string {
  return text
    .split(" ")
    .map((word) => word.toLowerCase())
    .join("");
}
