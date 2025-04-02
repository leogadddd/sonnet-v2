import { create } from "zustand";

type PublishStore = {
  modal_state: boolean;
  blog_id: string | null;
  onOpen: () => void;
  onClose: () => void;
  toggle: () => void;
  openWithBlog: (blog_id: string) => void;
};

export const usePublish = create<PublishStore>((set, get) => ({
  modal_state: false,
  blog_id: null,
  onOpen: () => set({ modal_state: true }),
  onClose: () => set({ modal_state: false, blog_id: null }),
  toggle: () => set({ modal_state: !get().modal_state }),
  openWithBlog: (blog_id: string) =>
    set({ modal_state: true, blog_id: blog_id }),
}));
