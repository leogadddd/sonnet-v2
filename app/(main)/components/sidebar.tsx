"use client";

import React, {
  ComponentRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useParams, usePathname, useRouter } from "next/navigation";

import ContextMenu from "./context-menu";
import TopBar from "./topbar";
import Logo from "@/components/logo-sidebar";
import AppUser from "@/components/user/app-user";
import { useSearchCommand } from "@/lib/store/use-search-command";
import { useTrashbox } from "@/lib/store/use-trash-box";
import dbClient, { SidebarBlogs } from "@/lib/system/localdb/client";
import { shortcutManager } from "@/lib/system/shortcut-manager";
import { cn } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  FileIcon,
  Home,
  LucideIcon,
  PanelRight,
  Plus,
  Search,
  Telescope,
  Trash,
} from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { useMediaQuery } from "usehooks-ts";

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { onOpen: onOpenTrashBox } = useTrashbox();
  const { onOpen: onOpenSearchCommand } = useSearchCommand();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const sidebarRef = useRef<ComponentRef<"aside">>(null);
  const navbarRef = useRef<ComponentRef<"div">>(null);
  const isResizingRef = useRef(false);

  const [isResetting, setIsResetting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(isMobile);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isResizingRef.current) return;
    let newWidth = event.clientX;

    if (newWidth < 240) newWidth = 240;
    if (newWidth > 480) newWidth = 480;

    if (sidebarRef.current && navbarRef.current) {
      sidebarRef.current.style.width = `${newWidth}px`;
      navbarRef.current.style.setProperty("left", `${newWidth}px`);
      navbarRef.current.style.setProperty(
        "width",
        `calc(100% - ${newWidth}px)`,
      );
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();
      event.stopPropagation();
      isResizingRef.current = true;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp],
  );

  const resetWidth = useCallback(() => {
    if (sidebarRef.current && navbarRef.current) {
      setIsCollapsed(false);
      setIsResetting(true);

      sidebarRef.current.style.width = isMobile ? "100%" : "240px";
      navbarRef.current.style.setProperty(
        "width",
        isMobile ? "0" : "calc(100% - 240px)",
      );
      navbarRef.current.style.setProperty("left", isMobile ? "100%" : "240px");

      setTimeout(() => setIsResetting(false), 300);
    }
  }, [isMobile]);

  const collapse = useCallback(() => {
    if (sidebarRef.current && navbarRef.current) {
      setIsCollapsed(true);
      setIsResetting(true);

      sidebarRef.current.style.width = "0";
      navbarRef.current.style.setProperty("width", "100%");
      navbarRef.current.style.setProperty("left", "0");

      setTimeout(() => setIsResetting(false), 300);
    }
  }, []);

  useEffect(() => {
    if (isMobile) collapse();
    else resetWidth();
  }, [isMobile, collapse, resetWidth]);

  useEffect(() => {
    if (isMobile) collapse();
  }, [pathname, isMobile, collapse]);

  useEffect(() => {
    const handleToggleSidebar = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isCollapsed) resetWidth();
      else collapse();
    };

    const shortcut = shortcutManager
      .registerShortcut(handleToggleSidebar)
      .ctrl()
      .key("b");

    return () =>
      shortcutManager.unregisterShortcut(shortcut, handleToggleSidebar);
  }, []);

  const sidebarButtons = useMemo(
    () => (
      <>
        <Sidebar.Button
          label="Home"
          icon={Home}
          onClick={() => router.push("/app")}
        />
        <Sidebar.Button
          label="Explore"
          icon={Telescope}
          onClick={() => router.push("/explore")}
        />
        <Sidebar.Button
          label="Search"
          icon={Search}
          onClick={onOpenSearchCommand}
        />
        <Sidebar.Button label="Trash" icon={Trash} onClick={onOpenTrashBox} />
      </>
    ),
    [router, onOpenSearchCommand, onOpenTrashBox],
  );

  const sidebarWorkspaces = useMemo(
    () => (
      <>
        <Sidebar.Workspace label="Pinned" pins />
        <Sidebar.Workspace label="Blogs" />
      </>
    ),
    [],
  );

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          "group/sidebar border-r-primary/10 relative z-[50] flex h-full w-60 flex-col overflow-y-auto border-r",
          isResetting && "transition-all ease-in-out duration-300",
          isMobile && "w-0",
        )}
      >
        <div className="flex flex-col justify-between h-full">
          <div className="ml-5 my-2">
            <Logo />
          </div>
          <div>{sidebarButtons}</div>
          <div className="flex-1">{sidebarWorkspaces}</div>
          <div>
            <AppUser />
          </div>
        </div>
        <div
          onMouseDown={handleMouseDown}
          className="opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-1 transition cursor-ew-resize absolute h-full bg-primary/10 right-0 top-0"
        />
        {isMobile && (
          <div
            role="button"
            onClick={collapse}
            className="cursor-pointer group/closesidebar transition-opacity opacity-0 group-hover/sidebar:opacity-100 absolute top-4 right-4 text-primary/50 flex items-center justify-center"
          >
            <div className="group-hover/closesidebar:bg-foreground/15 rounded-sm flex items-center justify-center">
              <ChevronLeft className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        )}
      </aside>
      <div
        ref={navbarRef}
        className={cn(
          "min-h-[48px] absolute top-0 z-[50] left-60 w-[calc(100%-240px)] flex items-center dark:bg-[#141414]",
          isResetting && "transition-all ease-in-out duration-300",
          isMobile && "left-0 w-full",
        )}
      >
        <div className="relative h-full min-h-[40px] flex items-center mr-4">
          <nav className="bg-transparent p-3">
            {!isCollapsed ? (
              <div
                role="button"
                onClick={collapse}
                className="hover:bg-foreground/15 rounded-sm"
              >
                <ChevronLeft className="h-6 w-6 text-muted-foreground" />
              </div>
            ) : (
              <div
                role="button"
                onClick={resetWidth}
                className="hover:bg-foreground/15 rounded-sm p-0.5"
              >
                <PanelRight className="h-5 w-5 text-muted-foreground rotate-180" />
              </div>
            )}
          </nav>
        </div>
        <TopBar />
      </div>
    </>
  );
};

