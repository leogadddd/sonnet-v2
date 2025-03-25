import Blog from "./system/localdb/blog";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class TimeFormatter {
  static timeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 1) return "just now";
    if (seconds < 60) return `${seconds} sec ago`;
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  static difference(start: number, end: number): string {
    const diff = end - start;

    if (diff < 1000) return `${diff} millisecond${diff !== 1 ? "s" : ""}`;

    const seconds = (diff / 1000).toFixed(1); // Keeps one decimal place if necessary
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
