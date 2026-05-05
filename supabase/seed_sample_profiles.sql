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
  is_active, onboarding_complete, verification_status
)
values
  (
    '11111111-0000-0000-0000-000000000001',
    'sample.giver1@nestmakers.test',
    'Marcus', 'Marcus', false,
    '1990-03-15', 'United States', 'giver',
    array['sperm_donor'],
    'ai', 'anonymous',
    'Athletic, healthy, passionate about science and the arts. Open donor with no contact expectations.',
    'Mixed', 'Bachelor''s', 'Brown', 'Hazel', 'O+',
    'rarely', 'never', 'never',
    true, true, 'pending'
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    'sample.giver2@nestmakers.test',
    'Lena', 'Lena', false,
    '1988-07-22', 'Canada', 'giver',
    array['egg_donor'],
    'ai', 'identity_release',
    'Artist and yoga teacher. I believe every child deserves to know their story when the time is right.',
    'White', 'Master''s', 'Blonde', 'Blue', 'A+',
    'socially', 'never', 'never',
    true, true, 'pending'
  ),
  (
    '33333333-0000-0000-0000-000000000003',
    'sample.giver3@nestmakers.test',
    'James', null, true,
    '1992-11-05', 'United Kingdom', 'giver',
    array['sperm_donor'],
    'both', 'known_donor',
    'Software engineer, marathon runner. Family means everything to me and I''d love to help build yours.',
    'Black', 'Bachelor''s', 'Black', 'Brown', 'B+',
    'never', 'never', 'never',
    true, true, 'pending'
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
    true, true, 'pending'
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
    true, true, 'pending'
  ),
  (
    '66666666-0000-0000-0000-000000000006',
    'sample.both1@nestmakers.test',
    'Alex', 'Alex', false,
    '1993-01-11', 'New Zealand', 'both',
    array['sperm_donor'],
    'ni', 'limited_contact',
    'Open to both giving and co-parenting. I''m a teacher who loves the outdoors. Very healthy, non-smoker.',
    'Maori', 'Bachelor''s', 'Dark Brown', 'Green', 'A-',
    'socially', 'never', 'never',
    true, true, 'pending'
  )
on conflict (id) do update set
  first_name = excluded.first_name,
  display_name = excluded.display_name,
  bio = excluded.bio,
  is_active = true,
  onboarding_complete = true;
