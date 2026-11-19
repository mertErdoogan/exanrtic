-- Dedektör Asistanı — initial backend schema.
--
-- Principle: the app is local-first. The server stores NO hunts, tracks,
-- digs or exact locations. It only keeps:
--   * per-user daily quota counters for AI reports (abuse protection), and
--   * a cache of public regional context (soil, encyclopedia extracts)
--     keyed by a coarse ~5 km grid cell, shared by all users.

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- AI report quota
-- ---------------------------------------------------------------------------
create table public.report_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  count integer not null default 0,
  primary key (user_id, day)
);

alter table public.report_usage enable row level security;

-- Users may read their own usage (e.g. to show "3 of 10 reports today").
create policy "read own usage"
  on public.report_usage for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- No insert/update/delete policies: only the edge function (service role)
-- changes counters, through the function below.

create or replace function public.consume_report_quota(p_user uuid, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.report_usage as u (user_id, day, count)
  values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update
    set count = u.count + 1
    where u.count < p_limit
  returning u.count into v_count;

  return v_count is not null;
end;
$$;

revoke all on function public.consume_report_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_report_quota(uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Shared regional context cache (public data only, coarse cells)
-- ---------------------------------------------------------------------------
create table public.region_context (
  cell_lat numeric(6, 2) not null,
  cell_lng numeric(6, 2) not null,
  language text not null check (language in ('tr', 'en')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key (cell_lat, cell_lng, language)
);

alter table public.region_context enable row level security;
-- No policies: readable and writable only by the service role.

create index region_context_created_idx on public.region_context (created_at);
