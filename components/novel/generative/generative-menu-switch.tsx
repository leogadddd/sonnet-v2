import { Fragment, type ReactNode, useEffect } from "react";

import { EditorBubble, removeAIHighlight, useEditor } from "novel";

interface GenerativeMenuSwitchProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const GenerativeMenuSwitch = ({
  children,
  open,
  onOpenChange,
}: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor();

  useEffect(() => {
    if (!open) removeAIHighlight(editor!);
  }, [open, editor]);
  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? "bottom-start" : "top",
        onHidden: () => {
          onOpenChange(false);
          editor!.chain().unsetHighlight().run();
        },
      }}
      className="flex w-fit max-w-[90vw] overflow-x-auto rounded-lg border border-foreground/10 bg-[#141414]"
    >
      {!open && <Fragment>{children}</Fragment>}
    </EditorBubble>
  );
};

export default GenerativeMenuSwitch;
