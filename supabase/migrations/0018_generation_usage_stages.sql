-- =====================================================================
-- 0018_generation_usage_stages.sql
-- Etapa 5 do CUSTOS-IA-MARGEM (21/08/2026): liga o medidor nas etapas
-- que estavam no escuro e abre espaco pra metadados de qualidade.
--
-- Novos stages:
--   refine_briefing -> /api/refine-prompt (organiza o briefing do modo
--                      do-zero; era a etapa mais cara e a unica sem medida)
--   extract_link    -> /api/extract-content (leitura estruturada da pagina)
--   carousel_copy   -> ja existia no check, mas NUNCA era gravado; passa a
--                      ser gravado pelo /api/editorial/generate-script
--
-- Nova coluna `meta` (jsonb): observacoes da etapa que nao merecem coluna
-- propria. Primeiro uso: { cover_rejected: bool, cover_reason: text,
-- registro: text } na linha de carousel_copy, pra medir a taxa real de capa
-- sem sujeito agora que o retry corretivo foi removido.
--
-- O codigo so manda `meta` quando tem algo a dizer, entao as linhas dos
-- stages antigos continuam gravando mesmo antes desta migration rodar.
-- =====================================================================

alter table public.generation_usage
  drop constraint if exists generation_usage_stage_check;

alter table public.generation_usage
  add constraint generation_usage_stage_check check (stage in (
    'post_unico_copy',
    'post_unico_compose',
    'post_unico_layout',
    'carousel_copy',
    'refine_briefing',
    'extract_link',
    'outro'
  ));

alter table public.generation_usage
  add column if not exists meta jsonb;

comment on column public.generation_usage.meta is
  'Observacoes da etapa (ex.: cover_rejected/cover_reason em carousel_copy). Nullable; so preenchido quando ha algo a registrar.';
