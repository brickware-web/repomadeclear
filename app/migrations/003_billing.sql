begin;
create table if not exists public.rmc_billing (
 user_id uuid primary key references auth.users(id) on delete cascade,
 repository text not null,
 customer text not null unique,
 checkout text,
 created_at timestamptz not null default now()
);
create table if not exists public.rmc_payment_events (
 event_id text primary key,
 event_type text not null,
 received_at timestamptz not null default now()
);
create table if not exists public.rmc_overlays (
 user_id uuid primary key references auth.users(id) on delete cascade,
 scan_key text not null,
 envelope text not null,
 version integer not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.rmc_billing enable row level security;
alter table public.rmc_payment_events enable row level security;
alter table public.rmc_overlays enable row level security;
revoke all on public.rmc_billing,public.rmc_payment_events,public.rmc_overlays from public,anon,authenticated;
grant all on public.rmc_billing,public.rmc_payment_events,public.rmc_overlays,public.rmc_scans to service_role;
commit;
