-- Nestmakers database schema
-- Run this in the Supabase SQL editor
-- Safe to re-run: all statements are idempotent.

create extension if not exists "uuid-ossp";

-- ─── profiles ───────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  first_name text,
  last_name text,
  display_name text,
  is_anonymous boolean default false,
  date_of_birth date,
  country text,
  role text check (role in ('seeker', 'giver', 'both')),
  giver_types text[] default '{}',
  insemination_preference text check (insemination_preference in ('ai', 'ni', 'both')),
  involvement_level text check (involvement_level in ('anonymous', 'identity_release', 'limited_contact', 'known_donor', 'co_parenting')),
  bio text,
  ethnicity text,
  education text,
  hair_color text,
  eye_color text,
  blood_type text,
  alcohol_frequency text,
  smoking_frequency text,
  drug_frequency text,
  profile_photo_url text,
  profile_photo_urls text[] default '{}',
  selfie_video_url text,
  gov_id_url text,
  medical_file_urls text[] default '{}',
  verification_status text default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  prompts jsonb default '[]'::jsonb,
  is_active boolean default true,
  onboarding_complete boolean default false,
  push_token text,
  notif_push_enabled boolean default true,
  notif_new_match boolean default true,
  notif_new_message boolean default true,
  notif_new_like boolean default true,
  notif_cool_down boolean default true,
  notif_journey_updates boolean default false,
  notif_email_enabled boolean default true,
  notif_email_weekly_digest boolean default false,
  notif_email_safety_alerts boolean default true,
  journeys_completed integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── likes ──────────────────────────────────────────────────────────────────
create table if not exists likes (
  id uuid default uuid_generate_v4() primary key,
  from_user_id uuid references profiles(id) on delete cascade not null,
  to_user_id uuid references profiles(id) on delete cascade not null,
  note text,
  prompt_kicker text,
  passed_at timestamptz,
  created_at timestamptz default now(),
  unique(from_user_id, to_user_id)
);

-- Add passed_at to existing installs that predate this column
alter table likes add column if not exists passed_at timestamptz;

-- ─── matches ────────────────────────────────────────────────────────────────
create table if not exists matches (
  id uuid default uuid_generate_v4() primary key,
  user1_id uuid references profiles(id) on delete cascade not null,
  user2_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user1_id, user2_id)
);

-- ─── threads ────────────────────────────────────────────────────────────────
create table if not exists threads (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references matches(id) on delete cascade not null unique,
  last_message_at timestamptz,
  created_at timestamptz default now()
);

-- ─── messages ───────────────────────────────────────────────────────────────
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references threads(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- ─── reports ────────────────────────────────────────────────────────────────
create table if not exists reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references profiles(id) on delete cascade not null,
  reported_id uuid references profiles(id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz default now()
);

-- ─── blocked_users ──────────────────────────────────────────────────────────
create table if not exists blocked_users (
  id uuid default uuid_generate_v4() primary key,
  blocker_id uuid references profiles(id) on delete cascade not null,
  blocked_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id)
);

-- ─── row level security ─────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table likes enable row level security;
alter table matches enable row level security;
alter table threads enable row level security;
alter table messages enable row level security;
alter table reports enable row level security;
alter table blocked_users enable row level security;

-- ─── policies ───────────────────────────────────────────────────────────────
-- Policies do not support IF NOT EXISTS, so we drop and recreate each one.

-- profiles
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- public profile view: safe fields only for discovery and messaging surfaces
-- security_invoker = false bypasses profiles RLS intentionally (view exposes only safe columns),
-- but we filter here so direct queries can't reach inactive/incomplete profiles.
-- DROP + CREATE instead of CREATE OR REPLACE because Postgres does not allow
-- reordering or inserting columns mid-list via OR REPLACE.
drop view if exists public_profiles;
create view public_profiles
with (security_invoker = false) as
select
  id,
  first_name,
  display_name,
  is_anonymous,
  date_of_birth,
  country,
  role,
  giver_types,
  insemination_preference,
  involvement_level,
  bio,
  prompts,
  ethnicity,
  education,
  hair_color,
  eye_color,
  blood_type,
  alcohol_frequency,
  smoking_frequency,
  drug_frequency,
  profile_photo_url,
  profile_photo_urls,
  verification_status,
  is_active,
  onboarding_complete,
  journeys_completed,
  created_at,
  updated_at
from profiles
where is_active = true
  and onboarding_complete = true;

grant select on public_profiles to authenticated;

-- likes
drop policy if exists "likes_select_own" on likes;
create policy "likes_select_own" on likes
  for select using (from_user_id = auth.uid() or to_user_id = auth.uid());

drop policy if exists "likes_insert_own" on likes;
create policy "likes_insert_own" on likes
  for insert with check (from_user_id = auth.uid());

drop policy if exists "likes_delete_own" on likes;
create policy "likes_delete_own" on likes
  for delete using (from_user_id = auth.uid());

drop policy if exists "likes_update_pass" on likes;
create policy "likes_update_pass" on likes
  for update using (to_user_id = auth.uid())
  with check (to_user_id = auth.uid());

