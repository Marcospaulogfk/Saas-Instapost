-- =====================================================================
-- 0012_scheduled_posts_planning.sql
-- Unifica o planejamento do Calendario Editorial num unico modelo no banco.
--
-- Antes: o calendario misturava `scheduled_posts` (banco, sem hora) com
-- "pautas" que viviam so em localStorage (lib/pautas.ts) e nunca persistiam.
-- Agora: tudo e scheduled_posts. Adiciona hora opcional e amplia os status
-- pra deixar a base pronta pro auto-publish futuro (worker NAO incluido aqui).
--
-- Seguro/idempotente: usa IF NOT EXISTS e recria o CHECK de status.
-- Aplicar em dev/local; producao so com OK explicito.
-- =====================================================================

-- 1) Hora opcional do agendamento (o dia continua em scheduled_date).
alter table public.scheduled_posts
  add column if not exists scheduled_time time;

-- 2) Amplia os status: adiciona 'publicado' e 'falhou' (ganchos p/ auto-publish).
--    Precisa dropar e recriar o CHECK — o nome do constraint segue o padrao
--    gerado pelo Postgres em 0009 (<tabela>_<coluna>_check).
alter table public.scheduled_posts
  drop constraint if exists scheduled_posts_status_check;

alter table public.scheduled_posts
  add constraint scheduled_posts_status_check
  check (status in ('ideia','em_criacao','pronto','agendado','publicado','falhou'));

-- Indice auxiliar pra ordenar por data+hora sem custo.
create index if not exists scheduled_posts_datetime_idx
  on public.scheduled_posts (scheduled_date, scheduled_time);

comment on column public.scheduled_posts.scheduled_time is
  'Hora opcional do agendamento (planejamento). Publicacao automatica ainda nao implementada.';
