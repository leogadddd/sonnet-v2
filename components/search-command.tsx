import * as React from "react";
import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { CommandDialog, CommandEmpty } from "./ui/command";
import { useSearchCommand } from "@/lib/store/use-search-command";
import { useSettings } from "@/lib/store/use-settings";
import Blog from "@/lib/system/localdb/blog";
import { AllBlogs } from "@/lib/system/localdb/client";
import { shortcutManager } from "@/lib/system/shortcut-manager";
import { TimeFormatter, cn } from "@/lib/utils";
import { CommandInput, CommandItem, CommandList, CommandSeparator } from "cmdk";
import { FileIcon, LucideIcon, Search, Settings } from "lucide-react";

export interface CommandOption {
  id: string;
  label: string;
  shortcut?: string;
  icon?: LucideIcon;
  action: () => void;
}

const SearchCommand = () => {
  const { onOpen: onOpenSettings } = useSettings();
  const router = useRouter();
  const { modal_state, onClose, toggle } = useSearchCommand();
  const blogs = AllBlogs() || [];
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedRef = useRef<HTMLDivElement | null>(null);
  const processingSelectionRef = useRef(false);

  // Command options
  const commands: CommandOption[] = [
    {
      id: "settings",
      label: "Settings",
      shortcut: "⌘+,",
      icon: Settings,
      action: onOpenSettings,
    },
  ];

  // Filter items based on search input
  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredCommands = commands.filter((command) =>
    command.label.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredItems: (Blog | CommandOption)[] = [
    ...filteredBlogs,
    ...filteredCommands,
  ];

  // Reset selection when filter changes
  useEffect(() => {
    if (filteredItems.length > 0) {
      setSelectedIndex(0);
    }
  }, [search, filteredItems.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      toggle();
    };
    const shortcut = shortcutManager.registerShortcut(handler).ctrl().key("l");
    return () => shortcutManager.unregisterShortcut(shortcut, handler);
  }, [toggle]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modal_state || filteredItems.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev + 1) % filteredItems.length;
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev - 1 + filteredItems.length) % filteredItems.length;
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSelectItem(selectedIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal_state, filteredItems, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  const handleItemMouseEnter = (index: number) => {
    setSelectedIndex(index);
  };

  const handleSelectItem = (index: number) => {
    if (processingSelectionRef.current) return;

    if (index >= 0 && index < filteredItems.length) {
      processingSelectionRef.current = true;

      try {
        const selectedItem = filteredItems[index];

        if ("blog_id" in selectedItem) {
          router.push(`/app/${selectedItem.blog_id}`);
        } else {
          selectedItem.action();
        }

        setSearch("");
        setSelectedIndex(0);
        onClose();
      } finally {
        // Reset after a short delay to prevent multiple executions
        setTimeout(() => {
          processingSelectionRef.current = false;
        }, 100);
      }
    }
  };

  return (
    <CommandDialog open={modal_state} onOpenChange={onClose}>
      <div className="flex items-center px-1 border-b">
        <Search className="h-4 w-4 mx-2 mr-1 text-muted-foreground" />
        <CommandInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search blogs or run a command..."
          className="w-full text-sm p-2 border-none focus:outline-none"
          autoFocus
        />
      </div>
      <CommandList className="mt-2 max-h-60 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <CommandEmpty>
            <div>
              <h1 className="text-muted-foreground">No Results Found</h1>
            </div>
          </CommandEmpty>
        ) : (
          <>
            {filteredCommands.length > 0 && (
              <>
                <h2 className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  Commands
                </h2>
                {filteredCommands.map((command, index) => {
                  const absoluteIndex = filteredBlogs.length + index;
                  const Icon = command?.icon;
                  return (
                    <CommandItem
                      key={command.id}
                      ref={absoluteIndex === selectedIndex ? selectedRef : null}
                      onMouseEnter={() => handleItemMouseEnter(absoluteIndex)}
                      onSelect={() => handleSelectItem(selectedIndex)}
                      className={cn("cursor-pointer p-0 hover:bg-primary/10", {
                        "bg-primary/10": absoluteIndex === selectedIndex,
                      })}
                    >
                      <div className="flex items-center gap-x-2 text-sm">
                        <div>
                          {Icon && (
                            <Icon className={cn("shrink-0 h-[18px] mr-1")} />
                          )}
                        </div>
                        <div className="w-full truncate">{command?.label}</div>
                        <div className="w-max">
                          {command.shortcut && (
                            <div>
                              <div className="bg-secondary/60 ring ring-secondary/70 px-1.5 py-0.5 rounded-sm text-muted-foreground/90 flex items-center ">
                                <p className="text-xs">{command.shortcut}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </>
            )}

            {filteredBlogs.length > 0 && filteredCommands.length > 0 && (
              <CommandSeparator className="my-2" />
            )}

            {filteredBlogs.length > 0 && (
              <>
                <h2 className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  Blogs
                </h2>
                {filteredBlogs.map((blog, index) => (
                  <CommandItem
                    key={blog.blog_id}
                    ref={index === selectedIndex ? selectedRef : null}
                    onSelect={() => handleSelectItem(selectedIndex)}
                    onMouseEnter={() => handleItemMouseEnter(index)}
                    className={cn("cursor-pointer hover:bg-primary/10", {
                      "bg-primary/10": index === selectedIndex,
                    })}
                  >
                    <div className="flex items-center gap-x-2 text-sm">
                      <div>
                        {blog?.icon ? (
                          <div className={`shrink-0 text-[18px]`}>
                            {blog?.icon}
                          </div>
                        ) : (
                          <FileIcon className={cn("shrink-0 h-[18px] mr-1")} />
                        )}
                      </div>
                      <div className="w-full truncate">{blog?.title}</div>
                      <div className="w-max">
                        <h1 className="text-muted-foreground/50 text-xs w-max">
                          {TimeFormatter.timeAgo(blog?.updated_at)}
                        </h1>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default SearchCommand;
