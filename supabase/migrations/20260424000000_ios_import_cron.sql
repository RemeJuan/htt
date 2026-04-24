-- Migration: iOS Import Cron Scheduler
-- Description: Creates dispatch_ios_import() and schedules it daily at 06:00 UTC.
-- Requires: pg_cron (enabled) and pg_net extensions.

-- Enable pg_net if not already enabled
create extension if not exists pg_net with schema extensions;

-- Create a function to dispatch the iOS import
-- This uses pg_net's http_post to call the Edge Function
create or replace function public.dispatch_ios_import()
returns void
language plpgsql
security definer
as $$
declare
  func_url text;
  response_id bigint;
begin
  func_url := 'https://kxqnlmqyxedoyoulcmcp.supabase.co/functions/v1/ios-import-dispatcher';

  -- Fire-and-forget HTTP POST to the dispatcher
  -- pg_net queues the request asynchronously
  select net.http_post(
    url := func_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cW5sbXF5eGVkb3lvdWxjbWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg0NTkxNCwiZXhwIjoyMDkyNDIxOTE0fQ.RYpfx-MQET16brzK-qoPbNzWmowzkH6p83_XnIL8_sE'
    ),
    body := '{}'::jsonb
  ) into response_id;

  raise notice 'iOS import dispatched via pg_net (request_id: %)', response_id;
end;
$$;

-- Schedule: daily at 06:00 UTC
do $migration$
begin
  begin
    perform cron.unschedule('ios-import-daily');
  exception when others then
    null;
  end;

  perform cron.schedule(
    'ios-import-daily',
    '0 6 * * *',
    'select public.dispatch_ios_import()'
  );
end;
$migration$;
