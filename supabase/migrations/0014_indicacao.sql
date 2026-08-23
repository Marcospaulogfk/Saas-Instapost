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
