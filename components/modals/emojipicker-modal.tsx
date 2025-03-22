"use client";

import React, { useEffect, useRef, useState } from "react";

import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEmojiPicker } from "@/lib/store/use-emoji-picker";
import dbClient from "@/lib/system/localdb/client";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useLiveQuery } from "dexie-react-hooks";
import { Theme } from "emoji-picker-react";

// Dynamically import the Emoji Picker to prevent SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const EmojiPickerDialog: React.FC = () => {
  const params = useParams();

  const blog = useLiveQuery(
    async () => await dbClient.getBlogById(params?.blog_id as string),
    [params?.blog_id],
  );

  const { theme } = useTheme();
  const { modal_state, onOpen, onClose } = useEmojiPicker();
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");

  const handleEmojiClick = async (emojiData: { emoji: string }) => {
    await blog?.updateIcon(emojiData.emoji);
    setSelectedEmoji(emojiData.emoji);
    setInputValue((prev) => prev + emojiData.emoji);
    onClose();
  };

  return (
    <Dialog open={modal_state} onOpenChange={onClose}>
      <DialogTitle></DialogTitle>
      <DialogContent className="w-max p-2 pt-8">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          lazyLoadEmojis
          theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
          style={{
            background: "var(--background)",
            border: "none",
            boxShadow: "none",
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EmojiPickerDialog;
