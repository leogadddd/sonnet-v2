import React, { Dispatch, useEffect, useMemo, useState } from "react";

import Image from "next/image";
import { useParams } from "next/navigation";

import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Spinner } from "../ui/spinner";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import ConfirmModal from "./confirm-modal";
import { useCoverImage } from "@/lib/store/use-cover-image";
import { usePublish } from "@/lib/store/use-publish";
import { useUser } from "@/lib/store/use-user";
import { useSupabase } from "@/lib/supabase/supabase-client";
import Blog from "@/lib/system/localdb/blog";
import dbClient from "@/lib/system/localdb/client";
import { shortcutManager } from "@/lib/system/shortcut-manager";
import { SyncManager } from "@/lib/system/sync-manager";
import { cn, toSlug } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
import { ImageIcon, Plus, RefreshCw, X } from "lucide-react";

const PublishModal = () => {
  const { user } = useUser();
  const supabase = useSupabase();
  const params = useParams();
  const { modal_state, blog_id, onClose, toggle } = usePublish();

  const [category, setCategory] = useState<Category | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);

  const blog = useLiveQuery(async () => {
    const _blog_id = blog_id || (params?.blog_id as string);
    return await dbClient.getBlogById(_blog_id);
  }, [blog_id, params?.blog_id]);

  const fetchBlogDetails = async () => {
    if (!blog) return;

    const { data: category } = await supabase
      .from("blog_categories")
      .select("*")
      .eq("blog_id", blog?.blog_id)
      .maybeSingle();

    const { data: tags } = await supabase
      .from("blog_tags")
      .select("*")
      .eq("blog_id", blog?.blog_id);

    const { data: keywords } = await supabase
      .from("blog_keywords")
      .select("*")
      .eq("blog_id", blog?.blog_id);

    if (category) setCategory(category);
    if (tags) setTags(tags);
    if (keywords) setKeywords(keywords);
  };

  const saveBlogDetails = async () => {
    if (!blog) return;

    // --- CATEGORY HANDLING ---
    const { data: existingCategory } = await supabase
      .from("blog_categories")
      .select("category_id")
      .eq("blog_id", blog.blog_id)
      .maybeSingle();

    if (existingCategory) {
      // Update the existing category
      await supabase
        .from("blog_categories")
        .update({ category_id: category?.id })
        .eq("id", existingCategory?.category_id);
    } else {
      // Insert new category
      await supabase.from("blog_categories").insert({
        blog_id: blog.blog_id,
        category_id: category?.id,
      });
    }

    // --- TAGS HANDLING ---
    const { data: existingTags } = await supabase
      .from("blog_tags")
      .select("tag_id")
      .eq("blog_id", blog.blog_id);

    const existingTagIds = existingTags?.map((tag) => tag.tag_id) || [];
    const newTagIds = tags?.map((tag) => tag.id) || [];

    const tagsToAdd = newTagIds.filter((id) => !existingTagIds.includes(id));
    const tagsToRemove = existingTagIds.filter((id) => !newTagIds.includes(id));

    if (tagsToAdd.length) {
      await supabase.from("blog_tags").insert(
        tagsToAdd.map((tag_id) => ({
          blog_id: blog.blog_id,
          tag_id,
        })),
      );
    }

    if (tagsToRemove.length) {
      await supabase
        .from("blog_tags")
        .delete()
        .eq("blog_id", blog.blog_id)
        .in("tag_id", tagsToRemove);
    }

    // --- KEYWORDS HANDLING ---
    const { data: existingKeywords } = await supabase
      .from("blog_keywords")
      .select("keyword_id")
      .eq("blog_id", blog.blog_id);

    const existingKeywordIds = existingKeywords?.map((k) => k.keyword_id) || [];
    const newKeywordIds = keywords?.map((k) => k.id) || [];

    const keywordsToAdd = newKeywordIds.filter(
      (id) => !existingKeywordIds.includes(id),
    );
    const keywordsToRemove = existingKeywordIds.filter(
      (id) => !newKeywordIds.includes(id),
    );

    if (keywordsToAdd.length) {
      await supabase.from("blog_keywords").insert(
        keywordsToAdd.map((keyword_id) => ({
          blog_id: blog.blog_id,
          keyword_id,
        })),
      );
    }

    if (keywordsToRemove.length) {
      await supabase
        .from("blog_keywords")
        .delete()
        .eq("blog_id", blog.blog_id)
        .in("keyword_id", keywordsToRemove);
    }
  };

  const removeBlogInCategory = async () => {
    if (!user) return;

    await supabase
      .from("blog_categories")
      .delete()
      .eq("blog_id", blog?.blog_id);
  };

  const publish = async () => {
    if (!user) return;
    const syncManager = new SyncManager(user);
    if (blog?.synced_at === 0) await syncManager.sync();
    await saveBlogDetails();
    await blog?.publish();
    await syncManager.sync();
  };

  const unpublish = async () => {
    if (!user) return;
    await blog?.unpublish();
    await removeBlogInCategory();
    const syncManager = new SyncManager(user);
    await syncManager.sync();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      toggle();
    };

    const shortcut = shortcutManager.registerShortcut(handler).ctrl().key("p");

    return () => shortcutManager.unregisterShortcut(shortcut, handler);
  }, []);

  useEffect(() => {
    fetchBlogDetails();
  }, []);

  return (
    <Dialog open={modal_state} onOpenChange={onClose}>
      <DialogContent className="p-0 px-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Publish</DialogTitle>
        </DialogHeader>
        <div className="h-full pb-2 px-4 max-h-[50vh] overflow-y-auto">
          {blog === null && (
            <div>
              <h1>No Blog Selected. Please Refresh this page.</h1>
            </div>
          )}
          {blog && (
            <div className="flex flex-col gap-y-2">
              <div className="flex flex-col gap-y-2 h-full">
                <div className="my-2">
                  <p className="text-sm text-muted-foreground">
                    Track engagement, update metadata, and control visibility.
                  </p>
                </div>
              </div>
              <PublishModal.Analytics blog={blog} />
              <PublishModal.Information blog={blog} />
              <PublishModal.Category
                blog={blog}
                value={category}
                onChange={setCategory}
              />
              <PublishModal.Tags blog={blog} value={tags} onChange={setTags} />
              <PublishModal.Keywords
                blog={blog}
                value={keywords}
                onChange={setKeywords}
              />
              <PublishModal.Settings blog={blog} />
              <PublishModal.Buttons
                blog={blog}
                Publish={publish}
                Unpublish={unpublish}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ButtonsProps {
  blog: Blog;
  Publish: () => void;
  Unpublish: () => void;
}

const Buttons = ({ blog, Publish, Unpublish }: ButtonsProps) => {
  return (
    <div className="mt-6 mb-2 flex items-center justify-end">
      {blog.is_published === 0 ? (
        <ConfirmModal
          onConfirm={Publish}
          title={`Publish "${blog?.title}"?`}
          subText="Once you published this blog. You need to unpublish to edit it again."
          confirmText="Publish"
          cancelText="Cancel"
        >
          <Button>Publish</Button>
        </ConfirmModal>
      ) : (
        <ConfirmModal
          onConfirm={Unpublish}
          title={`Unpublish "${blog?.title}"?`}
          subText=""
          confirmText="Unpublish"
          cancelText="Cancel"
        >
          <Button>Unpublish</Button>
        </ConfirmModal>
      )}
    </div>
  );
};

interface SettingsProps {
  blog: Blog;
}

const Settings = ({ blog }: SettingsProps) => {
  const [isShowOnExplore, setIsShowOnExplore] = useState<boolean>(
    blog?.is_on_explore === 1 ? true : false,
  );

  const onCheckChange = async (checked: boolean) => {
    setIsShowOnExplore(checked);
    await blog?.updateShowOnExplore(checked);
  };

  return (
    <div className="mt-6 flex flex-col gap-y-2">
      <div className="flex gap-x-2 items-center justify-between">
        <h1 className="text-sm font-bold w-32">Show on Explore</h1>
        <div>
          <Switch
            defaultChecked={isShowOnExplore}
            onCheckedChange={(checked: boolean) => onCheckChange(checked)}
            disabled={blog?.is_published === 1}
          />
        </div>
      </div>
    </div>
  );
};

interface InformationProps {
  blog: Blog;
}

const Information = ({ blog }: InformationProps) => {
  const { onOpen } = useCoverImage();
  const { user } = useUser();
  const [title, setTitle] = useState<string>(blog.title);
  const [description, setDescription] = useState<string>(blog.description);
  const [slug, setSlug] = useState<string>(blog.slug);

  const onTitleChange = async (_title: string) => {
    setTitle(_title);
    const title = _title
      ? _title
      : blog?.parent_blog === ""
        ? "New Blog"
        : "New Page";
    await blog?.updateTitle(title);
  };

  const onTitleDisable = () => {
    if (title === "") setTitle(blog?.title);
  };

  const onDescriptionChange = async (description: string) => {
    setDescription(description);
    await blog?.updateDescription(description);
  };

  const onSlugChange = async (_slug: string) => {
    setSlug(toSlug(_slug));
    const slug = _slug ? _slug : blog.blog_id;
    await blog?.updateSlug(toSlug(slug));
  };

  const onSlugDisable = () => {
    if (slug === "") setSlug(blog.blog_id);
  };

  return (
    <div className="mt-6 flex flex-col gap-y-2">
      <div className="flex gap-x-2 items-center">
        <h1 className="text-sm font-bold w-24">Title:</h1>
        <Input
          value={title}
          placeholder={blog?.parent_blog === "" ? "New Blog" : "New Page"}
          onChange={(e) => onTitleChange(e.target.value)}
          className="flex-1 font-semibold"
          onBlur={onTitleDisable}
          disabled={blog?.is_published === 1}
        />
      </div>
      <div className="flex gap-x-2 items-center">
        <h1 className="text-sm font-bold w-24">Slug:</h1>
        <Input
          value={slug}
          placeholder={blog.blog_id}
          onChange={(e) => onSlugChange(e.target.value)}
          className="flex-1 font-semibold"
          onBlur={onSlugDisable}
          disabled={
            user?.plan.currentPlan === "Free" || blog?.is_published === 1
          }
        />
      </div>
      <div className="flex gap-x-2 items-start">
        <h1 className="text-sm font-bold w-24">Description:</h1>
        <Textarea
          value={description}
          placeholder="add a description..."
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="flex-1 min-h-24 max-h-32 disabled:cursor-default"
          disabled={blog?.is_published === 1}
        />
      </div>
      <div className="flex gap-x-2 items-center">
        <h1 className="text-sm font-bold w-24">Cover:</h1>
        {!blog.cover_image && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpen}
              disabled={blog?.is_published === 1}
            >
              <ImageIcon className="mr-2" />
              Upload Cover
            </Button>
          </div>
        )}
        {blog.cover_image && (
          <div className="flex gap-x-2">
            <div
              className={cn(
                "relative overflow-hidden w-24 h-8 rounded-lg border border-accent-foreground/25",
                blog?.is_published === 1 && "border-accent-foreground/10",
              )}
            >
              <Image
                src={blog.cover_image.image_url}
                alt={`${blog.title}-blog-cover`}
                width={132} // Adjust as needed
                height={100} // Adjust as needed
                className={cn(
                  "object-cover w-full h-full",
                  blog?.is_published === 1 && "opacity-50",
                )}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpen}
              disabled={blog?.is_published === 1}
            >
              <ImageIcon className="mr-2" />
              Change Cover
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

interface AnalyticsProps {
  blog: Blog;
}

const Analytics = ({ blog }: AnalyticsProps) => {
  return (
    <div className="h-24 border rounded-xl">
      <div className="p-3 h-full flex flex-col">
        <div className="flex-1 flex items-start justify-between">
          <h1 className="flex gap-x-2 items-end text-muted-foreground">
            <span className="text-3xl/7 font-semibold text-[#ff914d]">
              {blog.views}
            </span>{" "}
            <span>Page Views</span>
          </h1>
          <div>
            <Button variant="outline" size="sm">
              <RefreshCw />
              Refresh
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <h3 className="flex gap-x-2 items-end">
            <span className="text-xl/5 font-semibold text-[#ff914d]">
              {blog.likes}
            </span>
            <span>likes</span>
          </h3>
          <h3 className="flex gap-x-2 items-end">
            <span className="text-xl/5 font-semibold text-[#ff914d]">
              {blog.comments}
            </span>
            <span>comments</span>
          </h3>
          <h3 className="flex gap-x-2 items-end">
            <span className="text-xl/5 font-semibold text-[#ff914d]">
              {blog.shares}
            </span>
            <span>shares</span>
          </h3>
        </div>
      </div>
    </div>
  );
};

export type Category = {
  id: string;
  name: string;
  created_by: string;
  created_at: number;
  updated_at: number;
};

interface CategoryProps {
  blog: Blog;
  value: Category | null;
  onChange: Dispatch<Category | null>;
}

const Category = ({ blog, value, onChange }: CategoryProps) => {
  const { user } = useUser();
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    [],
  );

  const fetchAvailalbeCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }

    return data;
  };

  const addAvailableCategory = async (name: string) => {
    if (!user) return;
    setIsLoading(true);
    setIsAdding(true);
    const { error } = await supabase.from("categories").insert({
      name,
      created_by: user.id,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    if (error) {
      console.error(error);
      return;
    }
    const data = await fetchAvailalbeCategories();
    setAvailableCategories(data);
    setIsLoading(false);
    setIsAdding(false);
  };

  const selectCategory = async (category: Category) => {
    onChange(category);
    await blog?.updateCategory(category.id);
    setInputValue("");
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      const data = await fetchAvailalbeCategories();

      if (value === null) {
        let categories = data as Category[];
        let _defaultValue = categories.filter(
          (category) => category.id == "12a3368a-1960-465e-9de0-22ecbb1703c2",
        );
        onChange(_defaultValue[0]);
      }

      setAvailableCategories(data);
      setIsLoading(false);
    };

    fetchCategories();
  }, []);

  const memoizedCategories = useMemo(
    () => availableCategories,
    [availableCategories],
  );

  return (
    <div className="mt-6 w-full">
      <div className="flex gap-x-2 items-center">
        <h1 className="text-sm font-bold w-24">Category:</h1>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              role="combobox"
              aria-expanded={open}
              className="flex-1"
              disabled={blog?.is_published === 1}
            >
              {value ? (
                <div>{value.name}</div>
              ) : (
                <>
                  <Plus />
                  Select Category
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" side="bottom" align="start">
            <Command>
              <CommandInput
                placeholder="Search category or add one...."
                value={inputValue}
                onValueChange={setInputValue}
              />
              <CommandList className="p-0">
                {!isLoading && (
                  <CommandEmpty className="h-24 flex items-center justify-center">
                    <h1 className="text-center text-muted-foreground text-xs break-words">
                      No categories found. <br />
                      Add a category by searching it
                    </h1>
                  </CommandEmpty>
                )}
                <CommandGroup>
                  {isLoading && (
                    <div className="h-24 flex flex-col gap-y-2 items-center justify-center">
                      <Spinner />
                      {isAdding && (
                        <h1 className="text-sm text-muted-foreground">
                          Adding...
                        </h1>
                      )}
                    </div>
                  )}
                  {!isLoading &&
                    memoizedCategories.map((category) => (
                      <CommandItem
                        disabled={value?.id === category.id}
                        key={category.id}
                        value={`${category.name}-${category.id}`}
                        onSelect={() => {
                          selectCategory(category);
                          setOpen(false);
                        }}
                      >
                        {category.name}
                      </CommandItem>
                    ))}
                  {!isLoading &&
                    inputValue &&
                    !memoizedCategories.some((k) => k.name === inputValue) && (
                      <CommandItem
                        onSelect={() => {
                          addAvailableCategory(inputValue);
                          setInputValue("");
                        }}
                      >
                        Add "{inputValue}"
                      </CommandItem>
                    )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

interface TagsProps {
  blog: Blog;
  value: Tag[];
  onChange: Dispatch<Tag[]>;
}

export type Tag = {
  id: string;
  name: string;
  created_by: string;
  created_at: number;
  updated_at: number;
};

const Tags = ({ blog, value, onChange }: TagsProps) => {
  const { user } = useUser();
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  const fetchAvailableTags = async () => {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }

    return data;
  };

  const addAvailableTag = async (name: string) => {
    if (!user) return;
    setIsLoading(true);
    setIsAdding(true);
    const { error } = await supabase.from("tags").insert({
      name,
      created_by: user.id,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    if (error) {
      console.error(error);
      return;
    }
    const data = await fetchAvailableTags();
    setAvailableTags(data);
    setIsLoading(false);
    setIsAdding(false);
  };

  const addTag = (tag: Tag) => {
    if (value.includes(tag)) return; // Prevent empty & duplicate tags
    onChange([...value, tag]);
    setInputValue("");
  };

  const removeKeyword = (tagIdToRemove: string) => {
    onChange(value.filter((tag) => tag.id !== tagIdToRemove));
  };

  const onClickHandler = (e: React.MouseEvent<HTMLDivElement>) => {
    const button = (e.target as HTMLElement).closest("[data-tag]");
    if (!button) return;

    const tagToRemove = button.getAttribute("data-tag");
    if (tagToRemove) {
      removeKeyword(tagToRemove);
    }
  };

  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      const data = await fetchAvailableTags();
      setAvailableTags(data);
      setIsLoading(false);
    };

    fetchTags();
  }, []);

  const memoizedTags = useMemo(() => availableTags, [availableTags]);

  return (
    <div className="w-full">
      <div className="flex gap-x-2 items-center">
        <h1 className="text-sm font-bold w-24">Tags:</h1>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              role="combobox"
              aria-expanded={open}
              className="flex-1"
              disabled={blog?.is_published === 1}
            >
              <Plus />
              Select Tags
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" side="bottom" align="start">
            <Command>
              <CommandInput
                placeholder="Search tags or add one...."
                value={inputValue}
                onValueChange={setInputValue}
              />
              <CommandList className="p-0">
                {!isLoading && (
                  <CommandEmpty className="h-24 flex items-center justify-center">
                    <h1 className="text-center text-muted-foreground text-xs break-words">
                      No tags Found. <br />
                      Add a tags by Searching it
                    </h1>
                  </CommandEmpty>
                )}
                <CommandGroup>
                  {isLoading && (
                    <div className="h-24 flex flex-col gap-y-2 items-center justify-center">
                      <Spinner />
                      {isAdding && (
                        <h1 className="text-sm text-muted-foreground">
                          Adding...
                        </h1>
                      )}
                    </div>
                  )}
                  {!isLoading &&
                    memoizedTags.map((tag) => (
                      <CommandItem
                        disabled={value.some((k) => k.id === tag.id)}
                        key={tag.id}
                        value={`${tag.name}-${tag.id}`}
                        onSelect={() => {
                          addTag(tag);
                          setOpen(false);
                        }}
                      >
                        {tag.name}
                      </CommandItem>
                    ))}
                  {!isLoading &&
                    inputValue &&
                    !memoizedTags.some((k) => k.name === inputValue) && (
                      <CommandItem
                        onSelect={() => {
                          addAvailableTag(inputValue);
                          setInputValue("");
                        }}
                      >
                        Add "{inputValue}"
                      </CommandItem>
                    )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {value.length !== 0 && (
        <div
          className="flex gap-x-1 gap-y-1 items-center flex-wrap py-2 min-h-11.5"
          onClick={onClickHandler}
        >
          {value.map((tag) => (
            <div
              key={tag.id}
              className="p-1 px-3 font-medium text-sm rounded-md border flex items-center text-background gap-x-2 bg-[#ff914d]"
            >
              {tag.name}
              <div role="button" data-tag={tag.id} className="cursor-pointer">
                <X className="h-4 w-4 text-background hover:text-background/50" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface KeywordsProps {
  blog: Blog;
  value: Keyword[];
  onChange: Dispatch<Keyword[]>;
}

export type Keyword = {
  id: string;
  word: string;
  created_by: number;
  created_at: number;
};

const Keywords = ({ blog, value, onChange }: KeywordsProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const { user } = useUser();
  const supabase = useSupabase();
  const [open, setOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [availableKeywords, setAvailableKeywords] = useState<Keyword[]>([]);

  const fetchAvailableKeywords = async () => {
    const { data, error } = await supabase
      .from("keywords")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }

    return data;
  };

  const addAvailableKeyword = async (word: string) => {
    if (!user) return;
    setIsLoading(true);
    setIsAdding(true);
    const { error } = await supabase.from("keywords").insert({
      word,
      created_by: user.id,
      created_at: Date.now(),
    });
    if (error) {
      console.error(error);
      return;
    }
    const data = await fetchAvailableKeywords();
    setAvailableKeywords(data);
    setIsLoading(false);
    setIsAdding(false);
  };

  const addKeyword = (keyword: Keyword) => {
    if (value.includes(keyword)) return; // Prevent empty & duplicate tags
    onChange([...value, keyword]);
    setInputValue("");
  };

  const removeKeyword = (keywordIdToRemove: string) => {
    onChange(value.filter((keyword) => keyword.id !== keywordIdToRemove));
  };

  const onClickHandler = (e: React.MouseEvent<HTMLDivElement>) => {
    const button = (e.target as HTMLElement).closest("[data-tag]");
    if (!button) return;

    const keywordToRemove = button.getAttribute("data-tag");
    if (keywordToRemove) {
      removeKeyword(keywordToRemove);
    }
  };

  useEffect(() => {
    const fetchKeywords = async () => {
      setIsLoading(true);
      const data = await fetchAvailableKeywords();
      setAvailableKeywords(data);
      setIsLoading(false);
    };

    fetchKeywords();
  }, []);

  const memoizedKeywords = useMemo(
    () => availableKeywords,
    [availableKeywords],
  );

  return (
    <div className="w-full">
      <div className="flex gap-x-2 items-center">
        <h1 className="text-sm font-bold w-24">Keywords:</h1>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              role="combobox"
              aria-expanded={open}
              className="flex-1"
              disabled={blog?.is_published === 1}
            >
              <Plus />
              Select Keywords
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" side="bottom" align="start">
            <Command>
              <CommandInput
                placeholder="Search keywords or add one...."
                value={inputValue}
                onValueChange={setInputValue}
              />
              <CommandList className="p-0">
                {!isLoading && (
                  <CommandEmpty className="h-24 flex items-center justify-center">
                    <h1 className="text-center text-muted-foreground text-xs break-words">
                      No Keywords Found. <br />
                      Add a keyword by Searching it
                    </h1>
                  </CommandEmpty>
                )}
                <CommandGroup>
                  {isLoading && (
                    <div className="h-24 flex flex-col gap-y-2 items-center justify-center">
                      <Spinner />
                      {isAdding && (
                        <h1 className="text-sm text-muted-foreground">
                          Adding...
                        </h1>
                      )}
                    </div>
                  )}
                  {!isLoading &&
                    memoizedKeywords.map((keyword) => (
                      <CommandItem
                        disabled={value.some((k) => k.id === keyword.id)}
                        key={keyword.id}
                        value={`${keyword.word}-${keyword.id}`}
                        onSelect={() => {
                          addKeyword(keyword);
                          setOpen(false);
                        }}
                      >
                        {keyword.word}
                      </CommandItem>
                    ))}
                  {!isLoading &&
                    inputValue &&
                    !memoizedKeywords.some((k) => k.word === inputValue) && (
                      <CommandItem
                        onSelect={() => {
                          addAvailableKeyword(inputValue);
                          setInputValue("");
                        }}
                      >
                        Add "{inputValue}"
                      </CommandItem>
                    )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {value.length !== 0 && (
        <div
          className="flex gap-x-1 gap-y-1 items-center flex-wrap py-2 min-h-11.5"
          onClick={onClickHandler}
        >
          {value.map((keyword) => (
            <div
              key={keyword.id}
              className="p-1 px-3 font-medium text-sm rounded-md border flex items-center text-background gap-x-2 bg-[#ff914d]"
            >
              {keyword.word}
              <div
                role="button"
                data-tag={keyword.id}
                className="cursor-pointer"
              >
                <X className="h-4 w-4 text-background hover:text-background/50" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

PublishModal.Analytics = Analytics;
PublishModal.Information = Information;
PublishModal.Category = Category;
PublishModal.Tags = Tags;
PublishModal.Keywords = Keywords;
PublishModal.Settings = Settings;
PublishModal.Buttons = Buttons;

export default PublishModal;
