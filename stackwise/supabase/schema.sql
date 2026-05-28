-- Stackwise — schéma initial Supabase / PostgreSQL
-- À exécuter dans l'éditeur SQL Supabase (ou via supabase db push).

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. profiles — étend auth.users
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro')),
  stripe_customer_id text
);

-- Auto-crée un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. portfolios
-- ============================================================
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Mon portefeuille',
  strategy text not null default 'VCA' check (strategy in ('DCA', 'VCA')),
  monthly_budget numeric not null default 500 check (monthly_budget >= 0),
  created_at timestamptz not null default now()
);
create index if not exists portfolios_user_id_idx on public.portfolios(user_id);

-- ============================================================
-- 3. allocations
-- ============================================================
create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  symbol text not null,
  coingecko_id text not null,
  target_pct numeric not null check (target_pct >= 0 and target_pct <= 100),
  unique (portfolio_id, symbol)
);
create index if not exists allocations_portfolio_id_idx on public.allocations(portfolio_id);

-- ============================================================
-- 4. holdings
-- ============================================================
create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  symbol text not null,
  quantity numeric not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  unique (portfolio_id, symbol)
);
create index if not exists holdings_portfolio_id_idx on public.holdings(portfolio_id);

-- ============================================================
-- 5. transactions
-- ============================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  date date not null default current_date,
  amount_eur numeric not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_portfolio_id_date_idx
  on public.transactions(portfolio_id, date desc);

-- ============================================================
-- 6. snapshots
-- ============================================================
create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  date date not null default current_date,
  total_value_eur numeric not null,
  total_invested_eur numeric not null,
  created_at timestamptz not null default now(),
  unique (portfolio_id, date)
);
create index if not exists snapshots_portfolio_id_date_idx
  on public.snapshots(portfolio_id, date desc);

-- ============================================================
-- Row-Level Security — un utilisateur ne voit que ses données
-- ============================================================
alter table public.profiles    enable row level security;
alter table public.portfolios  enable row level security;
alter table public.allocations enable row level security;
alter table public.holdings    enable row level security;
alter table public.transactions enable row level security;
alter table public.snapshots   enable row level security;

-- profiles : un user n'accède qu'à sa propre ligne
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- portfolios : un user n'accède qu'à ses portefeuilles
drop policy if exists "portfolios_all_own" on public.portfolios;
create policy "portfolios_all_own" on public.portfolios
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Helper : check ownership via portfolio_id
create or replace function public.user_owns_portfolio(p_portfolio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.portfolios p
    where p.id = p_portfolio_id and p.user_id = auth.uid()
  );
$$;

-- allocations / holdings / transactions / snapshots : via ownership du portefeuille
drop policy if exists "allocations_all_via_portfolio" on public.allocations;
create policy "allocations_all_via_portfolio" on public.allocations
  for all using (public.user_owns_portfolio(portfolio_id))
  with check (public.user_owns_portfolio(portfolio_id));

drop policy if exists "holdings_all_via_portfolio" on public.holdings;
create policy "holdings_all_via_portfolio" on public.holdings
  for all using (public.user_owns_portfolio(portfolio_id))
  with check (public.user_owns_portfolio(portfolio_id));

drop policy if exists "transactions_all_via_portfolio" on public.transactions;
create policy "transactions_all_via_portfolio" on public.transactions
  for all using (public.user_owns_portfolio(portfolio_id))
  with check (public.user_owns_portfolio(portfolio_id));

drop policy if exists "snapshots_all_via_portfolio" on public.snapshots;
create policy "snapshots_all_via_portfolio" on public.snapshots
  for all using (public.user_owns_portfolio(portfolio_id))
  with check (public.user_owns_portfolio(portfolio_id));
