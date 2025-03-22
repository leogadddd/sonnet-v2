import { create } from "zustand";

type SearchCommand = {
  modal_state: boolean;
  onOpen: () => void;
  onClose: () => void;
  toggle: () => void;
};

export const useSearchCommand = create<SearchCommand>((set, get) => ({
  modal_state: false,
  onOpen: () => set({ modal_state: true }),
  onClose: () => set({ modal_state: false }),
  toggle: () => set({ modal_state: !get().modal_state }),
}));
