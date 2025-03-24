import { defaultSettingsValue } from "./settings";
import AccountCenter from "@/components/user/account-settings";
import {
  BookOpen,
  Cloud,
  LucideIcon,
  MessageCircleQuestion,
  PaintbrushVertical,
  SettingsIcon,
  User,
} from "lucide-react";

export type SettingType = "switch" | "dropdown" | "text" | "number";

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
  content?: (SettingItemType | React.FC | undefined)[];
};

export const settings_list: SettingsType[] = [
  {
    key: "account",
    label: "Account",
    icon: User,
    content: [AccountCenter],
  },
  {
    key: "sonnet-sync",
    label: "Sonnet Sync",
    icon: Cloud,
  },
  {
    key: "general",
    label: "General",
    icon: SettingsIcon,
  },
  {
    key: "appearance",
    label: "Appearance",
    icon: PaintbrushVertical,
    content: [
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
    icon: MessageCircleQuestion,
  },
  {
    key: "about",
    label: "About",
    icon: BookOpen,
  },
];
