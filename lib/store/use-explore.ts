import { BlogData } from "../explore/action/getBlogs";
import { TabData } from "../explore/action/getTabs";
import { create } from "zustand";

interface ExploreStore {
  tabs: TabData[];
  currentTab: TabData | null;
  blogs: BlogData[];
  cursor: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;

  setInitial: (tabs: TabData[], current?: TabData) => void;
  changeTab: (tab: TabData) => void;
  loadMoreBlogs: (blogs: BlogData[]) => void;
  setLoadingMore: (value: boolean) => void;
  reset: () => void;
}

export const useExplore = create<ExploreStore>((set) => ({
  tabs: [],
  currentTab: null,
  blogs: [],
  cursor: null,
  hasMore: true,
  isLoadingMore: false,

  setInitial: (tabs: TabData[], current?: TabData) =>
    set({ tabs, currentTab: current, cursor: null }),
  changeTab: (tab: TabData) =>
    set({ currentTab: tab, blogs: [], cursor: null }),
  setLoadingMore: (value: boolean) => set({ isLoadingMore: value }),
  loadMoreBlogs: (newBlogs: BlogData[]) =>
    set((state) => ({
      blogs: [...state.blogs, ...newBlogs],
      cursor: newBlogs.length
        ? newBlogs[newBlogs.length - 1].blog_id
        : state.cursor,
      hasMore: newBlogs.length > 0,
      isLoadingMore: false,
    })),

  reset: () =>
    set({
      tabs: [],
      currentTab: null,
      blogs: [],
      cursor: null,
      hasMore: true,
      isLoadingMore: false,
    }),
}));
