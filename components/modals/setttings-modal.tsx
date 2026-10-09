"use client";

import React, { useState } from "react";

import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettings } from "@/lib/store/use-settings";
import {
  SettingItemType,
  SettingsType,
  settings_list,
} from "@/lib/system/settings/settings-schema";
import { cn } from "@/lib/utils";
import { SidebarOpen } from "lucide-react";
import { useMediaQuery } from "usehooks-ts";

const SettingsModal = () => {
  const { modal_state, onClose } = useSettings();
  const [sidebar_state, setSidebarState] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<SettingsType | null>(
    settings_list[0],
  );
  const [content, setContent] = useState<
    (SettingItemType | React.FC | undefined)[] | undefined
  >(settings_list[0].content);

  const close = () => {
    onClose();
    setTimeout(() => {
      setSelectedTab(settings_list[0]); // can be deleted to improve user navigation
      setContent(settings_list[0].content);
    }, 300);
  };

  const handleTabSelect = (
    tab: SettingsType,
    content: (SettingItemType | React.FC | undefined)[],
  ) => {
    setSidebarState(false);
    setSelectedTab(tab);
    setContent(content);
  };

  return (
    <Dialog open={modal_state} onOpenChange={close}>
      <DialogContent className="p-2 w-[calc(100vw-2rem)] max-w-4xl sm:max-w-4xl h-[min(75dvh,48rem)] max-h-[calc(100dvh-2rem)] flex flex-col gap-y-1 overflow-hidden">
        <DialogHeader className="pb-0 shrink-0 pr-8">
          <div className="flex items-center gap-x-2 p-0 md:p-2">
            <Button
              onClick={() => setSidebarState(!sidebar_state)}
              className={cn("flex md:hidden")}
              variant="ghost"
              size="icon"
            >
              <SidebarOpen />
            </Button>
            <DialogTitle>Settings</DialogTitle>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 flex gap-x-4 relative overflow-hidden">
          <SettingsModal.Sidebar
            sidebar_state={sidebar_state}
            setSidebarState={() => setSidebarState(!sidebar_state)}
            handleSelect={handleTabSelect}
            selected={selectedTab}
          />
          <main className="min-h-0 min-w-0 flex-1 rounded-md flex flex-col gap-y-3 overflow-y-auto overscroll-contain p-2 md:pr-4">
            <div className="pb-4 flex flex-row justify-center md:justify-start">
              <h1 className="text-3xl font-bold">{selectedTab?.label}</h1>
            </div>
            {content &&
              content?.length > 0 &&
              content?.map((item) => {
                if (typeof item === "function") {
                  const Component = item;
                  return <Component key={item.toString()} />;
                } else if (item) {
                  return <SettingsModal.Item key={item.key} item={item} />;
                } else {
                  return <></>;
                }
              })}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface SidebarProps {
  sidebar_state: boolean;
  setSidebarState: () => void;
  selected: SettingsType | null;
  handleSelect: (
    id: SettingsType,
    content: (SettingItemType | React.FC | undefined)[],
  ) => void;
}

const Sidebar = ({
  sidebar_state,
  setSidebarState,
  selected,
  handleSelect,
}: SidebarProps) => {
  const isMobile = useMediaQuery("(max-width: 767px)");

  const onClose = () => {
    setSidebarState();
  };

  const onSelect = ({
    setting,
    content,
  }: {
    setting: SettingsType;
    content: (SettingItemType | React.FC | undefined)[];
  }) => {
    handleSelect(setting, content ?? []);
  };

  return (
    <>
      <div
        className={cn(
          "bg-background h-full max-w-full shrink-0 overflow-y-auto border md:border-0 rounded-md z-[10] p-2 md:px-0",
          isMobile
            ? sidebar_state
              ? "absolute md:relative"
              : "hidden"
            : "pt-6",
        )}
        onBlur={onClose}
      >
        <div className="h-full min-w-52 flex flex-col rounded-md">
          <div className="flex-1">
            {settings_list.map((setting) => {
              const Icon = setting.icon;
              return (
                <div
                  onClick={() =>
                    onSelect({ setting, content: setting.content ?? [] })
                  }
                  key={setting.key}
                  className={cn(
                    "pl-2 py-1.5 hover:bg-primary/5 rounded-sm cursor-pointer transition-colors flex items-center text-muted-foreground",
                    selected === setting &&
                      "font-semibold bg-primary/10 hover:bg-primary/10 text-foreground",
                  )}
                >
                  <div>
                    <Icon className={cn("shrink-0 h-[18px] mr-2")} />
                  </div>
                  <h1>{setting.label}</h1>
                </div>
              );
            })}
          </div>
          <div className="px-5 flex items-center justify-center py-2">
            <h1 className="text-xs text-muted-foreground">version 1.0</h1>
          </div>
        </div>
      </div>
    </>
  );
};

interface ItemProps {
  item: SettingItemType;
}

const Item = ({ item }: ItemProps) => {
  const { settings, updateSetting } = useSettings();
  const currentValue = settings[item.key as keyof typeof settings];

  const handleChange = (value: boolean | string | number) => {
    updateSetting(item.key as keyof typeof settings, value);
  };

  return (
    <div className="flex flex-col gap-y-0.5">
      <h1 className="text-lg font-semibold">{item.title}</h1>
      <p className="text-sm text-muted-foreground/50">{item.description}</p>
      <div className="mt-4 flex items-center px-0.5">
        {item.type === "switch" && (
          <Switch
            checked={Boolean(currentValue)}
            onCheckedChange={handleChange}
          />
        )}
      </div>
    </div>
  );
};

SettingsModal.Sidebar = Sidebar;
SettingsModal.Item = Item;

export default SettingsModal;
