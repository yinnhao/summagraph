-- ============================================
-- SummaGraph Database Schema
-- Phase 2: User profiles, generations, subscriptions
-- ============================================

-- Enable UUID extension (usually already enabled in Supabase)
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. User Profiles
-- Extends Supabase Auth's auth.users table
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'premium')),
  subscription_status text default 'inactive' check (subscription_status in ('active', 'inactive', 'past_due', 'canceled')),
  paypal_subscriber_id text unique,
  generation_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile (limited fields)
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Service role can do everything (for backend operations)
create policy "Service role has full access to profiles"
  on public.profiles for all
  using (auth.role() = 'service_role');

-- ============================================
-- 2. Generation Records
-- Tracks each infographic generation
-- ============================================
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  input_text text,
  style text,
  layout text,
  aspect text,
  language text,
  image_count int default 1,
  image_urls text[],
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.generations enable row level security;

-- Users can view their own generations
create policy "Users can view own generations"
  on public.generations for select
  using (auth.uid() = user_id);

-- Service role can insert/manage generations
create policy "Service role has full access to generations"
  on public.generations for all
  using (auth.role() = 'service_role');

-- Index for faster user queries
create index if not exists idx_generations_user_id on public.generations(user_id);
create index if not exists idx_generations_created_at on public.generations(created_at desc);

-- ============================================
-- 3. Subscriptions
-- Tracks PayPal subscription details
-- ============================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  paypal_subscription_id text unique,
  paypal_plan_id text,
  status text check (status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.subscriptions enable row level security;

-- Users can view their own subscriptions
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Service role can manage subscriptions
create policy "Service role has full access to subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

-- Index for faster lookups
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_paypal_id on public.subscriptions(paypal_subscription_id);

-- ============================================
-- 4. Auto-create profile on user signup
-- Trigger function
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: auto-create profile when a new user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 5. Auto-update updated_at timestamp
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at();
