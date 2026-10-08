-- v2: tags on tasks, archivable categories, history index, "Work" default category.
-- Paste into Supabase → SQL Editor and click Run. Safe to re-run.

-- Tags: free-form labels, several per task.
alter table public.tasks add column if not exists tags text[] not null default '{}';
create index if not exists tasks_tags_idx on public.tasks using gin (tags);

-- History looks tasks up by completion time.
create index if not exists tasks_user_completed_idx on public.tasks (user_id, completed_at);

-- Categories (the `lists` table) can be archived instead of deleted.
alter table public.lists add column if not exists archived_at timestamptz;

-- New users start with Personal and Work.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));

  insert into public.lists (user_id, name, color)
  values (new.id, 'Personal', '#6366f1'),
         (new.id, 'Work', '#0ea5e9');

  return new;
end;
$$;

-- Existing users get a Work category if they don't have one yet.
insert into public.lists (user_id, name, color)
select u.id, 'Work', '#0ea5e9'
from auth.users u
where not exists (
  select 1 from public.lists l where l.user_id = u.id and lower(l.name) = 'work'
);
