-- Umrah invitation: attendance replies, anonymous click counts, private report.
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again (it only creates what is missing / replaces the report function).

create table if not exists public.umrah_rsvps (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  attending   boolean not null default true,
  guests      smallint not null default 1 check (guests between 0 and 20),
  message     text check (message is null or char_length(message) <= 300),
  lang        text check (lang is null or lang in ('ur', 'en')),
  visitor     text check (visitor is null or char_length(visitor) <= 40),
  constraint umrah_guests_match check (attending = (guests > 0))
);

create table if not exists public.umrah_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  event       text not null check (event ~ '^[a-z0-9_]{2,40}$'),
  lang        text check (lang is null or lang in ('ur', 'en')),
  visitor     text check (visitor is null or char_length(visitor) <= 40)
);
create index if not exists umrah_events_event_idx on public.umrah_events (event);

-- who (personal link ?to=Name) and which kind of device; no IP address or location is stored
alter table public.umrah_rsvps  add column if not exists guest    text check (guest is null or char_length(guest) <= 40);
alter table public.umrah_rsvps  add column if not exists device   text check (device is null or char_length(device) <= 60);
alter table public.umrah_events add column if not exists guest    text check (guest is null or char_length(guest) <= 40);
alter table public.umrah_events add column if not exists device   text check (device is null or char_length(device) <= 60);
alter table public.umrah_events add column if not exists referrer text check (referrer is null or char_length(referrer) <= 60);

create table if not exists public.umrah_settings (
  key   text primary key,
  value text not null
);

-- Guests may only ADD rows. Nobody can read them through the public key.
alter table public.umrah_rsvps    enable row level security;
alter table public.umrah_events   enable row level security;
alter table public.umrah_settings enable row level security;
revoke all on public.umrah_rsvps, public.umrah_events, public.umrah_settings from anon, authenticated;
-- column-level grants: guests cannot set id / created_at themselves
grant insert (name, attending, guests, message, lang, visitor, guest, device) on public.umrah_rsvps to anon;
grant insert (event, lang, visitor, guest, device, referrer) on public.umrah_events to anon;

drop policy if exists "guests add replies" on public.umrah_rsvps;
create policy "guests add replies" on public.umrah_rsvps for insert to anon with check (true);
drop policy if exists "guests add clicks" on public.umrah_events;
create policy "guests add clicks" on public.umrah_events for insert to anon with check (true);

-- Private key for report.html (random; read it with the last query below).
insert into public.umrah_settings (key, value)
values ('report_key', replace(gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

-- Report: returns totals only when the right key is given.
create or replace function public.umrah_report(p_key text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from umrah_settings where key = 'report_key' and value = p_key) then
    raise exception 'invalid report key' using errcode = '28000';
  end if;

  return (
    with latest as (            -- one reply per device: the most recent one counts
      select distinct on (coalesce(visitor, id::text)) *
      from umrah_rsvps
      order by coalesce(visitor, id::text), created_at desc, id desc
    )
    select json_build_object(
      'generated_at', now(),
      'visitors',     (select count(distinct visitor) from umrah_events where event = 'visit'),
      'visits',       (select count(*) from umrah_events where event = 'visit'),
      'events',       coalesce((select json_object_agg(event, n) from (select event, count(*) n from umrah_events group by event) e), '{}'::json),
      'by_day',       coalesce((select json_agg(json_build_object('day', d, 'visits', n) order by d)
                                from (select (created_at at time zone 'Asia/Karachi')::date d, count(*) n
                                      from umrah_events where event = 'visit' group by 1) v), '[]'::json),
      'replies',      (select count(*) from latest),
      'coming',       (select count(*) from latest where attending),
      'not_coming',   (select count(*) from latest where not attending),
      'guests',       (select coalesce(sum(guests), 0) from latest where attending),
      'list',         coalesce((select json_agg(json_build_object(
                                  'name', name, 'attending', attending, 'guests', guests,
                                  'message', message, 'lang', lang, 'guest', guest, 'device', device, 'at', created_at) order by created_at desc)
                                from latest), '[]'::json),
      'devices',      coalesce((select json_agg(json_build_object('device', device, 'visitors', n) order by n desc)
                                from (select coalesce(device, 'unknown') device, count(distinct visitor) n
                                      from umrah_events where event = 'visit' group by 1) d), '[]'::json),
      'sources',      coalesce((select json_agg(json_build_object('source', src, 'visits', n) order by n desc)
                                from (select coalesce(referrer, 'direct / app') src, count(*) n
                                      from umrah_events where event = 'visit' group by 1) r), '[]'::json),
      'people',       coalesce((select json_agg(json_build_object('guest', guest, 'first_seen', f, 'last_seen', l,
                                  'visits', v, 'opened', o, 'devices', dv,
                                  'replied', exists (select 1 from umrah_rsvps x where x.guest = g.guest)) order by l desc)
                                from (select guest, min(created_at) f, max(created_at) l,
                                             count(*) filter (where event = 'visit') v,
                                             count(*) filter (where event = 'open_invite') o,
                                             string_agg(distinct coalesce(device, '?'), ', ') dv
                                      from umrah_events where guest is not null group by guest) g), '[]'::json),
      'recent',       coalesce((select json_agg(json_build_object('event', event, 'guest', guest, 'device', device,
                                  'visitor', visitor, 'at', created_at) order by created_at desc)
                                from (select * from umrah_events order by created_at desc, id desc limit 150) e), '[]'::json)
    )
  );
end;
$$;

revoke all on function public.umrah_report(text) from public, anon, authenticated;
grant execute on function public.umrah_report(text) to anon;

-- Your private report key (open report.html and paste it, or use report.html#KEY):
select value as report_key from public.umrah_settings where key = 'report_key';
