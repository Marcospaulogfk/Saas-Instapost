-- =====================================================================
-- 0001_initial_schema.sql
-- Cria tabelas base: users, brands, projects, slides, subscriptions.
-- =====================================================================

-- ---------- public.users (estende auth.users) ----------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  credits integer not null default 2,
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial','active','past_due','canceled','incomplete')),
  stripe_customer_id text unique,
  plan_credits_monthly integer not null default 0,
  plan_credits_used_this_month integer not null default 0,
  trial_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- public.brands ----------
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  website_url text,
  instagram_handle text,
  target_audience text,
  tone_of_voice text,
  visual_style text,
  main_objective text,
  logo_url text,
  brand_colors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index brands_user_id_idx on public.brands(user_id);

-- ---------- public.projects ----------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  title text not null,
  creation_mode text not null check (creation_mode in ('ai','manual')),
  objective text not null check (objective in ('sell','inform','engage','community')),
  status text not null default 'draft'
    check (status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);
create index projects_brand_id_idx on public.projects(brand_id);

-- ---------- public.slides ----------
create table public.slides (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  order_index integer not null,
  text_content text,
  image_url text,
  image_prompt text,
  editable_elements jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (project_id, order_index)
);
create index slides_project_id_idx on public.slides(project_id);

-- ---------- public.subscriptions ----------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_subscription_id text unique,
  plan_id text not null,
  billing_cycle text not null check (billing_cycle in ('monthly','yearly')),
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_id_idx on public.subscriptions(user_id);

-- ---------- updated_at automatico ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_brands_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
