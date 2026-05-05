-- Support multiple profile photos
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_urls text[] DEFAULT '{}';
