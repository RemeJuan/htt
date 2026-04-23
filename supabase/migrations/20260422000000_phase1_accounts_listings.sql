create extension if not exists pgcrypto;

create type public.listing_status as enum ('draft', 'published');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  platforms text[] not null,
  urls jsonb not null,
  website_url text,
  status public.listing_status not null default 'draft',
  is_claimed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_user_id_idx on public.listings (user_id);
create index listings_status_idx on public.listings (status);
create index listings_created_at_idx on public.listings (created_at desc);
create index profiles_username_idx on public.profiles (username);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_listings_updated_at
before update on public.listings
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'username', ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'New user'
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "listings_select_own_or_published"
on public.listings
for select
using (auth.uid() = user_id or status = 'published');

create policy "listings_insert_own"
on public.listings
for insert
with check (auth.uid() = user_id);

create policy "listings_update_own"
on public.listings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "listings_delete_own"
on public.listings
for delete
using (auth.uid() = user_id);
