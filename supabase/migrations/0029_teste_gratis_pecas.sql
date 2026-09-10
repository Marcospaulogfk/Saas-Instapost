-- =====================================================================
-- 0029_teste_gratis_pecas.sql
-- REGRA DO TESTE GRÁTIS POR PEÇA (decisão do Marcos, 10/09/2026).
--
-- A conta grátis gera UM carrossel de até 5 slides OU até 3 posts únicos.
-- Depois disso, aviso de upgrade.
--
-- Por que contador e não tokens calibrados: tokens são UM saldo, e a regra
-- tem dois caminhos com custos muito diferentes (3 posts = 87 tokens pela
-- tabela; 1 carrossel de 5 = 36). Qualquer saldo que pague os 3 posts paga
-- 2 carrosséis; qualquer saldo que barre o 2º carrossel barra o 2º post.
-- Não existe número que expresse "um OU outro". Um contador expressa.
--
-- Unidades: carrossel vale 3, post único vale 1, teto 3. Isso é exatamente
-- "1 carrossel OU 3 posts": 2 carrosséis = 6, 1 post + 1 carrossel = 4,
-- tudo acima do teto.
--
-- Contas NOVAS: vale pra quem nasceu a partir de 10/09/2026. Quem já estava
-- no teste antes segue com a regra antiga (45 tokens), sem mudança de
-- contrato no meio do caminho. Assinante ativo e quem tem saldo comprado
-- (avulso) ou ganho (bônus) ficam fora: o grátis só governa quem não pagou.
--
-- Corrida: dois cliques simultâneos (ou dois carrosséis disparados em
-- paralelo de propósito) passam pelo `for update` na linha do usuário, então
-- a contagem e o insert acontecem um de cada vez. O segundo vê o primeiro.
--
-- Aditiva: tabela e funções NOVAS. Nenhuma função existente é alterada
-- (handle_new_user e apply_tokens ficam como estão).
-- =====================================================================

create table if not exists public.trial_pecas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  tipo       text not null check (tipo in ('carrossel', 'post_unico')),
  -- Qual rota consumiu a peça. Serve pra auditoria ("de onde veio?"), não
  -- entra na conta.
  origem     text,
  created_at timestamptz not null default now()
);

create index if not exists trial_pecas_user_id_idx on public.trial_pecas(user_id);

comment on table public.trial_pecas is
  'Peças consumidas do teste grátis (contas criadas a partir de 10/09/2026). '
  'Carrossel vale 3 unidades, post único 1, teto 3: 1 carrossel OU 3 posts. '
  'Escrita só pelas RPCs reservar_peca_teste / liberar_peca_teste.';

alter table public.trial_pecas enable row level security;

drop policy if exists "trial_pecas_select_own" on public.trial_pecas;
create policy "trial_pecas_select_own"
  on public.trial_pecas for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- reservar_peca_teste: decide e registra numa transação só.
-- Devolve:
--   { ok: true,  no_teste: false }                 fora da regra, segue livre
--   { ok: true,  no_teste: true, id, restante }    peça reservada
--   { ok: false, no_teste: true, erro: 'teste_esgotado', carrosseis, posts }
-- Guarda por PAPEL (auth.role()), nunca por uid nulo: a chave anônima também
-- tem uid nulo (lição da 0022).
-- ---------------------------------------------------------------------
create or replace function public.reservar_peca_teste(
  p_user_id uuid,
  p_tipo    text,
  p_origem  text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role       text := coalesce(auth.role(), 'anon');
  v_criado     timestamptz;
  v_status     text;
  v_topup      integer;
  v_bonus      integer;
  v_carrosseis integer;
  v_posts      integer;
  v_usado      integer;
  v_custo      integer;
  v_id         uuid;
begin
  if v_role <> 'service_role' then
    raise exception 'não autorizado';
  end if;
  if p_tipo not in ('carrossel', 'post_unico') then
    return jsonb_build_object('ok', false, 'erro', 'tipo_invalido');
  end if;

  select created_at, subscription_status,
         coalesce(topup_credits, 0), coalesce(referral_credits, 0)
    into v_criado, v_status, v_topup, v_bonus
    from public.users
   where id = p_user_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'erro', 'usuario_inexistente');
  end if;

  if v_criado < timestamptz '2026-09-10 00:00:00-03'
     or v_status = 'active'
     or v_topup > 0
     or v_bonus > 0 then
    return jsonb_build_object('ok', true, 'no_teste', false);
  end if;

  select count(*) filter (where tipo = 'carrossel'),
         count(*) filter (where tipo = 'post_unico')
    into v_carrosseis, v_posts
    from public.trial_pecas
   where user_id = p_user_id;

  v_usado := v_carrosseis * 3 + v_posts;
  v_custo := case when p_tipo = 'carrossel' then 3 else 1 end;

  if v_usado + v_custo > 3 then
    return jsonb_build_object(
      'ok', false, 'no_teste', true, 'erro', 'teste_esgotado',
      'carrosseis', v_carrosseis, 'posts', v_posts
    );
  end if;

  insert into public.trial_pecas (user_id, tipo, origem)
  values (p_user_id, p_tipo, p_origem)
  returning id into v_id;

  return jsonb_build_object(
    'ok', true, 'no_teste', true, 'id', v_id,
    'restante', 3 - v_usado - v_custo
  );
end;
$$;

-- ---------------------------------------------------------------------
-- liberar_peca_teste: devolve a peça quando a geração falhou DEPOIS da
-- reserva. Sem isso, um erro nosso (IA fora do ar) queimaria o teste do
-- usuário sem entregar nada.
-- ---------------------------------------------------------------------
create or replace function public.liberar_peca_teste(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), 'anon') <> 'service_role' then
    raise exception 'não autorizado';
  end if;
  delete from public.trial_pecas where id = p_id;
end;
$$;

-- Revoga pelos NOMES e DEPOIS do create or replace (lição da 0022: o
-- Supabase concede por default privileges, e `from public` não tira de
-- anon/authenticated).
revoke execute on function public.reservar_peca_teste(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.liberar_peca_teste(uuid) from public, anon, authenticated;
grant execute on function public.reservar_peca_teste(uuid, text, text) to service_role;
grant execute on function public.liberar_peca_teste(uuid) to service_role;
