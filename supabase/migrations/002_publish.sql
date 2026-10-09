create function public.publish_blog(target_blog uuid, selected_category uuid, selected_tags uuid[], selected_keywords uuid[]) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.active_user() then raise exception 'Not authenticated'; end if;
  perform 1 from public.blogs where blog_id = target_blog and author_id = auth.uid() and deleted_at = 0 for update;
  if not found then raise exception 'Blog unavailable'; end if;
  insert into public.blog_categories(blog_id, category_id) values(target_blog, selected_category)
    on conflict (blog_id) do update set category_id = excluded.category_id;
  delete from public.blog_tags where blog_id = target_blog;
  insert into public.blog_tags(blog_id, tag_id) select target_blog, unnest(selected_tags);
  delete from public.blog_keywords where blog_id = target_blog;
  insert into public.blog_keywords(blog_id, keyword_id) select target_blog, unnest(selected_keywords);
  update public.blogs set category_id = selected_category, is_published = true,
    published_at = (extract(epoch from now()) * 1000)::bigint,
    updated_at = (extract(epoch from now()) * 1000)::bigint where blog_id = target_blog;
end; $$;
revoke all on function public.publish_blog(uuid,uuid,uuid[],uuid[]) from public;
grant execute on function public.publish_blog(uuid,uuid,uuid[],uuid[]) to authenticated;
