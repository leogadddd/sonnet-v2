-- Fresh Sonnet schema. Applied transactionally by scripts/backend.mjs.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username ~ '^[a-zA-Z0-9_]{3,32}$'),
  first_name text check (length(first_name) <= 100),
  last_name text check (length(last_name) <= 100),
  image_url text,
  plan jsonb not null default '{"currentPlan":"Free"}',
  saved_blogs uuid[] not null default '{}',
  is_banned boolean not null default false,
  is_deleted boolean not null default false
);
create function public.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users(id, first_name) values (new.id, left(new.raw_user_meta_data->>'first_name', 100));
  return new;
end; $$;
create trigger create_profile after insert on auth.users for each row execute function public.create_profile();
revoke all on function public.create_profile() from public;

create function public.active_user() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.users where id = auth.uid() and not is_banned and not is_deleted);
$$;
revoke all on function public.active_user() from public;
grant execute on function public.active_user() to authenticated;
alter table public.users enable row level security;
create policy own_profile on public.users for select to authenticated using (id = auth.uid());
create policy edit_profile on public.users for update to authenticated using (id = auth.uid() and public.active_user()) with check (id = auth.uid());
revoke all on public.users from anon, authenticated;
grant select on public.users to authenticated;
grant update(username, first_name, last_name, image_url, saved_blogs) on public.users to authenticated;
-- This deliberately exposes only public display fields; the base table is owner-only.
create view public.public_profiles with (security_barrier = true) as
  select id, username, first_name, last_name, image_url from public.users where not is_deleted and not is_banned;
grant select on public.public_profiles to anon, authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(), name text not null unique check(length(name) between 1 and 80), slug text unique,
  created_by uuid default auth.uid() references public.users(id),
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);
create table public.tags (like public.categories including all);
create table public.keywords (like public.categories including all);
insert into public.categories(id, name, slug) values ('12a3368a-1960-465e-9de0-22ecbb1703c2', 'Explore', 'explore');

