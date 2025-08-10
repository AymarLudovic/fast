-- Subscriptions table
create table if not exists public.subscriptions (
  user_id text primary key,
  subscription_type text check (subscription_type in ('trial','plan')) default 'trial',
  expiration_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Update trigger to maintain updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at on public.subscriptions;
create trigger trg_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- Discount codes table
create table if not exists public.discount_codes (
  code text primary key,
  percent numeric check (percent > 0 and percent <= 100),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- RLS (optional): service role bypasses RLS, but we can allow public read on discount codes
alter table public.discount_codes enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'discount_codes' and policyname = 'allow_select_all'
  ) then
    create policy allow_select_all on public.discount_codes
      for select using (true);
  end if;
end $$;

-- You may enable RLS on subscriptions and keep access via service role only.
alter table public.subscriptions enable row level security;
-- No public policies for subscriptions; API routes will use service role.
