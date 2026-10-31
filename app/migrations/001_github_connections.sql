begin;
create table if not exists public.rmc_github_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state_hash text, state_envelope text, state_expires timestamptz,
  token_envelope text, token_expires timestamptz,
  selection jsonb,
  window_start timestamptz not null default now(), request_count integer not null default 0
);
alter table public.rmc_github_connections enable row level security;
revoke all on public.rmc_github_connections from public, anon, authenticated;
-- This narrow RPC never accepts a user ID; every operation uses the verified caller.
-- Stored credentials are additionally encrypted with a Vercel-only key.
create or replace function public.rmc_github(action text, payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rmc_github_connections%rowtype; result jsonb;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if octet_length(payload::text) > 16384 then raise exception 'Request too large'; end if;
  insert into public.rmc_github_connections(user_id) values(uid) on conflict do nothing;
  select * into r from public.rmc_github_connections where user_id = uid for update;
  if r.window_start < now() - interval '1 minute' then r.request_count := 0; r.window_start := now(); end if;
  if r.request_count >= 30 then return jsonb_build_object('limited', true); end if;
  update public.rmc_github_connections set window_start=r.window_start, request_count=r.request_count+1 where user_id=uid;
  if action = 'begin' then
    update public.rmc_github_connections set state_hash=payload->>'hash', state_envelope=payload->>'envelope', state_expires=now()+interval '10 minutes' where user_id=uid;
    return '{}'::jsonb;
  elsif action = 'consume' then
    if r.state_expires > now() and r.state_hash = payload->>'hash' then
      result := jsonb_build_object('envelope', r.state_envelope);
      update public.rmc_github_connections set state_hash=null,state_envelope=null,state_expires=null where user_id=uid;
      return result;
    end if;
    return '{}'::jsonb;
  elsif action = 'read' then
    if r.token_expires > now() then return jsonb_build_object('envelope',r.token_envelope,'selection',r.selection); end if;
    return '{}'::jsonb;
  elsif action = 'save' then
    update public.rmc_github_connections set token_envelope=payload->>'envelope',token_expires=now()+make_interval(secs=>least(28800,greatest(1,(payload->>'seconds')::integer))),selection=null where user_id=uid;
    return '{}'::jsonb;
  elsif action = 'select' then
    update public.rmc_github_connections set selection=payload->'selection' where user_id=uid;
    return '{}'::jsonb;
  elsif action = 'disconnect' then
    update public.rmc_github_connections set token_envelope=null,token_expires=null,selection=null,state_hash=null,state_envelope=null,state_expires=null where user_id=uid;
    return '{}'::jsonb;
  end if;
  raise exception 'Unknown operation';
end;
$$;
revoke all on function public.rmc_github(text,jsonb) from public, anon;
grant execute on function public.rmc_github(text,jsonb) to authenticated;
commit;
