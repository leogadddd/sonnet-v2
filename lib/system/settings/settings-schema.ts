import {
  BookOpen,
  HandHelping,
  LucideIcon,
  MessageCircleQuestion,
  PaintbrushVertical,
  SettingsIcon,
} from "lucide-react";

export type SettingCategoryType = "General" | "Appearance" | "Help" | "About";
export type SettingType = "switch" | "dropdown" | "text" | "number";

export class Settings {
  darkmode: boolean = true;

  constructor(initial?: Settings) {
    Object.assign(this, initial);
  }
}

export const defaultSettingsValue = new Settings();

export type SettingItemType = {
  key: string;
  type: SettingType;
  title: string;
  description?: string;
  options?: { label: string; value: string | number }[];
  defaultValue: string | number | boolean;
};

export type SettingsType = {
  key: string;
  label: string;
  icon: LucideIcon;
  category: SettingCategoryType;
  settings_list?: SettingItemType[];
};

export const settings_list: SettingsType[] = [
  {
    key: "general",
    label: "General",
    category: "General",
    icon: SettingsIcon,
  },
  {
    key: "appearance",
    label: "Appearance",
    category: "Appearance",
    icon: PaintbrushVertical,
    settings_list: [
      {
        key: "darkmode",
        type: "switch",
        title: "Dark Mode",
        description:
          "Please… stay in dark mode. ☀️ Light mode wasn’t my priority. Flip at your own risk.",
        defaultValue: defaultSettingsValue.darkmode,
      },
    ],
  },
  {
    key: "help",
    label: "Help",
    category: "Help",
    icon: MessageCircleQuestion,
  },
  {
    key: "about",
    label: "About",
    category: "About",
    icon: BookOpen,
  },
];
