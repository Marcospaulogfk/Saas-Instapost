-- =====================================================================
-- 0008_single_posts.sql
-- Cria tabela pra posts unicos (1 imagem, escolha manual de template).
-- Diferente de projects/slides que sao pra carrosseis.
-- =====================================================================

create table public.single_posts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  template_id text not null,
  title text not null,
  raw_brief text,                              -- texto original do usuario
  content jsonb not null default '{}'::jsonb,  -- SinglePostContent estruturado
  rendered_image_url text,                     -- PNG exportado se foi salvo
  status text not null default 'draft'
    check (status in ('draft','exported','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index single_posts_brand_id_idx on public.single_posts(brand_id);
create index single_posts_template_id_idx on public.single_posts(template_id);

create trigger trg_single_posts_updated_at
  before update on public.single_posts
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.single_posts enable row level security;

create policy "single_posts_select_own"
  on public.single_posts
  for select
  using (
    exists (
      select 1 from public.brands b
      where b.id = single_posts.brand_id and b.user_id = auth.uid()
    )
  );

create policy "single_posts_insert_own"
  on public.single_posts
  for insert
  with check (
    exists (
      select 1 from public.brands b
      where b.id = single_posts.brand_id and b.user_id = auth.uid()
    )
  );

create policy "single_posts_update_own"
  on public.single_posts
  for update
  using (
    exists (
      select 1 from public.brands b
      where b.id = single_posts.brand_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.brands b
      where b.id = single_posts.brand_id and b.user_id = auth.uid()
    )
  );

create policy "single_posts_delete_own"
  on public.single_posts
  for delete
  using (
    exists (
      select 1 from public.brands b
      where b.id = single_posts.brand_id and b.user_id = auth.uid()
    )
  );
