-- Add notification preference columns to profiles
-- Run this in the Supabase SQL editor

alter table profiles
  add column if not exists notif_push_enabled boolean default true,
  add column if not exists notif_new_match boolean default true,
  add column if not exists notif_new_message boolean default true,
  add column if not exists notif_new_like boolean default true,
  add column if not exists notif_cool_down boolean default true,
  add column if not exists notif_journey_updates boolean default false,
  add column if not exists notif_email_enabled boolean default true,
  add column if not exists notif_email_weekly_digest boolean default false,
  add column if not exists notif_email_safety_alerts boolean default true;
