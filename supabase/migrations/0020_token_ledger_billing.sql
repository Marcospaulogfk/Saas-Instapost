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
