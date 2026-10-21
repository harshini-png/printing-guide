// Complete idempotent SQL schema for PrintMate Supabase PostgreSQL setup

export const FULL_SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- PrintMate — Digital Printing Guide Notebook
-- Complete Supabase PostgreSQL Database Schema & Row Level Security (RLS) Setup
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- Table: categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index if not exists categories_name_lower_idx on public.categories (lower(trim(name)));

-- Table: guides
create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category_id uuid references public.categories(id) on delete restrict,
  icon text default 'BookOpen',
  published boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists guides_category_id_idx on public.guides(category_id);
create index if not exists guides_created_at_idx on public.guides(created_at desc);

-- Table: guide_steps
create table if not exists public.guide_steps (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides(id) on delete cascade,
  instruction text not null,
  description text,
  note text,
  step_order integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists guide_steps_guide_id_order_idx on public.guide_steps(guide_id, step_order asc);

-- Table: app_admins
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. HELPER FUNCTIONS & TRIGGERS

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_guides_updated_at on public.guides;
create trigger set_guides_updated_at
  before update on public.guides
  for each row
  execute function public.handle_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
  );
$$;

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

alter table public.categories enable row level security;
alter table public.guides enable row level security;
alter table public.guide_steps enable row level security;
alter table public.app_admins enable row level security;

-- CATEGORIES POLICIES
drop policy if exists "Categories are viewable by everyone" on public.categories;
create policy "Categories are viewable by everyone"
  on public.categories for select
  using (true);

drop policy if exists "Admins can insert categories" on public.categories;
create policy "Admins can insert categories"
  on public.categories for insert
  with check (public.is_admin());

drop policy if exists "Admins can update categories" on public.categories;
create policy "Admins can update categories"
  on public.categories for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete categories" on public.categories;
create policy "Admins can delete categories"
  on public.categories for delete
  using (public.is_admin());

-- GUIDES POLICIES
drop policy if exists "Guides are viewable by everyone if published or if admin" on public.guides;
create policy "Guides are viewable by everyone if published or if admin"
  on public.guides for select
  using (published = true or public.is_admin());

drop policy if exists "Admins can insert guides" on public.guides;
create policy "Admins can insert guides"
  on public.guides for insert
  with check (public.is_admin());

drop policy if exists "Admins can update guides" on public.guides;
create policy "Admins can update guides"
  on public.guides for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete guides" on public.guides;
create policy "Admins can delete guides"
  on public.guides for delete
  using (public.is_admin());

-- GUIDE STEPS POLICIES
drop policy if exists "Guide steps are viewable if guide is viewable" on public.guide_steps;
create policy "Guide steps are viewable if guide is viewable"
  on public.guide_steps for select
  using (
    exists (
      select 1 from public.guides g
      where g.id = guide_steps.guide_id
      and (g.published = true or public.is_admin())
    )
  );

drop policy if exists "Admins can insert guide steps" on public.guide_steps;
create policy "Admins can insert guide steps"
  on public.guide_steps for insert
  with check (public.is_admin());

drop policy if exists "Admins can update guide steps" on public.guide_steps;
create policy "Admins can update guide steps"
  on public.guide_steps for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete guide steps" on public.guide_steps;
create policy "Admins can delete guide steps"
  on public.guide_steps for delete
  using (public.is_admin());

-- APP ADMINS POLICIES
drop policy if exists "Admins can view admin allowlist" on public.app_admins;
create policy "Admins can view admin allowlist"
  on public.app_admins for select
  using (public.is_admin());

-- 5. DEFAULT SEED DATA
insert into public.categories (name)
values
  ('WhatsApp'),
  ('Cards & IDs'),
  ('Xerox'),
  ('Colour Print'),
  ('Email & PDF')
on conflict do nothing;
`;
