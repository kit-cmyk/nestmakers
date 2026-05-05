-- Run this in the Supabase SQL editor (not the full schema.sql)

-- Make reported_id nullable so general concerns can be submitted without a target user
alter table reports alter column reported_id drop not null;

-- Blocked users table
create table if not exists blocked_users (
  id uuid default uuid_generate_v4() primary key,
  blocker_id uuid references profiles(id) on delete cascade not null,
  blocked_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id)
);

alter table blocked_users enable row level security;

create policy "blocked_users_select_own" on blocked_users
  for select using (blocker_id = auth.uid());

create policy "blocked_users_insert_own" on blocked_users
  for insert with check (blocker_id = auth.uid());

create policy "blocked_users_delete_own" on blocked_users
  for delete using (blocker_id = auth.uid());
