import { create } from "zustand";

type EmojiPickerStore = {
  modal_state: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useEmojiPicker = create<EmojiPickerStore>((set) => ({
  modal_state: false,
  onOpen: () => set({ modal_state: true }),
  onClose: () => set({ modal_state: false }),
}));
