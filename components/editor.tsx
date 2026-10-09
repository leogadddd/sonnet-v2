"use client";

import { useEffect, useRef, useState } from "react";

import { defaultExtensions } from "./novel/extensions";
import GenerativeMenuSwitch from "./novel/generative/generative-menu-switch";
import { imageUploader } from "./novel/image-upload";
import { ColorSelector } from "./novel/selectors/color-selector";
import { LinkSelector } from "./novel/selectors/link-selector";
import { NodeSelector } from "./novel/selectors/node-selector";
import { TextButtons } from "./novel/selectors/text-buttons";
import { slashCommand, suggestionItems } from "./novel/slash-command";
import { Separator } from "./novel/ui/separator";
import { font } from "@/app/fonts";
import Blog from "@/lib/system/localdb/blog";
import { cn } from "@/lib/utils";
import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  type EditorInstance,
  EditorRoot,
  ImageResizer,
  type JSONContent,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
} from "novel";
import { toast } from "sonner";

const extensions = [...defaultExtensions, slashCommand];

interface EditorProps {
  blog: Blog;
  isPreview?: boolean;
  isViewer?: boolean;
}

const Editor = ({ blog, isPreview, isViewer }: EditorProps) => {
  const uploadFn = imageUploader(blog.blog_id);
  const [content] = useState<JSONContent | null>(null);
  const lastSavedContent = useRef<string | null>(null);
  const [editor, setEditor] = useState<EditorInstance | undefined>(undefined);

  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);

  const saveContent = async (instance: EditorInstance) => {
    if (isViewer || isPreview || blog.is_preview) return;
    const json = JSON.stringify(instance.getJSON());
    if (json === lastSavedContent.current) return;
    lastSavedContent.current = json;
    try {
      await blog.updateContent({
        content_json: json,
        content_html: instance.getHTML(),
      });
    } catch {
      lastSavedContent.current = null;
      toast.error("Unable to save this draft on your device.");
    }
  };

  // if editable is changed, update the editor
  useEffect(() => {
    if (editor) {
      const _isPreview = !!isViewer || !!isPreview || blog?.is_preview === 1;
      editor.setEditable(!_isPreview, false);
    }
  }, [editor, blog?.is_preview, isPreview, isViewer]);

  useEffect(() => {
    if (!editor || !blog?.content) return;

    const currentContent = JSON.stringify(editor.getJSON());
    if (currentContent === blog.content.content_json) return;
    try {
      const document = blog.content.content_json
        ? JSON.parse(blog.content.content_json)
        : blog.content.content_html || {
            type: "doc",
            content: [{ type: "paragraph" }],
          };
      editor.commands.setContent(document, false);
      lastSavedContent.current = JSON.stringify(editor.getJSON());
    } catch {
      toast.error(
        "This document could not be opened. Its saved content has been preserved.",
      );
    }
  }, [blog, editor]);

  return (
    <div className={cn("relative w-full max-w-screen-lg min-w-fit mt-4")}>
      <EditorRoot>
        <EditorContent
          immediatelyRender={false}
          initialContent={content ?? undefined}
          extensions={extensions}
          onCreate={(editor) => {
            setEditor(editor.editor);
          }}
          className={cn(
            font.className,
            "relative min-h-[20vh] w-full max-w-screen-lg sm:mb-[calc(20vh)] min-w-fit text-foreground",
          )}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) =>
              handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) =>
              handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class: `prose dark:prose-invert text-foreground prose-headings:font-title font-default focus:outline-none max-w-full text-base`,
            },
          }}
          onUpdate={({ editor }) => {
            void saveContent(editor);
          }}
          slotAfter={<ImageResizer />}
        >
          <EditorCommand className="z-50 h-auto max-h-[330px] w-[300px] overflow-y-auto rounded-lg bg-background dark:bg-background border border-text-muted dark:border-secondary p-2 pr-3 transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">
              No results
            </EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className="group cursor-pointer flex w-full items-center space-x-2 rounded-lg px-2 py-1 text-left text-sm hover:bg-accent/50 aria-selected:bg-accent/50"
                  key={item.title}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-transparent transition-all group-hover:scale-125 group-aria-selected:scale-125">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground/50">
                      {item.description}
                    </p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          <GenerativeMenuSwitch open={openAI} onOpenChange={setOpenAI}>
            <Separator orientation="vertical" />
            <NodeSelector open={openNode} onOpenChange={setOpenNode} />
            <Separator orientation="vertical" />

            <LinkSelector open={openLink} onOpenChange={setOpenLink} />
            <Separator orientation="vertical" />
            <TextButtons />
            <Separator orientation="vertical" />
            <ColorSelector open={openColor} onOpenChange={setOpenColor} />
          </GenerativeMenuSwitch>
        </EditorContent>
      </EditorRoot>
    </div>
  );
};

export default Editor;
