-- =====================================================================
-- 0022_fecha_furo_rpc.sql
-- CORREÇÃO URGENTE de um furo aberto pela 0020 (mesmo dia, 22/08/2026).
--
-- O QUE ACONTECEU: as funções usavam `auth.uid() is null` como se isso
-- significasse "chamada pelo service_role". NÃO significa: a chave ANÔNIMA
-- também tem auth.uid() null, e essa chave vai no bundle do browser, ou
-- seja, é pública. Qualquer visitante podia chamar grant_tokens e
-- refund_tokens e se dar tokens à vontade. Confirmado na prática contra o
-- banco de produção antes desta correção.
--
-- Segundo erro: `revoke ... from public` não bastava. O Supabase concede
-- EXECUTE em função nova para `anon` e `authenticated` via DEFAULT
-- PRIVILEGES, e default privilege não é herança de PUBLIC. Tem que revogar
-- desses dois papéis pelo nome. E como `create or replace` reaplica o
-- default, o revoke tem que vir DEPOIS de recriar a função.
--
-- A GUARDA CERTA é o papel do JWT (auth.role()), nunca a ausência de uid:
--   service_role  -> pode conceder, estornar e debitar
--   authenticated -> só debita, e só a si mesmo
--   anon          -> nada
-- =====================================================================

-- ---------- 1) guarda por PAPEL dentro das funções ----------
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
  v_role  text := coalesce(auth.role(), 'anon');
begin
  -- SÓ service_role concede token.
  if v_role <> 'service_role' then
    raise exception 'não autorizado';
  end if;
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'valor_invalido');
  end if;

  select credits, topup_credits, referral_credits
    into v_plan, v_topup, v_bonus
    from public.users
   where id = p_user_id
   for update;
  if v_plan is null then
    return jsonb_build_object('ok', false, 'error', 'usuario_inexistente');
  end if;

  if p_ref_id is not null and exists (
    select 1 from public.token_transactions t
     where t.user_id = p_user_id and t.kind = p_kind and t.ref_id = p_ref_id
  ) then
    return jsonb_build_object('ok', true, 'duplicate', true,
      'plan', v_plan, 'topup', v_topup, 'bonus', v_bonus);
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
       set credits = p_amount, plan_credits_monthly = p_amount, plan_credits_used_this_month = 0
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
  v_plan integer;
  v_topup integer;
  v_bonus integer;
  v_role text := coalesce(auth.role(), 'anon');
begin
  -- Estorno é operação de servidor: o valor vem por parâmetro, então liberar
  -- pro cliente é o mesmo que deixar cunhar token.
  if v_role <> 'service_role' then
    raise exception 'não autorizado';
  end if;
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', true);
  end if;
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
  v_role text := coalesce(auth.role(), 'anon');
begin
  -- Débito pode vir do servidor OU do usuário logado, e só sobre ele mesmo.
  -- anon nunca: a chave anônima é pública.
  if v_role = 'service_role' then
    null;
  elsif v_role = 'authenticated' and auth.uid() = p_user_id then
    null;
  else
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
    return jsonb_build_object('ok', false, 'debited', 0, 'error', 'saldo_insuficiente',
      'available', v_plan + v_topup + v_bonus,
      'plan', v_plan, 'topup', v_topup, 'bonus', v_bonus);
  end if;

  v_rest := p_amount;
  v_from_plan := least(v_plan, v_rest);   v_rest := v_rest - v_from_plan;
  v_from_topup := least(v_topup, v_rest); v_rest := v_rest - v_from_topup;
  v_from_bonus := least(v_bonus, v_rest); v_rest := v_rest - v_from_bonus;

  update public.users
     set credits = credits - v_from_plan,
         plan_credits_used_this_month = plan_credits_used_this_month
           + case when p_kind = 'strip_plan' then 0 else v_from_plan end,
         topup_credits = topup_credits - v_from_topup,
         referral_credits = referral_credits - v_from_bonus
   where id = p_user_id;

  insert into public.token_transactions
    (user_id, delta, from_plan, from_topup, from_bonus,
     plan_after, topup_after, bonus_after, kind, ref_type, ref_id, title, meta)
  values
    (p_user_id, -p_amount, v_from_plan, v_from_topup, v_from_bonus,
     v_plan - v_from_plan, v_topup - v_from_topup, v_bonus - v_from_bonus,
     p_kind, p_ref_type, p_ref_id, p_title, coalesce(p_meta, '{}'::jsonb));

  return jsonb_build_object('ok', true, 'debited', p_amount,
    'from_plan', v_from_plan, 'from_topup', v_from_topup, 'from_bonus', v_from_bonus,
    'plan', v_plan - v_from_plan, 'topup', v_topup - v_from_topup, 'bonus', v_bonus - v_from_bonus);
end;
$$;

-- ---------- 2) revogar DEPOIS de recriar (create or replace reaplica o default) ----------
revoke execute on function public.grant_tokens(uuid, integer, text, text, text, text, text, jsonb) from anon, authenticated, public;
revoke execute on function public.refund_tokens(uuid, integer, text, text, text) from anon, authenticated, public;
revoke execute on function public.apply_tokens(uuid, integer, text, text, text, text, jsonb) from anon, public;

grant execute on function public.grant_tokens(uuid, integer, text, text, text, text, text, jsonb) to service_role;
grant execute on function public.refund_tokens(uuid, integer, text, text, text) to service_role;
grant execute on function public.apply_tokens(uuid, integer, text, text, text, text, jsonb) to authenticated, service_role;
