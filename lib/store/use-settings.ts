import { SettingsManager } from "../system/settings-manager";
import { Settings } from "../system/settings/settings";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define store type
type SettingsStore = {
  modal_state: boolean;
  settings: Settings;
  onOpen: () => void;
  onClose: () => void;
  toggle: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateSetting: (key: keyof SettingsManager["settings"], value: any) => void;
};

// Create Zustand store with persistence
export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      modal_state: false,
      settings: new Settings(),

      onOpen: () => set({ modal_state: true }),
      onClose: () => set({ modal_state: false }),
      toggle: () => set((state) => ({ modal_state: !state.modal_state })),

      updateSetting: (key, value) => {
        set((state) => {
          const updatedSettings = {
            ...state.settings,
            [key]: value,
          };
          state.settings = updatedSettings;
          return { settings: new Settings(updatedSettings) };
        });
      },
    }),
    {
      name: "settings-storage", // Key for local storage
    },
  ),
);
