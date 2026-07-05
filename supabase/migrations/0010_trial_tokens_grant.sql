-- =====================================================================
-- 0010_trial_tokens_grant.sql
-- Sistema de TOKENS (ver ESTRATEGIA-MONETIZACAO.md §5).
--
-- Ao criar um usuário novo, concede o TESTE GRÁTIS em tokens:
--   - credits = 40                     (PLAN_TOKENS.trial em lib/tokens.ts)
--   - plan_credits_monthly = 40
--   - subscription_status = 'trial'
--
-- Trial = 1 carrossel de até 7 slides, só imagem NORMAL, com marca d'água.
-- Nano Banana Pro fica bloqueado no trial (gate server-side em lib/tokens.ts).
--
-- ADITIVO e NÃO-QUEBRANTE: apenas atualiza o valor do grant no trigger
-- já existente (0002_trigger_new_user.sql). Usuários antigos não são
-- afetados. Se a coluna `credits` default (2) for lida em algum lugar,
-- continua funcionando — aqui só sobrescrevemos no insert do trigger.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, credits, plan_credits_monthly, subscription_status)
  values (new.id, new.email, 40, 40, 'trial')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger já existe (0002); recriamos por segurança/idempotência.
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
