-- Todo app schema. Paste into Supabase → SQL Editor and click Run.
-- Safe to re-run: it creates what's missing and replaces policies/functions.

-- ─── Tables ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

create table if not exists public.lists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 100),
  color      text not null default '#6366f1',
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  list_id      uuid references public.lists (id) on delete set null,
  title        text not null check (char_length(title) between 1 and 500),
  notes        text,
  due_date     date,
  priority     smallint not null default 3 check (priority between 1 and 3), -- 1 high, 2 medium, 3 low
  tags         text[] not null default '{}',
  is_done      boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists lists_user_idx          on public.lists (user_id);
create index if not exists tasks_user_done_due_idx on public.tasks (user_id, is_done, due_date);
create index if not exists tasks_list_idx          on public.tasks (list_id);
create index if not exists tasks_tags_idx          on public.tasks using gin (tags);
create index if not exists tasks_user_completed_idx on public.tasks (user_id, completed_at);

-- ─── Row Level Security: every user only ever sees their own rows ──────────

alter table public.profiles enable row level security;
alter table public.lists    enable row level security;
alter table public.tasks    enable row level security;

drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: read own"   on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "lists: read own"   on public.lists;
drop policy if exists "lists: insert own" on public.lists;
drop policy if exists "lists: update own" on public.lists;
drop policy if exists "lists: delete own" on public.lists;
create policy "lists: read own"   on public.lists for select to authenticated
  using (user_id = (select auth.uid()));
create policy "lists: insert own" on public.lists for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "lists: update own" on public.lists for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "lists: delete own" on public.lists for delete to authenticated
  using (user_id = (select auth.uid()));

-- A task may only point at a list owned by the same user.
create or replace function public.owns_list(list uuid)
returns boolean
language sql stable security invoker set search_path = ''
as $$
  select list is null
      or exists (select 1 from public.lists l where l.id = list and l.user_id = (select auth.uid()));
$$;

drop policy if exists "tasks: read own"   on public.tasks;
drop policy if exists "tasks: insert own" on public.tasks;
drop policy if exists "tasks: update own" on public.tasks;
drop policy if exists "tasks: delete own" on public.tasks;
create policy "tasks: read own"   on public.tasks for select to authenticated
  using (user_id = (select auth.uid()));
create policy "tasks: insert own" on public.tasks for insert to authenticated
  with check (user_id = (select auth.uid()) and public.owns_list(list_id));
create policy "tasks: update own" on public.tasks for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.owns_list(list_id));
create policy "tasks: delete own" on public.tasks for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, update                 on public.profiles to authenticated;
grant select, insert, update, delete on public.lists    to authenticated;
grant select, insert, update, delete on public.tasks    to authenticated;

-- ─── Triggers ──────────────────────────────────────────────────────────────

-- Keep tasks.updated_at current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- On signup: create the profile and default "Personal" and "Work" categories.
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