interface ButtonProps {
  label: string;
  subLabel?: string;
  icon: LucideIcon;
  isMobile?: boolean;
  onClick?: () => void;
}

const Button = ({ label, subLabel, icon: Icon, onClick }: ButtonProps) => {
  return (
    <div
      role="button"
      onClick={onClick}
      className="group min-h-[30px] text-sm w-full hover:bg-primary/10 flex items-center font-medium px-6 dark:text-muted-foreground/95 text-foreground/80 cursor-pointer"
    >
      <Icon className={`shrink-0 h-[18px] mr-2`} />
      <span className="truncate">
        {label} <span>{subLabel}</span>
      </span>
    </div>
  );
};

interface WorkspaceProps {
  label?: string;
  pins?: boolean;
}

const Workspace = ({ label, pins = false }: WorkspaceProps) => {
  const router = useRouter();
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const createNewBlog = async () => {
    await dbClient
      .createBlog({
        title: "New Blog",
      })
      .then(({ id }: { id: string | null }) => {
        router.push(`/app/${id}`);
      });
  };

  return (
    <>
      {label && (
        <div
          className={cn(
            "group/workspace pl-7 mt-4 flex gap-x-2 items-center justify-between min-h-[25px] dark:text-muted-foreground/95 text-foreground/80",
            pins && isEmpty && "hidden",
          )}
        >
          <span className="cursor-pointer text-xs font-medium flex-1">
            {label}
          </span>
          <button
            onClick={createNewBlog}
            className="group/plus cursor-pointer px-2 mr-1 h-[25px] opacity-0 group-hover/workspace:opacity-100 transition-opacity duration-300"
          >
            <div className="group-hover/plus:bg-foreground/15 rounded-sm">
              <Plus className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}
      <Sidebar.WorkspaceList pins={pins} setIsEmpty={setIsEmpty} />
      {!pins && <div />}
    </>
  );
};

interface WorkspaceListProps {
  parent_blog?: string;
  level?: number;
  pins?: boolean;
  setIsEmpty?: (value: boolean) => void;
}

const List = ({
  parent_blog,
  level = 0,
  pins = false,
  setIsEmpty,
}: WorkspaceListProps) => {
  const router = useRouter();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const blogs = SidebarBlogs(parent_blog, pins) || [];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const onExpand = useCallback((blog_id: string) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [blog_id]: !prevExpanded[blog_id],
    }));
  }, []);

  const onRedirect = useCallback(
    (blog_id: string) => {
      router.push(`/app/${blog_id}`);
    },
    [router],
  );

  useEffect(() => {
    setIsEmpty?.(blogs.length === 0);
  }, [blogs, setIsEmpty]);

  if (!blogs) return null;

  return (
    <>
      <p
        style={{
          paddingLeft: level ? `${level * 6 + 6}px` : "12px",
        }}
        className={cn(
          "hidden text-xs dark:text-muted-foreground/50 text-muted-foreground ml-4 py-1 truncate w-full",
          expanded && "last:block",
          level === 0 && "hidden",
        )}
      >
        No Pages inside
      </p>
      {blogs.map((blog) => (
        <div key={blog.blog_id}>
          <Sidebar.BlogItem
            id={blog.blog_id}
            level={level}
            onClick={() => onRedirect(blog.blog_id)}
            onExpand={() => onExpand(blog.blog_id)}
            expanded={expanded[blog.blog_id]}
          />
          {expanded[blog.blog_id] && (
            <Sidebar.WorkspaceList
              parent_blog={blog.blog_id}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </>
  );
};

interface WorkspaceItemProps {
  id: string;
  level: number;
  onClick: () => void;
  onExpand: () => void;
  expanded: boolean;
}

const Item = ({
  id,
  level,
  expanded,
  onClick,
  onExpand,
}: WorkspaceItemProps) => {
  const router = useRouter();
  const params = useParams();
  const blog = useLiveQuery(async () => await dbClient.getBlogById(id), [id]);

  const inputRef = useRef<ComponentRef<"textarea">>(null);
  const [value, setValue] = useState<string | null>(blog?.title ?? null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const enableInput = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
    setValue(blog!.title);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const disableInput = async () => {
    setIsEditing(false);
    if (!value || value === "") {
      const title = blog?.parent_blog === "" ? "New Blog" : "New Page";
      setValue(title);
      await blog?.updateTitle(title);
    }
  };

  const onInput = async (value: string) => {
    setValue(value);
    await blog?.updateTitle(value);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      disableInput();
    }
  };

  const createNewPage = async () => {
    await blog
      ?.createNewPage({ title: "New Page" })
      .then(({ id }: { id: string | null }) => {
        router.push(`/app/${id}`);
      });
    if (!expanded) onExpand();
  };

  const isActive = params?.blog_id === blog?.blog_id;

  if (!blog) return <></>;

  return (
    <div
      className={cn(
        "group/blogItem group min-h-[30px] text-sm w-full hover:bg-primary/10 flex items-center dark:text-muted-foreground/95 text-foreground/80 cursor-pointer",
        isActive && "bg-primary/15 hover:bg-primary/15",
      )}
      style={{
        paddingLeft: level ? `${level * 7 + 7}px` : "7px",
      }}
    >
      <div
        role="button"
        onClick={onExpand}
        className={cn(
          "group/expand",
          !expanded &&
            "opacity-0 group-hover/blogItem:opacity-100 transition-opacity",
        )}
      >
        <div className="group-hover/expand:bg-foreground/15 rounded-sm">
          {!expanded ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>
      {blog?.icon ? (
        <div className={`shrink-0 mr-2 text-[18px]`}>{blog?.icon}</div>
      ) : (
        <FileIcon
          className={cn(
            "shrink-0 h-[18px] mr-2",
            isActive && "text-foreground",
          )}
        />
      )}
      <div
        onClick={onClick}
        className={cn(
          "font-normal w-full truncate h-full min-h-[30px] flex items-center",
          isActive && "font-semibold text-foreground",
        )}
      >
        {isEditing ? (
          <TextareaAutosize
            ref={inputRef}
            placeholder={blog?.parent_blog === "" ? "New Blog" : "New Page"}
            onKeyDown={onKeyDown}
            onBlur={disableInput}
            value={value!}
            maxRows={1}
            onChange={(e) => onInput(e.target.value)}
            className="bg-transparent break-words outline-none resize-none"
          />
        ) : (
          <div className="w-full truncate" onDoubleClick={enableInput}>
            {blog?.title}
          </div>
        )}
      </div>
      <div className="flex items-center mr-2 gap-x-1 opacity-0 group-hover/blogItem:opacity-100 transition-opacity">
        <ContextMenu
          opt={[{ title: "Blog Actions", opt: [...blog?.actions] }]}
          side="right"
          sideOffset={35}
        >
          <div className="group/blogContextMenu">
            <div className="group-hover/blogContextMenu:bg-foreground/15 rounded-sm">
              <EllipsisVertical className="h-4 w-4" />
            </div>
          </div>
        </ContextMenu>
        <div
          role="button"
          onClick={createNewPage}
          className="group/addPageButton"
        >
          <div className="group-hover/addPageButton:bg-foreground/15 rounded-sm">
            <Plus className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

Sidebar.Button = Button;
Sidebar.Workspace = Workspace;
Sidebar.WorkspaceList = List;
Sidebar.BlogItem = Item;

export default Sidebar;
