-- =====================================================================
-- 0004_credit_functions.sql
-- Funcoes atomicas de consumo e estorno de creditos.
-- consume_image_credit usa SELECT ... FOR UPDATE para serializar
-- chamadas concorrentes do mesmo usuario e evitar gastar credito a mais.
-- =====================================================================

create or replace function public.consume_image_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits integer;
begin
  select credits
    into v_credits
    from public.users
   where id = p_user_id
   for update;

  if v_credits is null then
    return false;
  end if;

  if v_credits <= 0 then
    return false;
  end if;

  update public.users
     set credits = credits - 1,
         plan_credits_used_this_month = plan_credits_used_this_month + 1
   where id = p_user_id;

  return true;
end;
$$;

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

-- Privilegios: revoga tudo de PUBLIC e concede execucao apenas a roles
-- que precisam (authenticated chama via RPC; service_role para webhooks).
revoke all on function public.consume_image_credit(uuid) from public;
revoke all on function public.refund_image_credit(uuid)  from public;

grant execute on function public.consume_image_credit(uuid) to authenticated, service_role;
grant execute on function public.refund_image_credit(uuid)  to authenticated, service_role;
