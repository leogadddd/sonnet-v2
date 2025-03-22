import { create } from "zustand";

type TrashBoxStore = {
  modal_state: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useTrashbox = create<TrashBoxStore>((set) => ({
  modal_state: false,
  onOpen: () => set({ modal_state: true }),
  onClose: () => set({ modal_state: false }),
}));
