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

const Toolbar = () => {
  const params = useParams();

  const blog = useLiveQuery(
    async () => await dbClient.getBlogById(params?.blog_id as string),
    [params?.blog_id],
  );

  return (
    <div className="w-full group/toolbar">
      <Toolbar.Icon blog={blog!} />
      <Toolbar.Buttons blog={blog!} />
      <Toolbar.Title blog={blog!} />
      <Toolbar.Description blog={blog!} />
      <Toolbar.Meta blog={blog!} />
    </div>
  );
};

interface MetaProps {
  blog: Blog;
}

type Metadata = {
  label: string;
  value: string;
};

Toolbar.Meta = ({ blog }: MetaProps) => {
  const { user } = useUser();

  const metadataList: Metadata[] = [
    {
      label: "Owner",
      value:
        user?.id === blog?.author_id
          ? "You"
          : `${user?.first_name} ${user?.last_name}`,
    },
    {
      label: "Read Time",
      value: `${blog?.read_time} min${blog?.read_time > 1 ? "s" : ""}`,
    },
    {
      label: "Created",
      value: TimeFormatter.timeAgo(blog?.created_at),
    },
  ];

  if (!user || !blog) return <></>;

  return (
    <div className="py-4 opacity-30 group-hover/toolbar:opacity-75 transition-opacity">
      <div className="min-h-[52px] border-y border-muted-foreground/5 flex justify-between items-center">
        {metadataList.map((metadata) => (
          <div key={metadata.label} className="flex flex-col ">
            <h1 className="text-sm text-muted-foreground/50">
              {metadata.label}
            </h1>
            <span className="font-semibold text-sm">{metadata.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface IconProps {
  blog: Blog;
}

Toolbar.Icon = ({ blog }: IconProps) => {
  const { onOpen } = useEmojiPicker();

  const removeIcon = async () => {
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
            onClick={onOpen}
            className="cursor-pointer hover:opacity-75 transition-opacity w-max"
          >
            <p className="text-5xl lg:text-6xl">{blog?.icon}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeIcon}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground text-xs border-none bg-transparent hover:bg-background/50"
          >
            <X />
          </Button>
        </div>
      )}
    </div>
  );
};

interface ButtonsProps {
  blog: Blog;
}

Toolbar.Buttons = ({ blog }: ButtonsProps) => {
  const { onOpen: onOpenCoverImage } = useCoverImage();
  const { onOpen: onOpenEmojiPicker } = useEmojiPicker();

  return (
    <div className="flex gap-x-2 opacity-0 group-hover/toolbar:opacity-100 transition-opacity my-2 mt-4">
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
      {!blog?.cover_image && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenCoverImage}
          className="text-muted-foreground/25 text-xs font-normal"
        >
          <Image className="mr-2" />
          add cover
        </Button>
      )}
    </div>
  );
};

interface TitleProps {
  blog: Blog;
}

Toolbar.Title = ({ blog }: TitleProps) => {
  const inputRef = useRef<ComponentRef<"textarea">>(null);
  const [value, setValue] = useState<string>(blog?.title!);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const enableInput = () => {
    setIsEditing(true);
    setValue(blog!.title);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const disableInput = async () => {
    setIsEditing(false);
    if (!value || value === "") {
      const title = blog?.parent_blog === "" ? "New Blog" : "New Page";
      setValue(title);
      await blog?.updateTitle(title);
    }
  };

  const onInput = async (value: string) => {
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
          className="bg-transparent break-all outline-none resize-none text-3xl sm:text-4xl md:text-5xl font-bold w-full"
        />
      ) : (
        <div role="button" onClick={enableInput} className="pb-[11px]">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold break-all w-full">
            {blog?.title}
          </h1>
        </div>
      )}
    </>
  );
};

interface DescriptionProps {
  blog: Blog;
}

Toolbar.Description = ({ blog }: DescriptionProps) => {
  const inputRef = useRef<ComponentRef<"textarea">>(null);
  const [value, setValue] = useState<string>(blog?.description!);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const enableInput = () => {
    setIsEditing(true);
    setValue(blog!.description);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const disableInput = async () => {
    setIsEditing(false);
  };

  const onInput = async (value: string) => {
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
            <span className="text-muted-foreground/25 opacity-0 group-hover/toolbar:opacity-100 transition-all">
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

export default Toolbar;
