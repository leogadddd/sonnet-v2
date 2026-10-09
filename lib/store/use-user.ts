import type { UserObject } from "../system/user/user";
import { create } from "zustand";

interface UserStore {
  user: UserObject | null;
  setUser: (user: UserObject | null) => void;
}
export const useUser = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
