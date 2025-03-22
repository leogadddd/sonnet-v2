import React, {
  ComponentRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useParams } from "next/navigation";

import dbClient from "@/lib/system/localdb/client";
import { useLiveQuery } from "dexie-react-hooks";
import TextareaAutosize from "react-textarea-autosize";

const TopbarTitle = () => {
  const params = useParams();

  const blog = useLiveQuery(
    async () => await dbClient.getBlogById(params?.blog_id as string),
    [params?.blog_id],
  );

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

  if (!blog) return <></>;

  return (
    <>
      {isEditing ? (
        <TextareaAutosize
          ref={inputRef}
          placeholder={blog?.parent_blog === "" ? "New Blog" : "New Page"}
          onKeyDown={onKeyDown}
          onBlur={disableInput}
          value={value}
          maxRows={1}
          onChange={(e) => onInput(e.target.value)}
          className="bg-transparent outline-none resize-none p-1 px-2 w-80 truncate max-h-[48px] line-clamp-1"
        />
      ) : (
        <div
          className="select-none cursor-text p-1 px-2 rounded-md max-w-80 truncate"
          onClick={enableInput}
        >
          {blog?.title!}
        </div>
      )}
    </>
  );
};

export default TopbarTitle;
