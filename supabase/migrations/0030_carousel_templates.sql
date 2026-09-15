-- =====================================================================
-- 0030_carousel_templates.sql
-- "Meus modelos": o usuario cria um slide (ou um carrossel inteiro) do
-- zero no editor e salva como modelo proprio da conta, pra reusar depois
-- sem refazer do zero. Lote 6, aprovado pelo Marcos em 2026-09-15.
--
-- `data` guarda o mesmo shape que o editor ja usa pra salvar carrossel
-- (CarouselV2Data em app/actions/carousel.ts) quando kind = 'carousel', ou
-- um unico PreviewSlide quando kind = 'slide' — sem reinventar o formato.
--
-- Ownership direta por user_id (nao por marca): modelo e da CONTA, nao de
-- uma marca especifica, mesmo padrao de editorial_carousels.
--
-- Idempotente de proposito (if not exists / drop-then-create nas policies)
-- pra poder reaplicar sem erro.
-- =====================================================================

create table if not exists public.carousel_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  kind text not null check (kind in ('slide', 'carousel')),
  data jsonb not null,

  -- Miniatura opcional pra listar "Meus modelos" sem re-renderizar o slide.
  preview_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carousel_templates_user_id_idx
  on public.carousel_templates(user_id, created_at desc);

drop trigger if exists trg_carousel_templates_updated_at on public.carousel_templates;
create trigger trg_carousel_templates_updated_at
  before update on public.carousel_templates
  for each row execute function public.set_updated_at();

comment on table public.carousel_templates is
  'Modelos proprios da conta (slide avulso ou carrossel inteiro) salvos a partir do editor pra reuso.';

-- =====================================================================
-- RLS
-- =====================================================================

alter table public.carousel_templates enable row level security;

drop policy if exists "carousel_templates_select_own" on public.carousel_templates;
create policy "carousel_templates_select_own"
  on public.carousel_templates for select
  using (user_id = auth.uid());

drop policy if exists "carousel_templates_insert_own" on public.carousel_templates;
create policy "carousel_templates_insert_own"
  on public.carousel_templates for insert
  with check (user_id = auth.uid());

drop policy if exists "carousel_templates_update_own" on public.carousel_templates;
create policy "carousel_templates_update_own"
  on public.carousel_templates for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "carousel_templates_delete_own" on public.carousel_templates;
create policy "carousel_templates_delete_own"
  on public.carousel_templates for delete
  using (user_id = auth.uid());
