begin;
create table public.rmc_scans (
 user_id uuid primary key references auth.users(id) on delete cascade,
 scan_key text, envelope text, running_until timestamptz,
 attempts integer not null default 0, day date not null default current_date
);
alter table public.rmc_scans enable row level security;
revoke all on public.rmc_scans from public, anon, authenticated;
create or replace function public.rmc_scan(action text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); r public.rmc_scans%rowtype;
begin
 if uid is null then raise exception 'Sign in required'; end if;
 if octet_length(payload::text)>1600000 then raise exception 'Too large'; end if;
 insert into public.rmc_scans(user_id) values(uid) on conflict do nothing;
 select * into r from public.rmc_scans where user_id=uid for update;
 if action='begin' then
  if r.envelope is not null then
   if r.scan_key=payload->>'key' then return jsonb_build_object('envelope',r.envelope); end if;
   return '{"completed":true}'::jsonb;
  end if;
  if r.day<>current_date then r.attempts:=0; end if;
  if r.attempts>=3 or r.running_until>now() then return '{"allowed":false}'::jsonb; end if;
  update public.rmc_scans set attempts=r.attempts+1,day=current_date,scan_key=payload->>'key',running_until=now()+interval '2 minutes' where user_id=uid;
  return '{"allowed":true}'::jsonb;
 elsif action='finish' then
  if r.envelope is not null or r.scan_key is distinct from payload->>'key' or r.running_until is null or r.running_until<now() then raise exception 'Invalid scan claim'; end if;
  update public.rmc_scans set envelope=payload->>'envelope',running_until=null where user_id=uid;
 elsif action='release' then
  update public.rmc_scans set running_until=null where user_id=uid and scan_key=payload->>'key';
 else raise exception 'Unknown operation'; end if;
 return '{}'::jsonb;
end; $$;
revoke all on function public.rmc_scan(text,jsonb) from public, anon;
grant execute on function public.rmc_scan(text,jsonb) to authenticated;
commit;
