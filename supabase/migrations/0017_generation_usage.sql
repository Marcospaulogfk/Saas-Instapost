-- =====================================================================
-- 0017_generation_usage.sql
-- Custo REAL de API por geracao — a conta que hoje nao existe.
--
-- Motivacao: `computeCost()` ja roda em lib/generation/claude.ts e em
-- lib/single-posts/free-generate.ts, mas o resultado morre no retorno da
-- funcao. Sem persistir, nao da pra responder "quanto custa um post unico?"
-- nem "o teto de 4 tentativas do compositor se paga?" — as duas viraram
-- chute, e o chute custou credito de API em agosto/2026.
--
-- O que esta tabela sustenta:
--   1. Margem por acao: custo_usd medido contra os tokens cobrados
--      (lib/tokens.ts). A regra de margem >= 80% que rege PLAN_TOKENS_BY_CYCLE
--      hoje e verificada no papel; aqui ela passa a ser verificavel no dado.
--   2. Distribuicao de `approved_on_attempt` — a serie que diz se
--      MAX_COMPOSE_ATTEMPTS = 4 vale o custo ou se a 3a e a 4a volta sao
--      queima pura. Baixar o teto sem essa serie e degradar arte no escuro.
--   3. Eficiencia de cache: cache_read vs cache_creation por chamada.
--
-- NAO e tabela de cobranca. O debito de token continua em users.credits via
-- debitTokens() — aqui e observabilidade de COGS, e por isso a escrita e
-- best-effort (ver lib/generation/usage-log.ts): falha de log nunca pode
-- derrubar uma geracao que o usuario ja pagou.
-- =====================================================================

create table public.generation_usage (
  id uuid primary key default gen_random_uuid(),

  -- Nullable: geracao de teste em DEV_MODE roda sem usuario autenticado, e
  -- perder a linha inteira nesse caso seria perder justamente a calibragem.
  user_id uuid references public.users(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,

  -- Que etapa do produto gastou. String livre com check pra que uma etapa
  -- nova nao precise de migration — mas o check evita typo virando categoria
  -- fantasma no relatorio.
  --   post_unico_copy    -> generateFreeText/generateCopy (texto do post)
  --   post_unico_compose -> composeSpec (o loop de composicao de layout)
  --   post_unico_layout  -> extractTextLayout (visao, modo bitmap)
  --   carousel_copy      -> roteiro do carrossel
  --   outro              -> escape hatch
  stage text not null check (stage in (
    'post_unico_copy',
    'post_unico_compose',
    'post_unico_layout',
    'carousel_copy',
    'outro'
  )),

  model text not null,

  -- Uso cru, como a API devolveu. Guardado separado do custo porque o PRECO
  -- muda com o tempo e o token nao: com os quatro campos da pra recalcular
  -- qualquer historico numa tabela de preco nova.
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_creation_input_tokens integer not null default 0,
  cache_read_input_tokens integer not null default 0,

  -- Custo em USD pela tabela vigente no momento da chamada.
  cost_usd numeric(10, 6) not null default 0,

  -- Quantas chamadas ao modelo a etapa gastou (loop de compose = 1..4).
  attempts integer not null default 1,
  -- Em qual tentativa a critica aprovou. NULL = estourou o teto e entregou a
  -- menos ruim. E a coluna do item (2) acima.
  approved_on_attempt integer,

  -- Tokens do PRODUTO cobrados do usuario nesta acao (lib/tokens.ts). E o que
  -- permite cruzar COGS com receita sem juntar com outra tabela.
  tokens_charged integer not null default 0,

  duration_ms integer,

  created_at timestamptz not null default now()
);

-- O relatorio que importa e "custo por etapa ao longo do tempo".
create index generation_usage_stage_created_idx
  on public.generation_usage(stage, created_at desc);

create index generation_usage_user_created_idx
  on public.generation_usage(user_id, created_at desc);

-- =====================================================================
-- RLS
-- =====================================================================

alter table public.generation_usage enable row level security;

-- Mesma politica de inspiration_runs: o dono le e insere, ninguem edita nem
-- apaga. Um registro de custo que o proprio usuario pode reescrever nao serve
-- pra auditar margem.
create policy "generation_usage_select_own"
  on public.generation_usage for select
  using (user_id = auth.uid());

create policy "generation_usage_insert_own"
  on public.generation_usage for insert
  with check (user_id = auth.uid());
