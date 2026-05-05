-- Add JSONB prompts column to profiles for storing user prompt answers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prompts jsonb DEFAULT '[]'::jsonb;
