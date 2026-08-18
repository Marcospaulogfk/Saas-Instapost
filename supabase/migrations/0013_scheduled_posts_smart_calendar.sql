-- =====================================================================
-- 0013_scheduled_posts_smart_calendar.sql
-- Calendario Inteligente: a IA gera a PAUTA de graca (0 tokens) e o
-- usuario paga so pra materializar o POST.
--
-- Reusa `scheduled_posts` (fonte unica desde 0012) — nao cria tabela nova.
-- Faltavam duas informacoes que a pauta gerada carrega:
--
--  * `network`  — a rede escolhida no modal (Instagram/Facebook/LinkedIn).
--                 Sem ela a pauta perde o contexto que definiu o formato e
--                 o tamanho do texto, e o card do pipeline nao sabe pra
--                 onde aquele conteudo ia.
--  * `rationale`— o PORQUE da pauta ("gancho de volta as aulas", "prova
--                 social pos-lancamento"). E o que faz o usuario confiar na
--                 sugestao antes de gastar 29 tokens gerando o post.
--                 `description` continua sendo o resumo do conteudo.
--
-- Seguro/idempotente (IF NOT EXISTS + recria o CHECK). RLS ja vale pra
-- tabela inteira (0009, ownership via brand) — coluna nova nao muda nada.
--
-- PENDENTE DE APLICAR. Nao rodada contra nenhum banco.
-- =====================================================================

-- 1) Rede de destino da pauta.
--    Default 'instagram' porque toda linha existente nasceu do Instagram
--    (e do planejador, que so falava dele) — backfill implicito e correto.
alter table public.scheduled_posts
  add column if not exists network text not null default 'instagram';

alter table public.scheduled_posts
  drop constraint if exists scheduled_posts_network_check;

-- tiktok entra no CHECK mesmo sem estar no modal: a coluna e do dominio, nao
-- da tela — assim adicionar a opcao na UI depois nao pede migration nova.
alter table public.scheduled_posts
  add constraint scheduled_posts_network_check
  check (network in ('instagram', 'facebook', 'linkedin', 'tiktok'));

-- 2) Justificativa curta da IA pra pauta (o "por que este post, neste dia").
alter table public.scheduled_posts
  add column if not exists rationale text;

comment on column public.scheduled_posts.network is
  'Rede de destino da pauta (instagram/facebook/linkedin/tiktok). Escolhida no modal do Calendario Inteligente.';

comment on column public.scheduled_posts.rationale is
  'Por que a IA sugeriu esta pauta nesta data (gancho/contexto). Gerado de graca — 0 tokens.';
