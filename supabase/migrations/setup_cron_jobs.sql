-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Replace these placeholders before running this file in a real environment.
-- Example values:
--   <SUPABASE_PROJECT_URL> -> https://your-project-ref.supabase.co
--   <EDGE_FUNCTION_JWT>    -> a JWT allowed to invoke your edge functions

-- Cool-down reminders: runs every 30 minutes
-- Notifies users at ~24h remaining and ~1h remaining in their 48-hour cool-down
select cron.schedule(
  'cooldown-reminders',
  '*/30 * * * *',
  $$
  select net.http_post(
    url     := '<SUPABASE_PROJECT_URL>/functions/v1/send-cooldown-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <EDGE_FUNCTION_JWT>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Weekly digest emails: every Monday at 9am UTC
select cron.schedule(
  'weekly-digest',
  '0 9 * * 1',
  $$
  select net.http_post(
    url     := '<SUPABASE_PROJECT_URL>/functions/v1/send-weekly-digest',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <EDGE_FUNCTION_JWT>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
