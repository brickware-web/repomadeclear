begin;
create table if not exists public.rmc_billing_accounts (
 user_id uuid not null references auth.users(id) on delete cascade,
 mode text not null check(mode in ('test','live')),
 repository text not null,
 customer text not null unique,
 checkout text,
 locked_until timestamptz,
 locked_by uuid,
 created_at timestamptz not null default now(),
 primary key(user_id,mode)
);
insert into public.rmc_billing_accounts(user_id,mode,repository,customer,checkout,created_at)
 select user_id,'test',repository,customer,checkout,created_at from public.rmc_billing
 on conflict(user_id,mode) do nothing;
alter table public.rmc_billing_accounts enable row level security;
revoke all on public.rmc_billing_accounts from public,anon,authenticated;
grant all on public.rmc_billing_accounts to service_role;
create or replace function public.rmc_billing_lock(owner uuid,billing_mode text,lock_id uuid,release boolean default false)
returns boolean language plpgsql security invoker set search_path=public as $$
begin
 if release then
  update rmc_billing_accounts set locked_until=null,locked_by=null where user_id=owner and mode=billing_mode and locked_by=lock_id;
 else
  update rmc_billing_accounts set locked_until=now()+interval '90 seconds',locked_by=lock_id
   where user_id=owner and mode=billing_mode and (locked_until is null or locked_until<now());
 end if;
 return found;
end $$;
revoke all on function public.rmc_billing_lock(uuid,text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.rmc_billing_lock(uuid,text,uuid,boolean) to service_role;
commit;
