import { create } from "zustand";

type CoverImageStore = {
  modal_state: boolean;
  onOpen: () => void;
  onClose: () => void;

  url?: string;
  onReplace: (url: string) => void;
};

export const useCoverImage = create<CoverImageStore>((set) => ({
  modal_state: false,
  onOpen: () => set({ modal_state: true }),
  onClose: () => set({ modal_state: false }),

  url: undefined,
  onReplace: (url: string) => set({ modal_state: true, url }),
}));
