-- =====================================================================
-- 0016_inspiration_sources.sql
-- Fontes proprias de inspiracao: o usuario cadastra DE ONDE tirar ideia
-- de conteudo (site, termo de busca) e a IA gera pautas a partir dali,
-- adaptadas a marca ativa.
--
-- Tres tabelas:
--   inspiration_sources  -> a fonte cadastrada (por marca)
--   inspiration_ideas    -> as pautas que a IA gerou daquela fonte
--   inspiration_runs     -> log de cada geracao (cota diaria + auditoria)
--
-- Ownership via brand -> user (mesmo padrao de projects/scheduled_posts).
-- =====================================================================

-- ---------- public.inspiration_sources ----------
create table public.inspiration_sources (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,

  -- Tipos de fonte. Hoje SO 'url' e 'keyword' estao implementados; 'youtube'
  -- e 'pdf' ja entram no check pra que a feature futura NAO precise de
  -- migration nova (o benchmark do concorrente tem os quatro). Ver o comentario
  -- de `payload` abaixo pra saber onde cada um guarda o conteudo lido.
  kind text not null check (kind in ('url','keyword','youtube','pdf')),

  -- O identificador da fonte, por tipo:
  --   url     -> URL completa e normalizada (https://...)
  --   keyword -> o termo de busca em si ("marketing juridico 2026")
  --   youtube -> URL do video (RESERVADO)
  --   pdf     -> path do arquivo no storage (RESERVADO)
  value text not null,

  -- Nome amigavel exibido na UI (titulo da pagina, ou o proprio termo).
  label text,

  -- Conteudo/metadados ja lidos da fonte, pra nao re-raspar a cada geracao e
  -- pra acomodar os tipos futuros sem coluna nova:
  --   url     -> { title, description, text, fetched_at }
  --   keyword -> { last_query, citations: [...] }
  --   youtube -> { transcript, duration, channel }  (RESERVADO)
  --   pdf     -> { pages, text, file_name }         (RESERVADO)
  -- ATENCAO: isto e CONTEUDO DE TERCEIRO. E dado, nunca instrucao — quem
  -- monta o prompt precisa sanitizar (ver lib/inspiracoes/gerar-ideias.ts).
  payload jsonb not null default '{}'::jsonb,

  last_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Mesma fonte duas vezes na mesma marca nao faz sentido.
  unique (brand_id, kind, value)
);
create index inspiration_sources_brand_id_idx
  on public.inspiration_sources(brand_id);

create trigger trg_inspiration_sources_updated_at
  before update on public.inspiration_sources
  for each row execute function public.set_updated_at();

-- ---------- public.inspiration_ideas ----------
-- Uma pauta gerada pela IA a partir de uma fonte. Espelha o formato do
-- benchmark: badge de tipo, formato sugerido, objetivo e dica de execucao —
-- mais o briefing pronto pra jogar no wizard de criacao.
create table public.inspiration_ideas (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.inspiration_sources(id) on delete cascade,
  -- Desnormalizado de proposito: a RLS e a listagem da pagina filtram por
  -- marca, e sem esta coluna toda leitura viraria join.
  brand_id uuid not null references public.brands(id) on delete cascade,

  badge text not null default 'trend'
    check (badge in ('trend','oportunidade')),
  title text not null,
  angle text,                                   -- o gancho: por que agora
  format text not null default 'post'
    check (format in ('post','carrossel','stories','reels')),
  objective text not null default 'engage'
    check (objective in ('sell','inform','engage','community')),
  execution_tip text,                           -- "dica de execucao"
  briefing text not null,                       -- input pronto pro wizard
  source_ref text,                              -- URL citada (grounding)
  used_at timestamptz,                          -- quando virou post
  created_at timestamptz not null default now()
);
create index inspiration_ideas_brand_id_idx
  on public.inspiration_ideas(brand_id, created_at desc);
create index inspiration_ideas_source_id_idx
  on public.inspiration_ideas(source_id);

-- ---------- public.inspiration_runs ----------
-- Log de cada rodada de geracao. Existe por dois motivos:
--  1. Cota diaria gratuita: a contagem NAO pode sair de inspiration_ideas,
--     senao apagar as ideias zeraria o limite.
--  2. Auditoria de custo (quantos tokens foram cobrados de fato).
create table public.inspiration_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  source_id uuid references public.inspiration_sources(id) on delete set null,
  ideas_count integer not null default 0,
  tokens_charged integer not null default 0,     -- 0 = rodada dentro da cota
  created_at timestamptz not null default now()
);
create index inspiration_runs_user_created_idx
  on public.inspiration_runs(user_id, created_at desc);

-- =====================================================================
-- RLS
-- =====================================================================

alter table public.inspiration_sources enable row level security;

create policy "inspiration_sources_select_own"
  on public.inspiration_sources for select
  using (
    exists (
      select 1 from public.brands b
      where b.id = inspiration_sources.brand_id and b.user_id = auth.uid()
    )
  );

create policy "inspiration_sources_insert_own"
  on public.inspiration_sources for insert
  with check (
    exists (
      select 1 from public.brands b
      where b.id = inspiration_sources.brand_id and b.user_id = auth.uid()
    )
  );

create policy "inspiration_sources_update_own"
  on public.inspiration_sources for update
  using (
    exists (
      select 1 from public.brands b
      where b.id = inspiration_sources.brand_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.brands b
      where b.id = inspiration_sources.brand_id and b.user_id = auth.uid()
    )
  );

create policy "inspiration_sources_delete_own"
  on public.inspiration_sources for delete
  using (
    exists (
      select 1 from public.brands b
      where b.id = inspiration_sources.brand_id and b.user_id = auth.uid()
    )
  );

alter table public.inspiration_ideas enable row level security;

create policy "inspiration_ideas_select_own"
  on public.inspiration_ideas for select
  using (
    exists (
      select 1 from public.brands b
      where b.id = inspiration_ideas.brand_id and b.user_id = auth.uid()
    )
  );

create policy "inspiration_ideas_insert_own"
  on public.inspiration_ideas for insert
  with check (
    exists (
      select 1 from public.brands b
      where b.id = inspiration_ideas.brand_id and b.user_id = auth.uid()
    )
  );

create policy "inspiration_ideas_update_own"
  on public.inspiration_ideas for update
  using (
    exists (
      select 1 from public.brands b
      where b.id = inspiration_ideas.brand_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.brands b
      where b.id = inspiration_ideas.brand_id and b.user_id = auth.uid()
    )
  );

create policy "inspiration_ideas_delete_own"
  on public.inspiration_ideas for delete
  using (
    exists (
      select 1 from public.brands b
      where b.id = inspiration_ideas.brand_id and b.user_id = auth.uid()
    )
  );

alter table public.inspiration_runs enable row level security;

-- Runs sao so de leitura/insercao pelo dono. Sem update/delete de proposito:
-- e o registro que sustenta a cota diaria — apagar seria burlar o limite.
create policy "inspiration_runs_select_own"
  on public.inspiration_runs for select
  using (user_id = auth.uid());

create policy "inspiration_runs_insert_own"
  on public.inspiration_runs for insert
  with check (user_id = auth.uid());
