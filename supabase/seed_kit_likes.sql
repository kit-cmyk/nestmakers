-- Nestmakers — Sample likes & matches for kitpimentel@outlook.com
-- Run this AFTER seed_sample_profiles.sql.
-- Requires Kit's profile to exist in the profiles table.
-- The handle_mutual_like trigger auto-creates matches + threads for mutual pairs.

do $$
declare
  kit_id    uuid;
  marcus_id uuid := '11111111-0000-0000-0000-000000000001';
  lena_id   uuid := '22222222-0000-0000-0000-000000000002';
  james_id  uuid := '33333333-0000-0000-0000-000000000003';
  sofia_id  uuid := '44444444-0000-0000-0000-000000000004';
  priya_id  uuid := '55555555-0000-0000-0000-000000000005';
  alex_id   uuid := '66666666-0000-0000-0000-000000000006';
begin
  select id into kit_id from profiles where email = 'kitpimentel@outlook.com';
  if kit_id is null then
    raise exception 'Profile not found for kitpimentel@outlook.com — make sure onboarding is complete';
  end if;

  -- ── Incoming likes (no return like → stays as unread like) ──────────────────
  insert into likes (from_user_id, to_user_id, note, prompt_kicker)
  values
    (
      marcus_id, kit_id,
      'Your profile really resonated with me. I love how thoughtfully you''ve approached this.',
      null
    ),
    (
      lena_id, kit_id,
      'When I read your answer about what you''re looking for, I felt like you just described exactly what I value too.',
      'Why I decided to donate'
    )
  on conflict (from_user_id, to_user_id) do nothing;

  -- ── Outgoing likes (no return like → unmatched sent) ────────────────────────
  insert into likes (from_user_id, to_user_id, note, prompt_kicker)
  values
    (
      kit_id, sofia_id,
      'Going solo takes real clarity. I admire that, and I''d love to connect.',
      null
    ),
    (
      kit_id, alex_id,
      'The way you described staying present without being central — that framing really stuck with me.',
      'How I think about my role'
    )
  on conflict (from_user_id, to_user_id) do nothing;

  -- ── Mutual likes → trigger fires → match + thread created ───────────────────
  -- James ↔ Kit
  insert into likes (from_user_id, to_user_id, note)
  values (james_id, kit_id, 'Reading your profile felt like meeting someone who genuinely gets it.')
  on conflict (from_user_id, to_user_id) do nothing;

  insert into likes (from_user_id, to_user_id, note)
  values (kit_id, james_id, 'Your commitment to being a known donor says everything about the kind of person you are.')
  on conflict (from_user_id, to_user_id) do nothing;

  -- Priya ↔ Kit
  insert into likes (from_user_id, to_user_id, note)
  values (priya_id, kit_id, 'We''ve been searching for someone with exactly this kind of intentionality.')
  on conflict (from_user_id, to_user_id) do nothing;

  insert into likes (from_user_id, to_user_id, note)
  values (kit_id, priya_id, 'Two doctors, eight years together, ready — I love the care behind this.')
  on conflict (from_user_id, to_user_id) do nothing;

  raise notice 'Done. kit_id = %', kit_id;
  raise notice '  Incoming unmatched likes: Marcus, Lena';
  raise notice '  Outgoing unmatched likes: Sofia, Alex';
  raise notice '  Matched (mutual): James, Priya';
end $$;
