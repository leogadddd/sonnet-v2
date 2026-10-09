import { Fragment, type ReactNode } from "react";

import { EditorBubble } from "novel";

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
  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? "bottom-start" : "top",
        onHidden: () => {
          onOpenChange(false);
        },
      }}
      className="flex w-fit max-w-[90vw] overflow-x-auto rounded-lg border border-foreground/10 bg-[#141414]"
    >
      {!open && <Fragment>{children}</Fragment>}
    </EditorBubble>
  );
};

export default GenerativeMenuSwitch;
