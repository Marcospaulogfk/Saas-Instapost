-- =====================================================================
-- 0025_post_generations_fabrica.sql
-- Fase 0 da fábrica de templates (PLANO-LOOP-POST-EDITAVEL.md, 26/08/2026).
--
-- Toda geração bitmap do post único vira uma LINHA aqui no momento em que
-- nasce: briefing, nicho, content aprovado e a arte. Sem isso o dataset
-- evapora — a URL do Fal expira e a peça que o usuário gerou se perde pra
-- sempre. O re-host no Storage roda logo após a resposta (next/server
-- `after()`): `fal_art_url` é o registro do original, `art_url` é a cópia
-- permanente.
--
-- A mesma linha é a FILA da fábrica: `pipeline_status` acompanha a conversão
-- bitmap → spec editável (clean plate → extração → composição → revisão) e
-- `conversion` guarda o trabalho dos agentes. O painel /dashboard/admin/fabrica
-- lê e opera daqui.
--
-- `niche` existe por causa da biblioteca por segmento (visão do Marcos,
-- registrada no plano): é o metadado que ensina a IA a puxar "template de
-- barbearia" vs "template de advogado" sem o usuário escolher.
-- =====================================================================

create table if not exists public.post_generations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  briefing text,
  niche text,
  content jsonb,
  photo_prompt text,
  skeleton_id text,
  -- Original no Fal (expira) e cópia permanente no Storage.
  fal_art_url text not null,
  art_url text,
  fal_clean_url text,
  clean_url text,
  image_cost_usd numeric(8,4) not null default 0,
  -- Post salvo pelo usuário a partir desta geração (quando salvou).
  single_post_id uuid references public.single_posts(id) on delete set null,
  -- Fila da fábrica.
  pipeline_status text not null default 'capturada'
    check (pipeline_status in (
      'capturada',        -- nasceu; matéria-prima disponível
      'limpando',         -- clean plate em andamento (com retries)
      'extraida',         -- layout medido por visão
      'composta',         -- spec montado, aguardando render/julgamento
      'aguardando_revisao', -- pronto pro juiz (humano no painel, por ora)
      'aprovada',         -- juiz aprovou o spec
      'reprovada',        -- juiz descartou (motivo em conversion.judge_log)
      'promovida'         -- virou template na biblioteca
    )),
  -- Trabalho dos agentes: items medidos, spec, tentativas, log do juiz, custo.
  conversion jsonb,
  -- Template criado na promoção (single_posts).
  promoted_post_id uuid references public.single_posts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_generations_status_idx
  on public.post_generations (pipeline_status, created_at desc);
create index if not exists post_generations_created_idx
  on public.post_generations (created_at desc);
create index if not exists post_generations_brand_idx
  on public.post_generations (brand_id)
  where brand_id is not null;

create trigger trg_post_generations_updated_at
  before update on public.post_generations
  for each row execute function public.set_updated_at();

-- RLS ligado SEM policies de propósito: a tabela é interna da fábrica.
-- Anon e authenticated não enxergam nada; só a service_role (painel admin e
-- captura server-side) passa. Policy de leitura pro usuário final só quando
-- houver motivo de produto.
alter table public.post_generations enable row level security;

comment on table public.post_generations is
  'Fase 0 da fábrica: toda geração bitmap capturada + fila da conversão bitmap→spec editável.';
