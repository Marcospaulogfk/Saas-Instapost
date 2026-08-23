-- =====================================================================
-- APLICAR-EM-PRODUCAO.sql
-- As quatro migrations pendentes, na ordem certa, num arquivo só.
--
-- Como rodar: SQL Editor do Supabase (projeto tekeydyljvaaabucrssn),
-- colar tudo e Run. O editor roda em transação: ou entra tudo, ou nada.
--
-- Todas são ADITIVAS: criam tabela, coluna, função e índice novos. Nenhuma
-- apaga ou reescreve dado existente. A 0020 depende da 0014 (usa
-- users.referral_credits e public.referrals), por isso a ordem importa.
--
-- Gerado em 22/08/2026. Fonte: supabase/migrations/*.sql no repo.
-- =====================================================================


-- =====================================================================
-- >>> 0014_indicacao.sql
-- INDICAÇÃO: códigos, vínculo, crédito no 1º pagamento
-- =====================================================================

-- =====================================================================
-- 0014_indicacao.sql
-- Programa INDIQUE E GANHE (two-sided).
--
-- POR QUE two-sided: o concorrente (BestContent) paga só quem indica —
-- quem clica no link não ganha nada e entra no funil como um visitante
-- qualquer. Aqui os DOIS lados ganham, e os dois só ganham no PRIMEIRO
-- PAGAMENTO CONFIRMADO do indicado. Isso faz o bônus do indicado virar
-- incentivo de COMPRA (não de cadastro), que é justamente onde o funil
-- perde, e mantém a anti-fraude por construção: conta falsa não paga.
--
-- ECONOMIA (números batem com lib/tokens.ts e lib/indicacao/config.ts):
--   quem indica  -> 100 tokens (≈ 3 posts únicos ou 2 carrosséis completos)
--   quem é indicado ->  45 tokens (= PLAN_TOKENS.trial, um teste inteiro a mais)
--   custo total  -> 145 tokens x R$0,016069 ≈ R$2,33 de COGS
--   receita      -> R$47 (Starter, o plano mais barato) na primeira fatura
--   => ~5% da 1ª mensalidade, pago SÓ quando a conversão já aconteceu.
--      Não mexe no piso de 80% de margem: é custo de aquisição, não de
--      operação, e não recorre (é one-shot por indicado).
--
-- TOKENS DE INDICAÇÃO NUNCA EXPIRAM: por isso NÃO entram em `users.credits`
-- (que é resetado a cada renovação pelo webhook). Vão para a coluna nova
-- `users.referral_credits`, um balde permanente. `consume_image_credit`
-- passa a gastar o balde que EXPIRA primeiro e só depois o permanente.
--
-- ATENÇÃO: migration NÃO aplicada. Rodar manualmente com OK do CEO.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Balde permanente de tokens de indicação
-- ---------------------------------------------------------------------
alter table public.users
  add column if not exists referral_credits integer not null default 0;

comment on column public.users.referral_credits is
  'Tokens ganhos por indicação. NUNCA expiram e NUNCA são resetados pelo '
  'webhook de renovação — diferente de users.credits.';

-- ---------------------------------------------------------------------
-- 2) Código pessoal de indicação (1 por usuário)
-- ---------------------------------------------------------------------
create table if not exists public.referral_codes (
  user_id    uuid primary key references public.users(id) on delete cascade,
  code       text not null unique,
  created_at timestamptz not null default now()
);

-- Busca por código é sempre case-insensitive na aplicação; o código já é
-- gravado em maiúsculas, então o índice único do PK/unique basta.

-- ---------------------------------------------------------------------
-- 3) Indicações
--
-- `referred_id` é UNIQUE: um usuário só pode ser indicado por UMA pessoa e
-- só pode ser creditado UMA vez — a regra anti-fraude vive no schema, não
-- na aplicação.
-- ---------------------------------------------------------------------
create table if not exists public.referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references public.users(id) on delete cascade,
  referred_id  uuid not null unique references public.users(id) on delete cascade,
  code         text not null,
  status       text not null default 'pending'
    check (status in ('pending','qualified','blocked')),
  -- E-mail do indicado JÁ MASCARADO. O painel "Seus Indicados" precisa
  -- mostrar quem entrou, mas o indicador não pode ver o e-mail real de
  -- outra pessoa (e RLS impediria ler public.users de terceiros).
  referred_email_masked text,
  tokens_referrer integer not null default 0,
  tokens_referred integer not null default 0,
  qualified_at timestamptz,
  created_at   timestamptz not null default now(),
  -- Ninguém indica a si mesmo.
  constraint referrals_no_self check (referrer_id <> referred_id)
);

create index if not exists referrals_referrer_id_idx on public.referrals(referrer_id);
create index if not exists referrals_status_idx      on public.referrals(status);

-- ---------------------------------------------------------------------
-- 4) Helpers
-- ---------------------------------------------------------------------

-- Mascara e-mail: "marcosodpor@gmail.com" -> "ma***@gmail.com".
create or replace function public.mascarar_email(p_email text)
returns text
language plpgsql
immutable
as $$
declare
  v_local  text;
  v_dominio text;
  v_at int;
begin
  if p_email is null or p_email = '' then
    return null;
  end if;
  v_at := position('@' in p_email);
  if v_at <= 1 then
    return '***';
  end if;
  v_local   := substr(p_email, 1, v_at - 1);
  v_dominio := substr(p_email, v_at);
  return substr(v_local, 1, least(2, length(v_local))) || '***' || v_dominio;
end;
$$;

-- Gera um código de 8 caracteres sem os ambíguos (0/O/1/I/L) — o código é
-- ditado por WhatsApp e Stories, então precisa sobreviver a ser digitado à mão.
create or replace function public.gerar_codigo_indicacao()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code
        || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from public.referral_codes rc where rc.code = v_code);
  end loop;
  return v_code;
end;
$$;

-- Devolve (criando na primeira vez) o código do usuário.
-- Lazy: usuários antigos ganham código no primeiro acesso à página.
create or replace function public.get_or_create_referral_code(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  -- Um usuário autenticado só pode pedir o PRÓPRIO código.
  -- (auth.uid() é null quando a chamada vem do service_role.)
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'não autorizado';
  end if;

  select rc.code into v_code from public.referral_codes rc where rc.user_id = p_user_id;
  if v_code is not null then
    return v_code;
  end if;

  insert into public.referral_codes (user_id, code)
  values (p_user_id, public.gerar_codigo_indicacao())
  on conflict (user_id) do nothing;

  select rc.code into v_code from public.referral_codes rc where rc.user_id = p_user_id;
  return v_code;
end;
$$;

-- ---------------------------------------------------------------------
-- 5) Vincular um indicado a um código (ainda SEM creditar nada)
--
-- Retorna 'ok' | 'codigo_invalido' | 'auto_indicacao' | 'ja_vinculado'
--         | 'ja_pagante' | 'janela_expirada'
--
-- Guardas:
--  - código tem de existir;
--  - ninguém indica a si mesmo;
--  - `referred_id` unique impede trocar de indicador depois;
--  - quem JÁ é pagante não pode ser vinculado (senão daria pra "indicar"
--    retroativamente um cliente que já estava dentro);
--  - janela de 30 dias desde o cadastro.
-- ---------------------------------------------------------------------
create or replace function public.registrar_indicacao(
  p_referred_id uuid,
  p_code        text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer uuid;
  v_status   text;
  v_criado   timestamptz;
  v_email    text;
begin
  -- A função é executável por `authenticated`, então precisa se defender de
  -- alguém passar o uuid de OUTRA pessoa e amarrar um terceiro ao próprio
  -- código. Usuário logado só vincula a SI MESMO; auth.uid() é null quando a
  -- chamada vem do trigger de cadastro ou do service_role.
  if auth.uid() is not null and auth.uid() <> p_referred_id then
    raise exception 'não autorizado';
  end if;

  if p_code is null or length(trim(p_code)) = 0 then
    return 'codigo_invalido';
  end if;

  select rc.user_id into v_referrer
    from public.referral_codes rc
   where rc.code = upper(trim(p_code));

  if v_referrer is null then
    return 'codigo_invalido';
  end if;
  if v_referrer = p_referred_id then
    return 'auto_indicacao';
  end if;
  if exists (select 1 from public.referrals r where r.referred_id = p_referred_id) then
    return 'ja_vinculado';
  end if;

  select u.subscription_status, u.created_at, u.email
    into v_status, v_criado, v_email
    from public.users u
   where u.id = p_referred_id;

  if v_status is null then
    return 'codigo_invalido';
  end if;
  if v_status = 'active' then
    return 'ja_pagante';
  end if;
  if v_criado < now() - interval '30 days' then
    return 'janela_expirada';
  end if;

  insert into public.referrals (referrer_id, referred_id, code, referred_email_masked)
  values (v_referrer, p_referred_id, upper(trim(p_code)), public.mascarar_email(v_email))
  on conflict (referred_id) do nothing;

  return 'ok';
end;
$$;

-- ---------------------------------------------------------------------
-- 6) Creditar no PRIMEIRO PAGAMENTO CONFIRMADO
--
-- Chamada pela camada de cobrança (lib/billing/apply.ts, service_role) em toda compra aprovada.
-- É IDEMPOTENTE por construção: só existe uma linha por `referred_id` e o
-- UPDATE exige status 'pending'. Da segunda cobrança em diante não credita
-- mais nada, então o webhook pode chamar sempre sem precisar saber se
-- aquele pagamento era o primeiro.
--
-- Retorna jsonb: { credited, referrer_id, tokens_referrer, tokens_referred }
-- ---------------------------------------------------------------------
create or replace function public.creditar_indicacao_no_pagamento(
  p_referred_id     uuid,
  p_tokens_referrer integer default 100,
  p_tokens_referred integer default 45
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref record;
  v_tr  integer := least(greatest(coalesce(p_tokens_referrer, 0), 0), 500);
  v_td  integer := least(greatest(coalesce(p_tokens_referred, 0), 0), 500);
begin
  -- Trava a linha: dois webhooks simultâneos não podem creditar duas vezes.
  select * into v_ref
    from public.referrals r
   where r.referred_id = p_referred_id
     and r.status = 'pending'
   for update;

  if not found then
    return jsonb_build_object('credited', false);
  end if;

  update public.referrals
     set status          = 'qualified',
         qualified_at    = now(),
         tokens_referrer = v_tr,
         tokens_referred = v_td
   where id = v_ref.id;

  update public.users
     set referral_credits = referral_credits + v_tr
   where id = v_ref.referrer_id;

  update public.users
     set referral_credits = referral_credits + v_td
   where id = p_referred_id;

  return jsonb_build_object(
    'credited', true,
    'referrer_id', v_ref.referrer_id,
    'tokens_referrer', v_tr,
    'tokens_referred', v_td
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 7) Consumo de token: gasta o balde que EXPIRA primeiro
--
-- Reescreve consume_image_credit (0004) preservando a assinatura e o
-- contrato (boolean, 1 token por chamada, FOR UPDATE). A única mudança:
-- quando `credits` zera, cai em `referral_credits`. `debitTokens()` em
-- lib/tokens.ts continua funcionando sem alteração nenhuma.
--
-- Ordem deliberada: tokens do plano somem na renovação, tokens de
-- indicação não — então queimar primeiro o que ia virar pó.
-- `plan_credits_used_this_month` só sobe quando o token gasto é do plano
-- (a barra "usado no mês" mede o plano, não o bônus).
-- ---------------------------------------------------------------------
create or replace function public.consume_image_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits  integer;
  v_referral integer;
begin
  select credits, referral_credits
    into v_credits, v_referral
    from public.users
   where id = p_user_id
   for update;

  if v_credits is null then
    return false;
  end if;

  if v_credits > 0 then
    update public.users
       set credits = credits - 1,
           plan_credits_used_this_month = plan_credits_used_this_month + 1
     where id = p_user_id;
    return true;
  end if;

  if coalesce(v_referral, 0) > 0 then
    update public.users
       set referral_credits = referral_credits - 1
     where id = p_user_id;
    return true;
  end if;

  return false;
end;
$$;

-- Estorno: devolve para o balde do PLANO. Estornar para o balde permanente
-- transformaria uma geração falha em token que nunca expira — seria um jeito
-- de converter token de plano em token eterno.
create or replace function public.refund_image_credit(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
     set credits = credits + 1,
         plan_credits_used_this_month = greatest(plan_credits_used_this_month - 1, 0)
   where id = p_user_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 8) Atribuição automática no cadastro
--
-- Reescreve handle_new_user (0010) mantendo o grant de trial idêntico e
-- só ACRESCENTANDO a leitura do código de indicação vindo do metadata do
-- signup (`options.data.ref_code` no supabase.auth.signUp, ou o `ref` da
-- query string do OAuth).
--
-- O bloco está em exception handler próprio: código inválido NUNCA pode
-- derrubar o cadastro do usuário.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  -- 45 = PLAN_TOKENS.trial em lib/tokens.ts. A 0010 concedia 40, escrito
  -- quando esse era o valor no codigo; o codigo subiu pra 45 e o trigger
  -- ficou pra tras. Nao era so divergencia cosmetica: um carrossel completo
  -- de 7 slides custa 41 tokens (4 texto + 25 capa + 6x2 miolo), entao com 40
  -- o trial nao fechava UMA peca inteira -- justamente o contrario do que o
  -- trial existe pra fazer, que e mostrar o produto no melhor estado.
  -- Quem ja se cadastrou com 40 continua com 40: mexer em saldo existente e
  -- decisao de negocio, nao de migration.
  insert into public.users (id, email, credits, plan_credits_monthly, subscription_status)
  values (new.id, new.email, 45, 45, 'trial')
  on conflict (id) do nothing;

  begin
    v_code := coalesce(
      new.raw_user_meta_data->>'ref_code',
      new.raw_user_meta_data->>'ref'
    );
    if v_code is not null and length(trim(v_code)) > 0 then
      perform public.registrar_indicacao(new.id, v_code);
    end if;
  exception when others then
    -- Indicação é acessório: se falhar, o cadastro segue.
    raise warning 'handle_new_user: falha ao registrar indicação (%)', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 9) RLS
--
-- Escrita nas duas tabelas acontece EXCLUSIVAMENTE pelas funções
-- security definer acima (e pelo service_role no webhook). Por isso não
-- existe policy de insert/update/delete: o usuário não consegue forjar
-- uma indicação nem se editar para 'qualified'.
-- ---------------------------------------------------------------------
alter table public.referral_codes enable row level security;
alter table public.referrals      enable row level security;

-- ---------- referral_codes ----------
create policy "referral_codes_select_own"
  on public.referral_codes
  for select
  using (auth.uid() = user_id);

-- ---------- referrals ----------
-- Os dois lados da indicação enxergam a linha: o indicador precisa do
-- painel "Seus Indicados"; o indicado precisa ver que o bônus dele está
-- pendente (e quanto vai ganhar quando assinar).
create policy "referrals_select_own"
  on public.referrals
  for select
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- ---------------------------------------------------------------------
-- 10) Privilégios das funções
-- ---------------------------------------------------------------------
revoke all on function public.gerar_codigo_indicacao()                    from public;
revoke all on function public.get_or_create_referral_code(uuid)           from public;
revoke all on function public.registrar_indicacao(uuid, text)             from public;
revoke all on function public.creditar_indicacao_no_pagamento(uuid, integer, integer) from public;
revoke all on function public.mascarar_email(text)                        from public;

grant execute on function public.get_or_create_referral_code(uuid) to authenticated, service_role;
-- registrar_indicacao é chamada pelo usuário logado (colar código de convite)
-- e pelo trigger de cadastro.
grant execute on function public.registrar_indicacao(uuid, text)   to authenticated, service_role;
-- Creditar é só do webhook. Nunca do cliente.
grant execute on function public.creditar_indicacao_no_pagamento(uuid, integer, integer) to service_role;
grant execute on function public.gerar_codigo_indicacao()          to service_role;
grant execute on function public.mascarar_email(text)              to service_role;

-- ---------------------------------------------------------------------
-- 11) Backfill: todo usuário existente já nasce com código
--     (a página também cria sob demanda, isto só evita a latência)
-- ---------------------------------------------------------------------
-- Linha a linha (e não INSERT ... SELECT) de propósito: gerar_codigo_indicacao()
-- checa colisão contra a tabela, e num INSERT único as linhas ainda não
-- commitadas seriam invisíveis para essa checagem.
do $$
declare
  r record;
begin
  for r in
    select u.id
      from public.users u
     where not exists (
       select 1 from public.referral_codes rc where rc.user_id = u.id
     )
  loop
    perform public.get_or_create_referral_code(r.id);
  end loop;
end;
$$;


-- =====================================================================
-- >>> 0016_inspiration_sources.sql
-- FONTES DE INSPIRAÇÃO: pautas próprias
-- =====================================================================

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


-- =====================================================================
-- >>> 0020_token_ledger_billing.sql
-- EXTRATO E COBRANÇA: baldes, apply/grant/refund_tokens, billing_events
-- =====================================================================

-- =====================================================================
-- 0020_token_ledger_billing.sql
-- A economia de tokens vira UMA regra, escrita no banco:
--
--   "Tokens do PLANO recarregam no dia da renovação e zeram o que sobrou.
--    Tokens AVULSOS e de BÔNUS (indicação) não vencem.
--    Ordem de consumo: plano -> avulso -> bônus.
--    Toda entrada e saída vira uma linha no extrato."
--
-- Decisões do Marcos em 22/08/2026 (TOKENS-INDICACAO-AFILIADOS-rev3.docx):
--   - extrato obrigatório, UMA linha por peça (carrossel, post único, pauta,
--     recarga, bônus) — nunca por slide ou etapa interna;
--   - ciclos: só mensal e anual, tokens iguais nos dois;
--   - cobrança no Asaas, via camada neutra lib/billing (provider guardado
--     na linha, nunca hardcoded no schema).
--
-- PRÉ-REQUISITO: 0014_indicacao.sql aplicada (usa users.referral_credits e
-- public.referrals). Aditiva: nenhuma coluna existente muda de semântica.
--   users.credits                      = balde do PLANO (como sempre)
--   users.plan_credits_monthly         = grant do plano (como sempre)
--   users.plan_credits_used_this_month = cache de "usados" (como sempre)
--   users.referral_credits             = balde de BÔNUS (0014)
--   users.topup_credits                = balde AVULSO (novo)
-- =====================================================================

-- ---------- users: baldes + assinatura ----------
alter table public.users
  add column if not exists topup_credits integer not null default 0,
  add column if not exists plan_id text
    check (plan_id is null or plan_id in ('starter','pro','studio')),
  add column if not exists plan_cycle text
    check (plan_cycle is null or plan_cycle in ('monthly','annual')),
  add column if not exists plan_renews_at timestamptz,
  add column if not exists past_due_since timestamptz,
  add column if not exists billing_provider text,
  add column if not exists billing_customer_id text,
  add column if not exists billing_subscription_id text;

create unique index if not exists users_billing_subscription_idx
  on public.users(billing_provider, billing_subscription_id)
  where billing_subscription_id is not null;

comment on column public.users.topup_credits is
  'Tokens AVULSOS comprados. Não vencem. Consumidos depois do plano e antes do bônus.';
comment on column public.users.plan_renews_at is
  'Próxima renovação esperada. O job diário recarrega quem passou desta data sem webhook.';

-- ---------- subscriptions: neutra de provedor ----------
alter table public.subscriptions
  add column if not exists provider text,
  add column if not exists provider_subscription_id text,
  add column if not exists provider_customer_id text,
  add column if not exists checkout_id text,
  add column if not exists affiliate_code text,
  add column if not exists value_cents integer,
  add column if not exists last_payment_id text,
  add column if not exists canceled_at timestamptz;

alter table public.subscriptions drop constraint if exists subscriptions_billing_cycle_check;
alter table public.subscriptions
  add constraint subscriptions_billing_cycle_check
  check (billing_cycle in ('monthly','annual','yearly'));

create unique index if not exists subscriptions_provider_sub_idx
  on public.subscriptions(provider, provider_subscription_id)
  where provider_subscription_id is not null;
create unique index if not exists subscriptions_checkout_idx
  on public.subscriptions(provider, checkout_id)
  where checkout_id is not null;

-- ---------- extrato ----------
create table if not exists public.token_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  -- Positivo = entrada, negativo = saída.
  delta       integer not null,
  -- Quanto saiu/entrou de cada balde nesta linha (sempre >= 0).
  from_plan   integer not null default 0,
  from_topup  integer not null default 0,
  from_bonus  integer not null default 0,
  -- Saldo de cada balde DEPOIS da linha (pra auditoria sem recomputar).
  plan_after  integer not null,
  topup_after integer not null,
  bonus_after integer not null,
  -- Tipo da movimentação. String livre com check: tipo novo = migration,
  -- de propósito, pra não nascer categoria fantasma no extrato.
  kind text not null check (kind in (
    'grant_plan',        -- recarga do plano (assinatura paga / renovação)
    'grant_trial',       -- teste grátis
    'grant_topup',       -- compra avulsa
    'grant_referral',    -- bônus de indicação
    'grant_courtesy',    -- cortesia manual (suporte)
    'debit_carousel',    -- geração de carrossel (uma linha, total)
    'debit_single_post', -- geração de post único
    'debit_image',       -- imagem avulsa (regenerar capa/slide)
    'debit_edit_bitmap', -- edição cirúrgica do bitmap
    'debit_ideas',       -- pautas/inspirações além da cota grátis
    'debit_other',
    'refund',            -- estorno de um débito (falha na geração)
    'expire_plan',       -- zerar sobra do plano na renovação
    'strip_plan'         -- remoção administrativa (estorno de pagamento,
                         -- assinatura encerrada). NÃO conta como uso do mês:
                         -- o usuário não gastou, a gente tirou.
  )),
  -- Peça a que a linha se refere (pra "abrir" a partir do extrato).
  ref_type    text,
  ref_id      text,
  title       text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists token_transactions_user_created_idx
  on public.token_transactions(user_id, created_at desc);

-- Backstop de idempotência: a mesma concessão referenciada não entra duas
-- vezes, nem que o código erre. Só vale pra ENTRADAS com referência.
create unique index if not exists token_transactions_grant_ref_idx
  on public.token_transactions(user_id, kind, ref_id)
  where ref_id is not null and kind in ('grant_plan', 'grant_topup', 'grant_referral');

alter table public.token_transactions enable row level security;

drop policy if exists "token_transactions_select_own" on public.token_transactions;
create policy "token_transactions_select_own"
  on public.token_transactions
  for select
  using (auth.uid() = user_id);
-- Ninguém escreve direto: só as funções abaixo (security definer).

-- ---------- apply_tokens: débito atômico, uma linha, ordem plano→avulso→bônus ----------
-- Tudo-ou-nada: se não houver saldo total suficiente, NÃO debita nada e
-- devolve ok=false com o disponível. Substitui o loop de N chamadas a
-- consume_image_credit.
create or replace function public.apply_tokens(
  p_user_id  uuid,
  p_amount   integer,
  p_kind     text,
  p_ref_type text default null,
  p_ref_id   text default null,
  p_title    text default null,
  p_meta     jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan  integer;
  v_topup integer;
  v_bonus integer;
  v_from_plan  integer := 0;
  v_from_topup integer := 0;
  v_from_bonus integer := 0;
  v_rest integer;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'não autorizado';
  end if;
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', true, 'debited', 0);
  end if;

  select credits, topup_credits, referral_credits
    into v_plan, v_topup, v_bonus
    from public.users
   where id = p_user_id
   for update;

  if v_plan is null then
    return jsonb_build_object('ok', false, 'debited', 0, 'error', 'usuario_inexistente');
  end if;

  v_plan  := greatest(v_plan, 0);
  v_topup := greatest(coalesce(v_topup, 0), 0);
  v_bonus := greatest(coalesce(v_bonus, 0), 0);

  if v_plan + v_topup + v_bonus < p_amount then
    return jsonb_build_object(
      'ok', false, 'debited', 0, 'error', 'saldo_insuficiente',
      'available', v_plan + v_topup + v_bonus,
      'plan', v_plan, 'topup', v_topup, 'bonus', v_bonus
    );
  end if;

  v_rest := p_amount;
  v_from_plan := least(v_plan, v_rest);   v_rest := v_rest - v_from_plan;
  v_from_topup := least(v_topup, v_rest); v_rest := v_rest - v_from_topup;
  v_from_bonus := least(v_bonus, v_rest); v_rest := v_rest - v_from_bonus;

  update public.users
     set credits = credits - v_from_plan,
         -- 'strip_plan' é a gente recolhendo token, não o usuário gastando:
         -- somar aqui faria a barra de "usado no mês" passar de 100%.
         plan_credits_used_this_month = plan_credits_used_this_month
           + case when p_kind = 'strip_plan' then 0 else v_from_plan end,
         topup_credits = topup_credits - v_from_topup,
         referral_credits = referral_credits - v_from_bonus
   where id = p_user_id;

  insert into public.token_transactions
    (user_id, delta, from_plan, from_topup, from_bonus,
     plan_after, topup_after, bonus_after,
     kind, ref_type, ref_id, title, meta)
  values
    (p_user_id, -p_amount, v_from_plan, v_from_topup, v_from_bonus,
     v_plan - v_from_plan, v_topup - v_from_topup, v_bonus - v_from_bonus,
     p_kind, p_ref_type, p_ref_id, p_title, coalesce(p_meta, '{}'::jsonb));

  return jsonb_build_object(
    'ok', true, 'debited', p_amount,
    'from_plan', v_from_plan, 'from_topup', v_from_topup, 'from_bonus', v_from_bonus,
    'plan', v_plan - v_from_plan, 'topup', v_topup - v_from_topup, 'bonus', v_bonus - v_from_bonus
  );
end;
$$;

-- ---------- grant_tokens: entrada em um balde, uma linha ----------
-- bucket = 'plan'  -> RECARGA: zera a sobra (linha expire_plan se houver) e
--                     põe p_amount; plan_credits_monthly e used são atualizados.
-- bucket = 'topup' | 'bonus' -> soma.
create or replace function public.grant_tokens(
  p_user_id  uuid,
  p_amount   integer,
  p_bucket   text,
  p_kind     text,
  p_ref_type text default null,
  p_ref_id   text default null,
  p_title    text default null,
  p_meta     jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan  integer;
  v_topup integer;
  v_bonus integer;
begin
  -- Só service_role (webhooks, jobs, admin). Usuário logado nunca se credita.
  if auth.uid() is not null then
    raise exception 'não autorizado';
  end if;
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'valor_invalido');
  end if;

  -- Trava a linha ANTES de checar a duplicata: o webhook do Asaas é
  -- at-least-once e o job diário pode correr junto. Sem o FOR UPDATE aqui,
  -- dois processos leem "não creditei ainda" ao mesmo tempo.
  select credits, topup_credits, referral_credits
    into v_plan, v_topup, v_bonus
    from public.users
   where id = p_user_id
   for update;
  if v_plan is null then
    return jsonb_build_object('ok', false, 'error', 'usuario_inexistente');
  end if;

  -- Mesma referência já creditada = evento repetido. Devolve ok sem creditar
  -- de novo (o chamador não precisa distinguir; o índice único abaixo é a
  -- rede de segurança se alguém escrever direto).
  if p_ref_id is not null and exists (
    select 1 from public.token_transactions t
     where t.user_id = p_user_id
       and t.kind    = p_kind
       and t.ref_id  = p_ref_id
  ) then
    return jsonb_build_object(
      'ok', true, 'duplicate', true,
      'plan', v_plan, 'topup', v_topup, 'bonus', v_bonus
    );
  end if;
  v_plan  := greatest(v_plan, 0);
  v_topup := greatest(coalesce(v_topup, 0), 0);
  v_bonus := greatest(coalesce(v_bonus, 0), 0);

  if p_bucket = 'plan' then
    if v_plan > 0 then
      insert into public.token_transactions
        (user_id, delta, from_plan, plan_after, topup_after, bonus_after, kind, ref_type, ref_id, title)
      values
        (p_user_id, -v_plan, v_plan, 0, v_topup, v_bonus, 'expire_plan', p_ref_type, p_ref_id,
         'Sobra do plano zerada na renovação');
    end if;
    update public.users
       set credits = p_amount,
           plan_credits_monthly = p_amount,
           plan_credits_used_this_month = 0
     where id = p_user_id;
    v_plan := p_amount;
  elsif p_bucket = 'topup' then
    update public.users set topup_credits = topup_credits + p_amount where id = p_user_id;
    v_topup := v_topup + p_amount;
  elsif p_bucket = 'bonus' then
    update public.users set referral_credits = referral_credits + p_amount where id = p_user_id;
    v_bonus := v_bonus + p_amount;
  else
    return jsonb_build_object('ok', false, 'error', 'balde_invalido');
  end if;

  insert into public.token_transactions
    (user_id, delta, plan_after, topup_after, bonus_after, kind, ref_type, ref_id, title, meta)
  values
    (p_user_id, p_amount, v_plan, v_topup, v_bonus, p_kind, p_ref_type, p_ref_id, p_title,
     coalesce(p_meta, '{}'::jsonb));

  return jsonb_build_object('ok', true, 'plan', v_plan, 'topup', v_topup, 'bonus', v_bonus);
end;
$$;

-- ---------- refund_tokens: estorno de um débito (devolve pro plano) ----------
create or replace function public.refund_tokens(
  p_user_id  uuid,
  p_amount   integer,
  p_ref_type text default null,
  p_ref_id   text default null,
  p_title    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan integer; v_topup integer; v_bonus integer;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'não autorizado';
  end if;
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', true);
  end if;
  -- Trava a linha pra que plan_after saia coerente mesmo com um débito
  -- acontecendo ao mesmo tempo.
  perform 1 from public.users where id = p_user_id for update;
  update public.users
     set credits = credits + p_amount,
         plan_credits_used_this_month = greatest(plan_credits_used_this_month - p_amount, 0)
   where id = p_user_id
  returning credits, topup_credits, referral_credits into v_plan, v_topup, v_bonus;
  if v_plan is null then
    return jsonb_build_object('ok', false, 'error', 'usuario_inexistente');
  end if;
  insert into public.token_transactions
    (user_id, delta, plan_after, topup_after, bonus_after, kind, ref_type, ref_id, title)
  values
    (p_user_id, p_amount, v_plan, coalesce(v_topup,0), coalesce(v_bonus,0), 'refund', p_ref_type, p_ref_id,
     coalesce(p_title, 'Estorno'));
  return jsonb_build_object('ok', true, 'plan', v_plan);
end;
$$;

-- ---------- indicação passa a escrever no extrato ----------
create or replace function public.creditar_indicacao_no_pagamento(
  p_referred_id     uuid,
  p_tokens_referrer integer default 100,
  p_tokens_referred integer default 45
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref record;
  v_tr  integer := least(greatest(coalesce(p_tokens_referrer, 0), 0), 500);
  v_td  integer := least(greatest(coalesce(p_tokens_referred, 0), 0), 500);
begin
  select * into v_ref
    from public.referrals r
   where r.referred_id = p_referred_id
     and r.status = 'pending'
   for update;
  if not found then
    return jsonb_build_object('credited', false);
  end if;

  update public.referrals
     set status = 'qualified', qualified_at = now(),
         tokens_referrer = v_tr, tokens_referred = v_td
   where id = v_ref.id;

  perform public.grant_tokens(v_ref.referrer_id, v_tr, 'bonus', 'grant_referral',
    'referral', v_ref.id::text, 'Bônus: sua indicação assinou');
  perform public.grant_tokens(p_referred_id, v_td, 'bonus', 'grant_referral',
    'referral', v_ref.id::text, 'Bônus de boas-vindas por indicação');

  return jsonb_build_object(
    'credited', true, 'referrer_id', v_ref.referrer_id,
    'tokens_referrer', v_tr, 'tokens_referred', v_td
  );
end;
$$;

-- ---------- trial entra no extrato ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  insert into public.users (id, email, credits, plan_credits_monthly, subscription_status)
  values (new.id, new.email, 45, 45, 'trial')
  on conflict (id) do nothing;

  -- Só registra o trial no extrato se a linha do usuário nasceu AGORA. Com
  -- `on conflict do nothing`, repetir o trigger criaria um "+45" de tokens
  -- que ninguém recebeu. E vai dentro do bloco protegido: extrato é registro,
  -- não pode derrubar um cadastro.
  begin
    if found then
      insert into public.token_transactions
        (user_id, delta, plan_after, topup_after, bonus_after, kind, title)
      values (new.id, 45, 45, 0, 0, 'grant_trial', 'Teste grátis');
    end if;
  exception when others then
    raise warning 'handle_new_user: falha ao registrar o trial no extrato (%)', sqlerrm;
  end;

  begin
    v_code := coalesce(new.raw_user_meta_data->>'ref_code', new.raw_user_meta_data->>'ref');
    if v_code is not null and length(trim(v_code)) > 0 then
      perform public.registrar_indicacao(new.id, v_code);
    end if;
  exception when others then
    raise warning 'handle_new_user: falha ao registrar indicação (%)', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- webhook: idempotência ----------
create table if not exists public.billing_events (
  id          uuid primary key default gen_random_uuid(),
  provider    text not null,
  event_id    text not null,
  event_type  text not null,
  payload     jsonb not null,
  processed   boolean not null default false,
  error       text,
  created_at  timestamptz not null default now(),
  unique (provider, event_id)
);
alter table public.billing_events enable row level security;
-- Sem policies: só service_role lê/escreve.

-- ---------- trancar as colunas de dinheiro ----------
-- A policy `users_update_own` (0003) é `for update using (auth.uid() = id)`
-- SEM restrição de coluna, e o Supabase concede UPDATE em public.users pra
-- `authenticated` por padrão. Ou seja: até aqui, qualquer usuário logado
-- podia dar PATCH /rest/v1/users?id=eq.<ele> com {"credits": 999999,
-- "subscription_status": "active"} e se dar o plano Studio de graça.
--
-- RLS diz QUAIS LINHAS; quem diz QUAIS COLUNAS é o grant. Então o UPDATE
-- passa a valer só nas colunas que o app realmente deixa o dono editar.
-- Saldo, plano e ids de cobrança só mudam por função security definer
-- (apply_tokens, grant_tokens) ou pelo service_role (webhook, job).
revoke update on public.users from authenticated, anon;
grant update (email, trial_used) on public.users to authenticated;

-- ---------- privilégios ----------
revoke all on function public.apply_tokens(uuid, integer, text, text, text, text, jsonb) from public;
revoke all on function public.grant_tokens(uuid, integer, text, text, text, text, text, jsonb) from public;
revoke all on function public.refund_tokens(uuid, integer, text, text, text) from public;
-- ATENÇÃO: refund_tokens NÃO vai pra `authenticated`. A função recebe o valor
-- por parâmetro e só confere que o usuário é ele mesmo, então liberar pro
-- cliente é o mesmo que deixar qualquer um cunhar token via RPC.
grant execute on function public.apply_tokens(uuid, integer, text, text, text, text, jsonb) to authenticated, service_role;
grant execute on function public.refund_tokens(uuid, integer, text, text, text) to service_role;
grant execute on function public.grant_tokens(uuid, integer, text, text, text, text, text, jsonb) to service_role;


-- =====================================================================
-- >>> 0021_afiliados.sql
-- AFILIADOS: candidatura, aprovação, comissões (feature desligada por flag)
-- =====================================================================

-- =====================================================================
-- 0021_afiliados.sql
-- Programa de AFILIADOS (dinheiro). Distinto de "indicação" (0014), que
-- paga em tokens.
--
-- REGRAS (decisão do Marcos, 22/08/2026):
--   * ninguém vira afiliado sozinho: candidatura via formulário, aprovação
--     manual pelo dono (status pending -> approved | rejected);
--   * comissão recorrente em TODA cobrança do cliente indicado
--     (affiliates.commission_pct, padrão 25%);
--   * cookie de atribuição de 60 dias (lib/afiliados/config.ts);
--   * não cumula com a indicação em tokens: a cobrança é atribuída ao
--     afiliado pelo `subscriptions.affiliate_code` (0020), nunca às duas
--     coisas ao mesmo tempo (regra em lib/billing/apply.ts);
--   * pagamento por split do Asaas exige walletId do afiliado; sem wallet a
--     comissão acumula como 'pending' ("a pagar") e o acerto é Pix manual.
--
-- Aditiva e idempotente. NÃO aplicada: rodar manualmente com OK do CEO.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Afiliados
-- ---------------------------------------------------------------------
create table if not exists public.affiliates (
  id              uuid primary key default gen_random_uuid(),
  -- Nulo quando o candidato ainda não tem conta no app (o formulário é
  -- público). Vinculado depois, na aprovação ou no login, pelo e-mail.
  user_id         uuid references public.users(id) on delete set null,
  code            text not null unique,
  status          text not null default 'pending'
    check (status in ('pending','approved','rejected','suspended')),
  name            text not null,
  email           text not null,
  whatsapp        text,
  instagram       text,
  reason          text,
  -- Se pretende investir em anúncios pagos (texto livre: "sim, R$300/mês").
  ads_plan        text,
  -- Onde pretende divulgar (texto livre).
  channels        text,
  commission_pct  numeric(5,2) not null default 25
    check (commission_pct >= 0 and commission_pct <= 100),
  -- walletId da conta Asaas do afiliado. Sem ele não há split: a comissão
  -- fica 'pending' até ser paga por Pix manual.
  asaas_wallet_id text,
  notes           text,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists affiliates_user_id_idx on public.affiliates(user_id);
create index if not exists affiliates_status_idx  on public.affiliates(status);
create index if not exists affiliates_email_idx   on public.affiliates(lower(email));

drop trigger if exists affiliates_set_updated_at on public.affiliates;
create trigger affiliates_set_updated_at
  before update on public.affiliates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2) Clientes indicados por afiliado
--    `user_id` UNIQUE: um cliente pertence a UM afiliado, pra sempre.
-- ---------------------------------------------------------------------
create table if not exists public.affiliate_referrals (
  id              uuid primary key default gen_random_uuid(),
  affiliate_id    uuid not null references public.affiliates(id) on delete cascade,
  user_id         uuid not null unique references public.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  status          text not null default 'active'
    check (status in ('active','canceled')),
  created_at      timestamptz not null default now()
);

create index if not exists affiliate_referrals_affiliate_id_idx
  on public.affiliate_referrals(affiliate_id);

-- ---------------------------------------------------------------------
-- 3) Comissões (uma linha por cobrança confirmada)
--    unique(provider, payment_id) = idempotência do webhook.
-- ---------------------------------------------------------------------
create table if not exists public.affiliate_commissions (
  id               uuid primary key default gen_random_uuid(),
  affiliate_id     uuid not null references public.affiliates(id) on delete cascade,
  user_id          uuid references public.users(id) on delete set null,
  payment_id       text not null,
  provider         text not null,
  gross_value      numeric(10,2) not null default 0,
  net_value        numeric(10,2),
  commission_value numeric(10,2) not null default 0,
  status           text not null default 'pending'
    check (status in ('pending','paid','reversed')),
  paid_at          timestamptz,
  created_at       timestamptz not null default now(),
  unique (provider, payment_id)
);

create index if not exists affiliate_commissions_affiliate_id_idx
  on public.affiliate_commissions(affiliate_id);
create index if not exists affiliate_commissions_status_idx
  on public.affiliate_commissions(status);

-- ---------------------------------------------------------------------
-- 4) RLS: o afiliado lê o que é dele. Ninguém escreve pelo client:
--    candidatura via RPC (security definer), o resto via service_role.
-- ---------------------------------------------------------------------
alter table public.affiliates            enable row level security;
alter table public.affiliate_referrals   enable row level security;
alter table public.affiliate_commissions enable row level security;

drop policy if exists "affiliates_select_own" on public.affiliates;
create policy "affiliates_select_own"
  on public.affiliates for select
  using (auth.uid() = user_id);

drop policy if exists "affiliate_referrals_select_own" on public.affiliate_referrals;
create policy "affiliate_referrals_select_own"
  on public.affiliate_referrals for select
  using (
    exists (
      select 1 from public.affiliates a
      where a.id = affiliate_referrals.affiliate_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "affiliate_commissions_select_own" on public.affiliate_commissions;
create policy "affiliate_commissions_select_own"
  on public.affiliate_commissions for select
  using (
    exists (
      select 1 from public.affiliates a
      where a.id = affiliate_commissions.affiliate_id and a.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 5) Código do afiliado: 8 chars, mesmo alfabeto da indicação (sem
--    0/O/1/I/L), mas checado contra affiliates.code.
-- ---------------------------------------------------------------------
create or replace function public.gerar_codigo_afiliado()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code
        || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from public.affiliates a where a.code = v_code);
  end loop;
  return v_code;
end;
$$;

-- ---------------------------------------------------------------------
-- 6) Candidatura (único caminho de INSERT aberto ao client)
--    Retorna: 'ok' | 'ja_candidato' | 'dados_invalidos'.
--    Funciona logado (p_user_id) ou anônimo (p_user_id null).
-- ---------------------------------------------------------------------
create or replace function public.candidatar_afiliado(
  p_user_id   uuid,
  p_name      text,
  p_email     text,
  p_whatsapp  text,
  p_instagram text,
  p_reason    text,
  p_ads_plan  text,
  p_channels  text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_name  text := trim(coalesce(p_name, ''));
begin
  -- Usuário autenticado só candidata a si mesmo.
  -- Amarrar a candidatura a um user_id só vale pra quem ESTÁ logado, e só a
  -- si mesmo. Chamada anônima com user_id preenchido é tentativa de plantar
  -- uma candidatura na conta de outra pessoa: ignora o vínculo, não recusa.
  if auth.uid() is null then
    p_user_id := null;
  elsif p_user_id is not null and auth.uid() <> p_user_id then
    raise exception 'não autorizado';
  end if;

  if length(v_name) < 2 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return 'dados_invalidos';
  end if;

  if exists (
    select 1 from public.affiliates a
    where a.status in ('pending','approved')
      and (lower(a.email) = v_email or (p_user_id is not null and a.user_id = p_user_id))
  ) then
    return 'ja_candidato';
  end if;

  insert into public.affiliates (
    user_id, code, status, name, email, whatsapp, instagram, reason, ads_plan, channels
  ) values (
    p_user_id,
    public.gerar_codigo_afiliado(),
    'pending',
    v_name,
    v_email,
    nullif(trim(coalesce(p_whatsapp, '')), ''),
    nullif(trim(coalesce(p_instagram, '')), ''),
    nullif(trim(coalesce(p_reason, '')), ''),
    nullif(trim(coalesce(p_ads_plan, '')), ''),
    nullif(trim(coalesce(p_channels, '')), '')
  );

  return 'ok';
end;
$$;

revoke all on function public.gerar_codigo_afiliado() from public;
grant execute on function public.candidatar_afiliado(uuid, text, text, text, text, text, text, text)
  to anon, authenticated, service_role;
