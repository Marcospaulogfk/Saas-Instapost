-- =====================================================================
-- 0023_vinculo_pauta_arte.sql
-- Liga a ARTE gerada à PAUTA que a originou (26/08/2026).
--
-- Por que esta migration existe: `scheduled_posts.project_id` (0009) aponta
-- pra `projects`, um caminho legado que o calendário não usa — e NUNCA foi
-- escrito por código nenhum. Coluna que existe não é coluna que é preenchida:
-- o CRM (WebSync-OS) ia esperar pra sempre por um valor que nunca chega.
--
-- A arte de verdade mora em duas tabelas, e o vínculo vive NELAS (e não um par
-- polimórfico em scheduled_posts): cada peça sabe de que pauta nasceu, sem
-- coluna nullable a mais do lado do calendário.
--
-- `on delete set null`: apagar a pauta não pode levar junto a arte que o
-- usuário já pagou pra gerar.
-- =====================================================================

alter table public.single_posts
  add column if not exists scheduled_post_id uuid
    references public.scheduled_posts(id) on delete set null;

alter table public.editorial_carousels
  add column if not exists scheduled_post_id uuid
    references public.scheduled_posts(id) on delete set null;

-- Índices: a consulta do /status é sempre "quais artes vieram destas pautas".
create index if not exists single_posts_scheduled_post_id_idx
  on public.single_posts(scheduled_post_id)
  where scheduled_post_id is not null;

create index if not exists editorial_carousels_scheduled_post_id_idx
  on public.editorial_carousels(scheduled_post_id)
  where scheduled_post_id is not null;

comment on column public.single_posts.scheduled_post_id is
  'Pauta (scheduled_posts) que originou este post. Null = criado avulso.';
comment on column public.editorial_carousels.scheduled_post_id is
  'Pauta (scheduled_posts) que originou este carrossel. Null = criado avulso.';
