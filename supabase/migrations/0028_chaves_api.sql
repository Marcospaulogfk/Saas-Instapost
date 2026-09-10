-- =====================================================================
-- 0028_chaves_api.sql
-- CHAVE DE INTEGRAÇÃO POR CONTA (10/09/2026).
--
-- Por que existe: até aqui a única porta de entrada de máquina era o
-- webhook do WebSync-OS, autenticado por um segredo GLOBAL de ambiente
-- (WEBSYNC_WEBHOOK_SECRET) e com o dono resolvido por outra variável
-- (WEBSYNC_BRAND_OWNER_ID). Isso funciona pra UMA integração, do dono do
-- servidor. Não funciona pro cliente que quer plugar o n8n dele: ele não
-- tem acesso ao ambiente, e mesmo que tivesse, um segredo compartilhado
-- não sabe dizer de quem é a conta.
--
-- Aqui a chave É a identidade: cada linha aponta pra um user_id, e as
-- rotas /api/v1/* resolvem o dono pela chave — nunca por variável de
-- ambiente, nunca pelo resolverDono.
--
-- A CHAVE EM CLARO NUNCA É GRAVADA. Guardamos o sha256 dela (entropia de
-- 32 caracteres do alfabeto base58 ~ 187 bits: não há dicionário nem
-- força bruta viável, então salt/bcrypt só custaria o índice que torna a
-- autenticação uma busca direta). Quem perde a chave gera outra; não há
-- "mostrar de novo", e isso é o comportamento correto.
--
-- `prefix` é o pedaço visível ("nxc_live_ab12cd") — é como a tela lista a
-- chave sem ter o segredo, do mesmo jeito que o Stripe e o GitHub fazem.
--
-- Aditiva e idempotente. Pode rodar em produção sem downtime.
-- =====================================================================

create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  -- Nome dado pelo dono ("n8n do financeiro"): é o que permite revogar a
  -- chave certa quando existem cinco.
  name         text not null,
  -- Pedaço visível da chave, com o "nxc_live_" incluso. Não é segredo.
  prefix       text not null,
  -- sha256 hex da chave inteira. Unique: é por ele que a autenticação
  -- encontra a linha, numa consulta só.
  key_hash     text not null unique,
  created_at   timestamptz not null default now(),
  -- Carimbado a cada chamada autenticada. Serve pra duas perguntas do
  -- dono: "essa chave ainda é usada?" e "a integração parou quando?".
  last_used_at timestamptz,
  -- Revogar não apaga: a linha fica pra o dono ver que existiu e quando
  -- morreu. Chave revogada responde 401 igual a chave inexistente.
  revoked_at   timestamptz
);

create index if not exists api_keys_user_id_idx
  on public.api_keys(user_id);

-- A autenticação filtra por hash E por revogada; o índice parcial atende
-- exatamente essa consulta, que roda em TODA requisição de máquina.
create index if not exists api_keys_ativas_idx
  on public.api_keys(key_hash)
  where revoked_at is null;

comment on table public.api_keys is
  'Chaves de integração por conta (nxc_live_*). A chave em claro nunca é '
  'gravada: só o sha256. Usada pelas rotas /api/v1/*, que resolvem o '
  'usuário pela chave e nunca por variável de ambiente.';
comment on column public.api_keys.prefix is
  'Pedaço visível da chave, pra tela listar sem ter o segredo.';
comment on column public.api_keys.key_hash is
  'sha256 hex da chave completa. É a única cópia que existe do lado de cá.';

-- ---------------------------------------------------------------------
-- RLS: o dono LÊ as próprias chaves e nada mais. Criar e revogar passam
-- pelo servidor (service_role), porque quem calcula o hash é o servidor —
-- deixar o client escrever a linha permitiria gravar um hash que não
-- corresponde a chave nenhuma, ou pior, colar o hash da chave de outro.
-- ---------------------------------------------------------------------
alter table public.api_keys enable row level security;

drop policy if exists "api_keys_select_own" on public.api_keys;
create policy "api_keys_select_own"
  on public.api_keys for select
  using (auth.uid() = user_id);
