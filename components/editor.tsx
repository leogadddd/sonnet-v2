"use client";

import { useEffect, useRef, useState } from "react";

import { useParams } from "next/navigation";

import { defaultExtensions } from "./novel/extensions";
import GenerativeMenuSwitch from "./novel/generative/generative-menu-switch";
import { uploadFn } from "./novel/image-upload";
import { ColorSelector } from "./novel/selectors/color-selector";
import { LinkSelector } from "./novel/selectors/link-selector";
import { NodeSelector } from "./novel/selectors/node-selector";
import { TextButtons } from "./novel/selectors/text-buttons";
import { slashCommand, suggestionItems } from "./novel/slash-command";
import { Separator } from "./novel/ui/separator";
import { font } from "@/app/fonts";
import dbClient from "@/lib/system/localdb/client";
import { cn } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
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
import { useDebouncedCallback } from "use-debounce";

const extensions = [...defaultExtensions, slashCommand];

const Editor = () => {
  const [editable] = useState<boolean>(true);
  const [isViewer] = useState<boolean>(false);
  const params = useParams();

  const blog = useLiveQuery(
    async () => await dbClient.getBlogById(params?.blog_id as string),
    [params?.blog_id],
  );

  const [content] = useState<JSONContent | null>(null);
  const lastSavedContent = useRef<string | null>(null);
  const [editor, setEditor] = useState<EditorInstance | undefined>(undefined);

  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);

  const debouncedUpdates = useDebouncedCallback(
    async (editor: EditorInstance) => {
      const json = JSON.stringify(editor.getJSON());
      if (json !== lastSavedContent.current) {
        lastSavedContent.current = json;
        await blog?.updateContent(json);
      }
    },
    500,
  );

  // if editable is changed, update the editor
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  useEffect(() => {
    if (!editor || !blog?.content) return;

    const currentContent = JSON.stringify(editor.getJSON());
    lastSavedContent.current = currentContent;
    if (currentContent === blog.content) return; // Avoid unnecessary re-renders

    const { from, to } = editor.state.selection; // Save cursor position

    editor.commands.setContent(JSON.parse(blog.content), false); // Load new content without focusing
    editor.commands.focus(); // Ensure the editor remains focused

    try {
      editor.commands.setTextSelection({ from, to }); // Restore cursor position
    } catch (e) {
      console.warn("Failed to restore selection:", e);
    }
  }, [blog, editor]);

  return (
    <div
      className={cn(
        "relative w-full max-w-screen-lg min-w-fit mt-4",
        !editable && isViewer && "px-14",
      )}
    >
      <EditorRoot>
        <EditorContent
          initialContent={content ?? undefined}
          extensions={extensions}
          editable={editable}
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
            debouncedUpdates(editor);
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
