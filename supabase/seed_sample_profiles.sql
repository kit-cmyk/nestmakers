-- Nestmakers — Sample profile seed
-- Run this in the Supabase SQL editor (runs as postgres, bypasses RLS)
-- Creates 6 fake auth users + matching profiles for browse testing.

do $$
declare
  ids uuid[] := array[
    '11111111-0000-0000-0000-000000000001'::uuid,
    '22222222-0000-0000-0000-000000000002'::uuid,
    '33333333-0000-0000-0000-000000000003'::uuid,
    '44444444-0000-0000-0000-000000000004'::uuid,
    '55555555-0000-0000-0000-000000000005'::uuid,
    '66666666-0000-0000-0000-000000000006'::uuid
  ];
  emails text[] := array[
    'sample.giver1@nestmakers.test',
    'sample.giver2@nestmakers.test',
    'sample.giver3@nestmakers.test',
    'sample.seeker1@nestmakers.test',
    'sample.seeker2@nestmakers.test',
    'sample.both1@nestmakers.test'
  ];
  i int;
begin
  -- Insert into auth.users (required for FK on profiles)
  for i in 1..6 loop
    insert into auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data
    )
    values (
      ids[i],
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      emails[i],
      crypt('SamplePass123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb
    )
    on conflict (id) do nothing;
  end loop;
end $$;

-- Now insert the profiles
insert into profiles (
  id, email, first_name, display_name, is_anonymous,
  date_of_birth, country, role, giver_types,
  insemination_preference, involvement_level,
  bio, ethnicity, education, hair_color, eye_color, blood_type,
  alcohol_frequency, smoking_frequency, drug_frequency,
  is_active, onboarding_complete, verification_status,
  prompts
)
values
  (
    '11111111-0000-0000-0000-000000000001',
    'sample.giver1@nestmakers.test',
    'Marcus', 'Marcus', false,
    '1990-03-15', 'United States', 'giver',
    array['sperm'],
    'ai', 'anonymous',
    'Athletic, healthy, passionate about science and the arts. Open donor with no contact expectations.',
    'Mixed', 'Bachelor''s', 'Brown', 'Hazel', 'O+',
    'rarely', 'never', 'never',
    true, true, 'pending',
    '[
      {"id":"a1000001-0000-0000-0000-000000000001","kicker":"Why I decided to donate","answer":"I have so much I want to pass on — curiosity, good health, a love of building things. Helping a family start feels like a quiet kind of legacy.","tone":"lavender"},
      {"id":"a1000001-0000-0000-0000-000000000002","kicker":"One thing people are surprised to learn","answer":"I rock climb competitively and play classical piano. Apparently coordination really does run in the family.","tone":"peach"},
      {"id":"a1000001-0000-0000-0000-000000000003","kicker":"My approach to health","answer":"Three marathons, mostly whole foods, no smoking. My body is something I take seriously — and I think that matters here.","tone":"sage"}
    ]'::jsonb
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    'sample.giver2@nestmakers.test',
    'Lena', 'Lena', false,
    '1988-07-22', 'Canada', 'giver',
    array['egg'],
    'ai', 'identity_release',
    'Artist and yoga teacher. I believe every child deserves to know their story when the time is right.',
    'White', 'Master''s', 'Blonde', 'Blue', 'A+',
    'socially', 'never', 'never',
    true, true, 'pending',
    '[
      {"id":"b2000002-0000-0000-0000-000000000001","kicker":"What I hope to give beyond biology","answer":"A little creativity, some stubbornness, and a lot of warmth. Art has always been how I understand the world — I hope that comes through.","tone":"peach"},
      {"id":"b2000002-0000-0000-0000-000000000002","kicker":"I feel most alive when","answer":"Teaching a sunrise yoga class or finishing a painting at 2am. Both feel like exactly the same kind of presence.","tone":"lavender"},
      {"id":"b2000002-0000-0000-0000-000000000003","kicker":"On why I chose identity release","answer":"Every person deserves to know where they came from. No pressure, no obligation — just an open door if they ever want it.","tone":"butter"}
    ]'::jsonb
  ),
  (
    '33333333-0000-0000-0000-000000000003',
    'sample.giver3@nestmakers.test',
    'James', null, true,
    '1992-11-05', 'United Kingdom', 'giver',
    array['sperm'],
    'both', 'known_donor',
    'Software engineer, marathon runner. Family means everything to me and I''d love to help build yours.',
    'Black', 'Bachelor''s', 'Black', 'Brown', 'B+',
    'never', 'never', 'never',
    true, true, 'pending',
    '[
      {"id":"c3000003-0000-0000-0000-000000000001","kicker":"What family means to me","answer":"My parents showed me that love is a verb. I want to help build a family where that''s lived every day, not just said.","tone":"lavender"},
      {"id":"c3000003-0000-0000-0000-000000000002","kicker":"Why I want to be a known donor","answer":"Anonymity felt dishonest. If a child ever wants to know who I am, they should have that chance. That feels right to me.","tone":"peach"},
      {"id":"c3000003-0000-0000-0000-000000000003","kicker":"A quick health snapshot","answer":"Three marathons, no genetic conditions in my family history, never smoked. I take this seriously because the child will one day too.","tone":"sage"}
    ]'::jsonb
  ),
  (
    '44444444-0000-0000-0000-000000000004',
    'sample.seeker1@nestmakers.test',
    'Sofia', 'Sofia', false,
    '1985-05-30', 'Australia', 'seeker',
    '{}',
    null, null,
    'Single mum-to-be, nurse, book lover. Ready to start my family and looking for a kind, healthy donor.',
    'Hispanic', 'Bachelor''s', 'Dark Brown', 'Brown', 'O-',
    'rarely', 'never', 'never',
    true, true, 'pending',
    '[
      {"id":"d4000004-0000-0000-0000-000000000001","kicker":"Why I''m doing this solo","answer":"Going it alone was the most honest decision I''ve ever made. I''m not waiting for permission to become a mum.","tone":"peach"},
      {"id":"d4000004-0000-0000-0000-000000000002","kicker":"What I''m looking for","answer":"Kindness, good health, and someone who''s genuinely thought about what it means to give a part of themselves.","tone":"lavender"}
    ]'::jsonb
  ),
  (
    '55555555-0000-0000-0000-000000000005',
    'sample.seeker2@nestmakers.test',
    'Priya', 'Priya', false,
    '1991-08-18', 'India', 'seeker',
    '{}',
    null, null,
    'Pediatrician. My partner and I are ready to grow our family. Looking for someone with similar values.',
    'South Asian', 'Doctorate', 'Black', 'Brown', 'B+',
    'never', 'never', 'never',
    true, true, 'pending',
    '[
      {"id":"e5000005-0000-0000-0000-000000000001","kicker":"Our story so far","answer":"Eight years together, both doctors, both ready. The next step is finding someone who''s thought as carefully about this as we have.","tone":"butter"},
      {"id":"e5000005-0000-0000-0000-000000000002","kicker":"The values that matter most to us","answer":"Curiosity, compassion, and good health. We believe the best matches are built on intentionality — not just biology.","tone":"lavender"}
    ]'::jsonb
  ),
  (
    '66666666-0000-0000-0000-000000000006',
    'sample.both1@nestmakers.test',
    'Alex', 'Alex', false,
    '1993-01-11', 'New Zealand', 'both',
    array['sperm'],
    'ni', 'limited_contact',
    'Open to both giving and co-parenting. I''m a teacher who loves the outdoors. Very healthy, non-smoker.',
    'Maori', 'Bachelor''s', 'Dark Brown', 'Green', 'A-',
    'socially', 'never', 'never',
    true, true, 'pending',
    '[
      {"id":"f6000006-0000-0000-0000-000000000001","kicker":"How I think about my role","answer":"I''m open to giving and, down the line, maybe co-parenting. Either way I''d like to be a quiet presence — not absent, just not central.","tone":"sage"},
      {"id":"f6000006-0000-0000-0000-000000000002","kicker":"My life outside the classroom","answer":"Primary school teacher by week, tramper by weekend. Kids have been my whole world for years — I think I''d be a good part of yours.","tone":"butter"},
      {"id":"f6000006-0000-0000-0000-000000000003","kicker":"On health","answer":"Non-smoker, eat well, very active. Health is something I take pride in for myself and, one day, for someone else.","tone":"lavender"}
    ]'::jsonb
  )
on conflict (id) do update set
  first_name = excluded.first_name,
  display_name = excluded.display_name,
  bio = excluded.bio,
  giver_types = excluded.giver_types,
  insemination_preference = excluded.insemination_preference,
  involvement_level = excluded.involvement_level,
  role = excluded.role,
  prompts = excluded.prompts,
  is_active = true,
  onboarding_complete = true;
