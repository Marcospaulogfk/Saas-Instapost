-- =====================================================================
-- 0009_scheduled_posts.sql
-- Posts pre-agendados gerados pelo Planejador Editorial (chat humanizado).
-- Cada item e uma ideia de post com data sugerida, vinculada a uma marca.
-- Ownership via brand -> user (mesmo padrao de projects/single_posts).
-- =====================================================================

create table public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  title text not null,                          -- titulo curto do post
  description text,                             -- breve descricao / angulo
  format text not null default 'post'
    check (format in ('post','carrossel','stories','reels')),
  objective text not null default 'engage'
    check (objective in ('sell','inform','engage','community')),
  scheduled_date date not null,                 -- data sugerida (YYYY-MM-DD)
  status text not null default 'ideia'
    check (status in ('ideia','em_criacao','pronto','agendado')),
  source text not null default 'ia'
    check (source in ('ia','manual')),          -- origem: plano IA ou criado a mao
  project_id uuid references public.projects(id) on delete set null, -- vira projeto depois
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index scheduled_posts_brand_id_idx on public.scheduled_posts(brand_id);
create index scheduled_posts_date_idx on public.scheduled_posts(scheduled_date);

create trigger trg_scheduled_posts_updated_at
  before update on public.scheduled_posts
  for each row execute function public.set_updated_at();

-- ---------- RLS (ownership via brand) ----------
alter table public.scheduled_posts enable row level security;

create policy "scheduled_posts_select_own"
  on public.scheduled_posts
  for select
  using (
    exists (
      select 1 from public.brands b
      where b.id = scheduled_posts.brand_id and b.user_id = auth.uid()
    )
  );

create policy "scheduled_posts_insert_own"
  on public.scheduled_posts
  for insert
  with check (
    exists (
      select 1 from public.brands b
      where b.id = scheduled_posts.brand_id and b.user_id = auth.uid()
    )
  );

create policy "scheduled_posts_update_own"
  on public.scheduled_posts
  for update
  using (
    exists (
      select 1 from public.brands b
      where b.id = scheduled_posts.brand_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.brands b
      where b.id = scheduled_posts.brand_id and b.user_id = auth.uid()
    )
  );

create policy "scheduled_posts_delete_own"
  on public.scheduled_posts
  for delete
  using (
    exists (
      select 1 from public.brands b
      where b.id = scheduled_posts.brand_id and b.user_id = auth.uid()
    )
  );
