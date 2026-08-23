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