-- matches
drop policy if exists "matches_select_own" on matches;
create policy "matches_select_own" on matches
  for select using (user1_id = auth.uid() or user2_id = auth.uid());

-- threads
drop policy if exists "threads_select_own" on threads;
create policy "threads_select_own" on threads
  for select using (
    exists (
      select 1 from matches m
      where m.id = threads.match_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

drop policy if exists "threads_insert_match" on threads;
create policy "threads_insert_match" on threads
  for insert with check (
    exists (
      select 1 from matches m
      where m.id = match_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

-- messages
drop policy if exists "messages_select_own" on messages;
create policy "messages_select_own" on messages
  for select using (
    exists (
      select 1 from threads t
      join matches m on m.id = t.match_id
      where t.id = messages.thread_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

drop policy if exists "messages_insert_own" on messages;
create policy "messages_insert_own" on messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from threads t
      join matches m on m.id = t.match_id
      where t.id = thread_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

-- reports
drop policy if exists "reports_insert_own" on reports;
create policy "reports_insert_own" on reports
  for insert with check (reporter_id = auth.uid());

-- blocked_users
drop policy if exists "blocked_users_select_own" on blocked_users;
create policy "blocked_users_select_own" on blocked_users
  for select using (blocker_id = auth.uid());

drop policy if exists "blocked_users_insert_own" on blocked_users;
create policy "blocked_users_insert_own" on blocked_users
  for insert with check (blocker_id = auth.uid());

drop policy if exists "blocked_users_delete_own" on blocked_users;
create policy "blocked_users_delete_own" on blocked_users
  for delete using (blocker_id = auth.uid());

-- ─── functions & triggers ───────────────────────────────────────────────────
-- Triggers do not support OR REPLACE, so we drop and recreate each one.

-- Auto-create match + thread when two users have mutual likes
create or replace function handle_mutual_like()
returns trigger as $$
declare
  v_u1 uuid;
  v_u2 uuid;
  v_match_id uuid;
begin
  if exists (
    select 1 from likes
    where from_user_id = new.to_user_id
      and to_user_id = new.from_user_id
  ) then
    -- Canonical order: smaller uuid first
    v_u1 := least(new.from_user_id::text, new.to_user_id::text)::uuid;
    v_u2 := greatest(new.from_user_id::text, new.to_user_id::text)::uuid;

    insert into matches (user1_id, user2_id)
    values (v_u1, v_u2)
    on conflict do nothing
    returning id into v_match_id;

    if v_match_id is not null then
      insert into threads (match_id) values (v_match_id);
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_like_insert on likes;
create trigger on_like_insert
  after insert on likes
  for each row execute function handle_mutual_like();

-- Update thread.last_message_at on new message
create or replace function handle_new_message()
returns trigger as $$
begin
  update threads set last_message_at = new.created_at where id = new.thread_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_message_insert on messages;
create trigger on_message_insert
  after insert on messages
  for each row execute function handle_new_message();

-- Auto-set updated_at on profiles
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function handle_updated_at();

-- ─── ratings ────────────────────────────────────────────────────────────────
create table if not exists ratings (
  id uuid default uuid_generate_v4() primary key,
  rater_id uuid references profiles(id) on delete cascade not null,
  rated_id uuid references profiles(id) on delete cascade not null,
  communication integer check (communication between 1 and 5),
  honesty integer check (honesty between 1 and 5),
  reliability integer check (reliability between 1 and 5),
  emotional integer check (emotional between 1 and 5),
  overall integer check (overall between 1 and 5),
  note text,
  created_at timestamptz default now(),
  unique(rater_id, rated_id)
);

alter table ratings enable row level security;

drop policy if exists "ratings_insert_own" on ratings;
create policy "ratings_insert_own" on ratings
  for insert with check (rater_id = auth.uid());

drop policy if exists "ratings_select_own" on ratings;
create policy "ratings_select_own" on ratings
  for select using (rater_id = auth.uid() or rated_id = auth.uid());

-- ─── new profile columns (safe to re-run) ───────────────────────────────────
alter table profiles add column if not exists break_until timestamptz;
alter table profiles add column if not exists preference_visibility jsonb default '{}';

-- ─── storage buckets ────────────────────────────────────────────────────────
-- Run these separately in the Supabase dashboard > Storage, or via the API:
--
-- insert into storage.buckets (id, name, public) values ('profile-photos', 'profile-photos', true);
-- insert into storage.buckets (id, name, public) values ('medical-files', 'medical-files', false);
-- insert into storage.buckets (id, name, public) values ('verification', 'verification', false);
--
-- Storage policies (authenticated users can upload to their own folder):
--
-- create policy "profile_photos_upload" on storage.objects for insert
--   with check (bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "profile_photos_read" on storage.objects for select
--   using (bucket_id = 'profile-photos');
--
-- create policy "medical_files_upload" on storage.objects for insert
--   with check (bucket_id = 'medical-files' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "medical_files_read" on storage.objects for select
--   using (bucket_id = 'medical-files' and auth.uid()::text = (storage.foldername(name))[1]);
