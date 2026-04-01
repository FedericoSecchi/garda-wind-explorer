-- profiles: extends auth.users with plan and trial info
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  plan            text not null default 'free' check (plan in ('free', 'premium')),
  trial_end_date  timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can only read/update their own profile
create policy "profiles: own read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: own insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id);

-- upgrade_interest: track who clicked "Unlock access" or "Notify me"
create table if not exists public.upgrade_interest (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  notify     boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.upgrade_interest enable row level security;

create policy "interest: own insert" on public.upgrade_interest for insert with check (auth.uid() = user_id);
create policy "interest: own upsert" on public.upgrade_interest for update using (auth.uid() = user_id);
