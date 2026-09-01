-- =====================================================================
-- 0027_atribuicao_primeiro_toque.sql
-- O middleware (nx_ft) carimba o primeiro hit do visitante com UTMs, click
-- ids, referrer e landing page (90 dias, cookie legível no client). Esta
-- migration dá lugar pra esse carimbo sobreviver ao cadastro: a coluna
-- guarda a origem real de aquisição, escrita uma única vez.
--
-- Aditiva e idempotente. Pode rodar em produção sem downtime.
-- =====================================================================

alter table public.users
  add column if not exists first_touch jsonb;

comment on column public.users.first_touch is
  'Origem de aquisição carimbada no cadastro (utm_*, gclid, fbclid, '
  'referrer, landing_page, ts), vinda do cookie nx_ft do middleware. '
  'Imutável: gravada uma vez (trigger ou vínculo pós-OAuth) e nunca mais '
  'sobrescrita. Sem grant de update pra authenticated de propósito: '
  'atribuição não pode ser forjada depois do fato.';

-- ---------- handle_new_user: mesma versão da 0020, + first_touch ----------
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

  -- Primeiro toque: só grava se veio um objeto de verdade no metadata (o
  -- cadastro por e-mail manda; o Google não passa por aqui, vincula depois
  -- via vincularPrimeiroToquePeloCookie). Bloco isolado: atribuição é
  -- estatística, nunca pode derrubar o cadastro.
  begin
    if jsonb_typeof(new.raw_user_meta_data->'first_touch') = 'object' then
      update public.users
         set first_touch = new.raw_user_meta_data->'first_touch'
       where id = new.id
         and first_touch is null;
    end if;
  exception when others then
    raise warning 'handle_new_user: falha ao registrar primeiro toque (%)', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sem grant de update em first_touch pra authenticated: a coluna é escrita
-- só pelo trigger (security definer) ou pelo service_role (vínculo pós-OAuth).
-- O revoke amplo já vem da 0020; esta migration não abre exceção nenhuma.
