-- =====================================================================
-- 0024_calendario_auto_publish.sql
-- Calendário compartilhado (CRM <-> Nexus) + publicação automática no
-- Instagram. 26/08/2026.
--
-- POR QUE ESTA MIGRATION EXISTE, em uma frase: a arte final em 1080x1350 já
-- é gerada e já é hospedada em URL pública nossa na hora de publicar — e a
-- URL é jogada fora logo depois. Nenhuma coluna recebe. Sem guardar isso,
-- um worker que acorda no dia agendado não tem o que mandar pra Meta.
--
-- O que NÃO é: `rendered_image_url` (0008) parece servir e não serve. Ela é a
-- MINIATURA da biblioteca (540px de largura, THUMB_WIDTH em
-- lib/single-posts/save.ts). A Meta aceita 540 (o mínimo dela é 320), publica
-- sem erro nenhum e o post sai com metade da resolução no perfil do cliente.
-- Por isso a coluna nova é separada, e não um reaproveitamento daquela.
--
-- `text[]` e não uma coluna só: carrossel tem N imagens e a ORDEM é o
-- conteúdo (slide 1 é a capa). Post único usa um array de 1 elemento — o
-- mesmo formato dos dois lados evita um `if` no worker.
-- =====================================================================

-- ---------- 1) Arte publicável, onde a arte mora ----------
alter table public.single_posts
  add column if not exists publish_image_urls text[];
alter table public.single_posts
  add column if not exists publish_prepared_at timestamptz;

alter table public.editorial_carousels
  add column if not exists publish_image_urls text[];
alter table public.editorial_carousels
  add column if not exists publish_prepared_at timestamptz;

comment on column public.single_posts.publish_image_urls is
  'PNG(s) no tamanho final (1080x1350), em URL pública nossa, prontos pra Meta. NÃO é a miniatura (rendered_image_url). Null/vazio = a peça não é agendável.';
comment on column public.editorial_carousels.publish_image_urls is
  'PNGs dos slides no tamanho final, NA ORDEM. Null/vazio = a peça não é agendável.';
comment on column public.single_posts.publish_prepared_at is
  'Quando a arte publicável foi materializada. Serve pra avisar que a peça mudou depois de preparada.';
comment on column public.editorial_carousels.publish_prepared_at is
  'Quando a arte publicável foi materializada. Serve pra avisar que a peça mudou depois de preparada.';

-- ---------- 2) Toda tentativa de publicar deixa rastro ----------
-- Hoje o sucesso vai pra instagram_publications (0019) e a FALHA morre num
-- console.error, dentro de um state de React. Com publicação automática isso
-- vira o pior desfecho possível: ninguém está olhando a tela às 9h da manhã.
create table if not exists public.publish_attempts (
  id uuid primary key default gen_random_uuid(),
  scheduled_post_id uuid not null
    references public.scheduled_posts(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  ok boolean not null,
  ig_media_id text,
  image_count int not null default 0,
  -- Motivo LEGÍVEL da falha. É o que o CRM mostra no card e o que o Marcos lê
  -- pra saber se reagenda ou se reexporta a arte.
  error text
);

create index if not exists publish_attempts_pauta_idx
  on public.publish_attempts (scheduled_post_id, attempted_at desc);

-- ---------- 3) Índice da varredura do worker ----------
-- O worker pergunta sempre a mesma coisa: "o que está agendado e já venceu?".
-- Parcial porque 'agendado' é uma fatia pequena da tabela.
create index if not exists scheduled_posts_agendados_idx
  on public.scheduled_posts (scheduled_date, scheduled_time)
  where status = 'agendado';

-- ---------- 4) RLS de publish_attempts (ownership via pauta -> brand) ----------
-- O worker usa service_role e não passa por aqui. Isto existe pro dono
-- conseguir ler o histórico na própria tela.
alter table public.publish_attempts enable row level security;

drop policy if exists "publish_attempts_select_own" on public.publish_attempts;

create policy "publish_attempts_select_own"
  on public.publish_attempts
  for select
  using (
    exists (
      select 1
      from public.scheduled_posts sp
      join public.brands b on b.id = sp.brand_id
      where sp.id = publish_attempts.scheduled_post_id
        and b.user_id = auth.uid()
    )
  );

-- Sem policy de insert/update/delete DE PROPÓSITO: quem escreve tentativa é o
-- worker (service_role). Cliente nenhum inventa histórico de publicação.
