import React, { ComponentRef, useRef, useState } from "react";

import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useCoverImage } from "@/lib/store/use-cover-image";
import { useEmojiPicker } from "@/lib/store/use-emoji-picker";
import { useUser } from "@/lib/store/use-user";
import Blog from "@/lib/system/localdb/blog";
import dbClient from "@/lib/system/localdb/client";
import { TimeFormatter, cn } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
import { Image, Smile, X } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

interface ToolbarProps {
  blog: Blog;
  isPreview?: boolean;
  isViewer?: boolean;
}

const Toolbar = ({
  blog,
  isPreview = false,
  isViewer = false,
}: ToolbarProps) => {
  const _isPreview = isPreview || blog?.is_preview === 1 ? true : false;

  return (
    <div className="w-full group/toolbar">
      <Toolbar.Icon blog={blog!} isPreview={_isPreview} />
      <Toolbar.Buttons blog={blog!} isPreview={_isPreview} />
      <Toolbar.Title blog={blog!} isPreview={_isPreview} />
      <Toolbar.Description blog={blog!} isPreview={_isPreview} />
      <div className="border-b opacity-50 h-2" />
    </div>
  );
};

interface IconProps {
  blog: Blog;
  isPreview: boolean;
}

const Icon = ({ blog, isPreview }: IconProps) => {
  const { onOpen } = useEmojiPicker();

  const openEmojiPicker = () => {
    if (isPreview) return;
    onOpen();
  };

  const removeIcon = async () => {
    if (isPreview) return;

    await blog?.updateIcon(null);
  };

  return (
    <div className={cn("relative", blog?.cover_image && "h-8")}>
      {blog?.icon && (
        <div
          className={cn(
            "flex items-center group gap-x-4",
            blog?.cover_image && "absolute -translate-y-1/2",
          )}
        >
          <div
            role="button"
            onClick={openEmojiPicker}
            className={cn(
              "w-max cursor-default",
              !isPreview &&
                "cursor-pointer transition-opacity hover:opacity-75",
            )}
          >
            <p className="text-5xl lg:text-6xl">{blog?.icon}</p>
          </div>
          {!isPreview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={removeIcon}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground text-xs border-none bg-transparent hover:bg-background/50"
            >
              <X />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

interface ButtonsProps {
  blog: Blog;
  isPreview: boolean;
}

const Buttons = ({ blog, isPreview }: ButtonsProps) => {
  const { onOpen: onOpenCoverImage } = useCoverImage();
  const { onOpen: onOpenEmojiPicker } = useEmojiPicker();

  return (
    <div className="flex gap-x-2 opacity-0 group-hover/toolbar:opacity-100 transition-opacity my-2 mt-4">
      {!isPreview && (
        <>
          {!blog?.icon && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenEmojiPicker}
              className="text-muted-foreground/25 text-xs font-normal"
            >
              <Smile className="mr-2" />
              add icon
            </Button>
          )}
          {!blog?.cover_image?.image_url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenCoverImage}
              className="text-muted-foreground/25 text-xs font-normal"
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="mr-2" />
              add cover
            </Button>
          )}
        </>
      )}
    </div>
  );
};

interface TitleProps {
  blog: Blog;
  isPreview: boolean;
}

const Title = ({ blog, isPreview }: TitleProps) => {
  const inputRef = useRef<ComponentRef<"textarea">>(null);
  const [value, setValue] = useState<string>(blog?.title);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const enableInput = () => {
    if (isPreview) return;

    setIsEditing(true);
    setValue(blog!.title);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const disableInput = async () => {
    if (isPreview) return;

    setIsEditing(false);
    if (!value || value === "") {
      const title = blog?.parent_blog === "" ? "New Blog" : "New Page";
      setValue(title);
      await blog?.updateTitle(title);
    }
  };

  const onInput = async (value: string) => {
    if (isPreview) return;

    setValue(value);
    await blog?.updateTitle(value);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      disableInput();
    }
  };

  return (
    <>
      {isEditing ? (
        <TextareaAutosize
          ref={inputRef}
          placeholder={blog?.parent_blog === "" ? "New Blog" : "New Page"}
          onKeyDown={onKeyDown}
          onBlur={disableInput}
          value={value}
          onChange={(e) => onInput(e.target.value)}
          className="bg-transparent break-all outline-none resize-none text-3xl sm:text-4xl md:text-5xl font-semibold w-full"
        />
      ) : (
        <div role="button" onClick={enableInput} className="pb-[11px]">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold break-all w-full">
            {blog?.title}
          </h1>
        </div>
      )}
    </>
  );
};

interface DescriptionProps {
  blog: Blog;
  isPreview: boolean;
}

const Description = ({ blog, isPreview }: DescriptionProps) => {
  const inputRef = useRef<ComponentRef<"textarea">>(null);
  const [value, setValue] = useState<string>(blog?.description);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const enableInput = () => {
    if (isPreview) return;

    setIsEditing(true);
    setValue(blog!.description);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const disableInput = async () => {
    if (isPreview) return;

    setIsEditing(false);
  };

  const onInput = async (value: string) => {
    if (isPreview) return;

    setValue(value);
    await blog?.updateDescription(value);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      disableInput();
    }
  };

  return (
    <div className="my-2">
      {isEditing ? (
        <TextareaAutosize
          ref={inputRef}
          placeholder="add a description"
          onKeyDown={onKeyDown}
          onBlur={disableInput}
          value={value}
          onChange={(e) => onInput(e.target.value)}
          className="bg-transparent break-words outline-none resize-none placeholder:text-muted-foreground/50 w-full break-all "
        />
      ) : (
        <div role="button" onClick={enableInput} className="pb-[1px]">
          {blog?.description === null || blog?.description === "" ? (
            <span
              className={cn(
                "text-muted-foreground/25 opacity-0",
                !isPreview && "group-hover/toolbar:opacity-100 transition-all",
              )}
            >
              add a description
            </span>
          ) : (
            <h1 className="text-muted-foreground w-full break-all">
              {blog?.description}
            </h1>
          )}
        </div>
      )}
    </div>
  );
};

Toolbar.Icon = Icon;
Toolbar.Buttons = Buttons;
Toolbar.Title = Title;
Toolbar.Description = Description;

export default Toolbar;
