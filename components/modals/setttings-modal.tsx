"use client";

import React, { useState } from "react";

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
  SettingType,
  SettingsType,
  settings_list,
} from "@/lib/system/settings/settings-schema";
import { cn } from "@/lib/utils";

const SettingsModal = () => {
  const { modal_state, onClose } = useSettings();
  const [selectedTab, setSelectedTab] = useState<SettingsType | null>(
    settings_list[0],
  );
  const [activePanel, setActivePanel] = useState<SettingItemType[] | null>(
    null,
  );

  const close = () => {
    setSelectedTab(settings_list[0]); // can be deleted to improve user navigation
    setActivePanel(settings_list[0].settings_list!);
    onClose();
  };

  const handleTabSelect = (
    tab: SettingsType,
    settings_list: SettingItemType[],
  ) => {
    setSelectedTab(tab);
    setActivePanel(settings_list);
  };

  return (
    <Dialog open={modal_state} onOpenChange={close}>
      <DialogContent className="p-2 w-[calc(75vh)] md:max-w-[100vh] h-[75vh] md:min-h-[60vh] flex flex-col gap-y-1">
        <DialogHeader className="p-2 pb-0">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="h-full flex gap-x-4">
          <SettingsModal.Sidebar
            handleSelect={handleTabSelect}
            selected={selectedTab}
          />
          <main className="flex-1 rounded-md flex flex-col gap-y-3">
            <div className="pb-4">
              <h1 className="text-3xl font-bold">{selectedTab?.label}</h1>
            </div>
            {activePanel?.map((item) => (
              <SettingsModal.Item key={item.key} item={item} />
            ))}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface SidebarProps {
  selected: SettingsType | null;
  handleSelect: (id: SettingsType, settings_list: SettingItemType[]) => void;
}

SettingsModal.Sidebar = ({ selected, handleSelect }: SidebarProps) => {
  return (
    <div className="h-full min-w-52 flex flex-col rounded-md pt-6">
      <div className="flex-1">
        {settings_list.map((setting) => {
          const Icon = setting.icon;
          return (
            <div
              onClick={() => handleSelect(setting, setting.settings_list ?? [])}
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
  );
};

interface ItemProps {
  item: SettingItemType;
}

SettingsModal.Item = ({ item }: ItemProps) => {
  const { settings, updateSetting } = useSettings();
  const currentValue = settings[item.key as keyof typeof settings];

  const handleChange = (value: boolean | string | number) => {
    updateSetting(item.key as keyof typeof settings, value);
  };

  const ItemAction = () => {
    switch (item.type) {
      case "switch":
        return (
          <Switch
            checked={Boolean(currentValue)}
            onCheckedChange={handleChange}
          />
        );
      default:
        return <></>;
    }
  };

  return (
    <div className="flex flex-col gap-y-0.5">
      <h1 className="text-lg font-semibold">{item.title}</h1>
      <p className="text-sm text-muted-foreground/50">{item.description}</p>
      <div className="mt-4 flex items-center px-0.5">
        <ItemAction />
      </div>
    </div>
  );
};

export default SettingsModal;