create table public.blogs (
  blog_id uuid primary key,
  author_id uuid not null references public.users(id),
  parent_blog uuid,
  title text not null default 'New Blog',
  slug text not null unique,
  description text not null default '',
  content jsonb not null default '{"content_json":"","content_html":""}',
  category_id uuid not null default '12a3368a-1960-465e-9de0-22ecbb1703c2' references public.categories(id),
  cover_image jsonb,
  icon text,
  read_time integer not null default 0 check(read_time >= 0),
  likes integer not null default 0,
  views integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  is_pinned boolean not null default false,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  is_archived boolean not null default false,
  is_preview boolean not null default false,
  is_on_explore boolean not null default true,
  published_at bigint not null default 0,
  created_at bigint not null,
  updated_at bigint not null,
  archived_at bigint not null default 0,
  deleted_at bigint not null default 0,
  synced_at bigint not null default 0,
  unique (blog_id, author_id),
  foreign key (parent_blog, author_id) references public.blogs(blog_id, author_id) deferrable initially deferred
);
create index blogs_owner on public.blogs(author_id);
create index blogs_feed on public.blogs(category_id, created_at desc, blog_id desc) where is_published and deleted_at = 0;
alter table public.blogs enable row level security;
create policy published_blogs on public.blogs for select to anon, authenticated using (
  is_published and not is_archived and deleted_at = 0 and
  exists(select 1 from public.public_profiles p where p.id = author_id)
);
create policy owned_blogs on public.blogs for select to authenticated using(author_id = auth.uid() and public.active_user());
create policy insert_blog on public.blogs for insert to authenticated with check(author_id = auth.uid() and public.active_user());
create policy update_blog on public.blogs for update to authenticated using(author_id = auth.uid() and public.active_user()) with check(author_id = auth.uid());
create policy delete_blog on public.blogs for delete to authenticated using(author_id = auth.uid() and public.active_user());
revoke all on public.blogs from anon, authenticated;
grant select on public.blogs to anon, authenticated;
grant delete on public.blogs to authenticated;
grant insert(blog_id,author_id,parent_blog,title,slug,description,content,category_id,cover_image,icon,read_time,is_pinned,is_published,is_archived,is_preview,is_on_explore,published_at,created_at,updated_at,archived_at,deleted_at,synced_at),
update(parent_blog,title,slug,description,content,category_id,cover_image,icon,read_time,is_pinned,is_published,is_archived,is_preview,is_on_explore,published_at,updated_at,archived_at,deleted_at,synced_at)
on public.blogs to authenticated;

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid not null unique references public.blogs(blog_id) on delete cascade,
  category_id uuid not null references public.categories(id)
);
create table public.blog_tags (
  blog_id uuid references public.blogs(blog_id) on delete cascade,
  tag_id uuid references public.tags(id), primary key(blog_id, tag_id)
);
create table public.blog_keywords (
  blog_id uuid references public.blogs(blog_id) on delete cascade,
  keyword_id uuid references public.keywords(id), primary key(blog_id, keyword_id)
);
do $$
declare t text;
begin
  foreach t in array array['categories','tags','keywords'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy read_taxonomy on public.%I for select to anon, authenticated using(true)',t);
    execute format('create policy add_taxonomy on public.%I for insert to authenticated with check(public.active_user())',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to anon, authenticated',t);
    execute format('grant insert on public.%I to authenticated',t);
  end loop;
  foreach t in array array['blog_categories','blog_tags','blog_keywords'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy read_links on public.%I for select to anon, authenticated using(exists(select 1 from public.blogs b where b.blog_id = %I.blog_id))',t,t);
    execute format('create policy own_links on public.%I for all to authenticated using(exists(select 1 from public.blogs b where b.blog_id = %I.blog_id and b.author_id = auth.uid()) and public.active_user()) with check(exists(select 1 from public.blogs b where b.blog_id = %I.blog_id and b.author_id = auth.uid()) and public.active_user())',t,t,t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to anon, authenticated',t);
    execute format('grant insert, update, delete on public.%I to authenticated',t);
  end loop;
end $$;

create table public.blog_likes (
  user_id uuid references public.users(id) on delete cascade,
  blog_id uuid references public.blogs(blog_id) on delete cascade,
  primary key(user_id,blog_id)
);
alter table public.blog_likes enable row level security;
create policy own_likes on public.blog_likes for select to authenticated using(user_id = auth.uid());
revoke all on public.blog_likes from anon, authenticated;
grant select on public.blog_likes to authenticated;
create function public.toggle_blog_like(target_blog uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.active_user() then raise exception 'Not authenticated'; end if;
  perform 1 from public.blogs b join public.users u on u.id = b.author_id
    where b.blog_id = target_blog and b.is_published and not b.is_archived and b.deleted_at = 0 and not u.is_banned and not u.is_deleted
    for update of b;
  if not found then raise exception 'Blog unavailable'; end if;
  delete from public.blog_likes where user_id = auth.uid() and blog_id = target_blog;
  if not found then insert into public.blog_likes values(auth.uid(), target_blog); end if;
  update public.blogs set likes = (select count(*) from public.blog_likes where blog_id = target_blog) where blog_id = target_blog;
end; $$;
revoke all on function public.toggle_blog_like(uuid) from public;
grant execute on function public.toggle_blog_like(uuid) to authenticated;

create table public.uploaded_images (
  id uuid primary key,
  user_id uuid not null references public.users(id),
  blog_id uuid,
  kind text not null check(kind in ('blog','avatar')),
  storage_path text not null unique,
  image_url text not null,
  content_type text not null,
  file_size bigint not null check(file_size between 1 and 20971520),
  uploaded_at bigint not null,
  foreign key (blog_id, user_id) references public.blogs(blog_id, author_id) on delete cascade,
  check((kind = 'avatar' and blog_id is null) or (kind = 'blog' and blog_id is not null))
);
alter table public.uploaded_images enable row level security;
create policy owner_images on public.uploaded_images for select to authenticated using(user_id = auth.uid() and public.active_user());
create policy visible_images on public.uploaded_images for select to anon, authenticated using(
  (kind = 'avatar' and exists(select 1 from public.public_profiles p where p.id = user_id and p.image_url = uploaded_images.image_url))
  or exists(select 1 from public.blogs b where b.blog_id = uploaded_images.blog_id and b.is_published and not b.is_archived and b.deleted_at = 0)
);
revoke all on public.uploaded_images from anon, authenticated;
grant select on public.uploaded_images to anon, authenticated;
-- Only the validated server upload endpoint may create/delete objects and metadata.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('images','images',false,20971520,array['image/jpeg','image/png','image/gif','image/webp']);
create policy read_sonnet_images on storage.objects for select to anon, authenticated using(
  bucket_id = 'images' and exists(select 1 from public.uploaded_images i where i.storage_path = name)
);
grant all on public.users, public.blogs, public.categories, public.tags, public.keywords, public.blog_categories, public.blog_tags, public.blog_keywords, public.blog_likes, public.uploaded_images to service_role;
