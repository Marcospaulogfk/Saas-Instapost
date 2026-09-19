-- =====================================================================
-- 0031_assinatura_prepaga.sql
-- "Até quando este plano já está pago" vira um campo, em vez de um acordo
-- que só existe na cabeça de quem vendeu.
--
-- POR QUE (diagnóstico de 19/09/2026):
--   O primeiro cliente pagou um ano adiantado numa assinatura montada à mão,
--   fora do provedor. A conta nasceu sem `plan_renews_at`, e o job diário
--   (runRenewalSweep) só enxerga quem TEM data de renovação. Resultado: um
--   cliente que pagou ficou dois meses sem receber ficha nenhuma.
--   Pior: preencher só a data NÃO resolvia, porque o único ramo que credita
--   exige `sub.status === 'active'` vindo do provedor. Sem assinatura no
--   provedor, o job caía no ramo de baixo e REBAIXAVA a conta.
--
--   O mesmo buraco pega o ciclo ANUAL de qualquer cliente: no pagamento o
--   código empurrava `plan_renews_at` 12 meses pra frente e concedia o grant
--   UMA vez, então quem comprava anual recebia 1.000 fichas para o ano
--   inteiro em vez de 1.000 por mês. Um doze avos do prometido.
--
-- O QUE ESTA COLUNA SIGNIFICA:
--   `plan_prepaid_until` = a data até a qual o período JÁ ESTÁ PAGO.
--   Enquanto ela não passa, o job recarrega o plano todo mês SEM precisar
--   perguntar nada ao provedor, porque o dinheiro já entrou. Depois dela, a
--   conta volta ao fluxo normal: com provedor, ele decide; sem provedor, a
--   assinatura acaba e a conta vira trial (sem apagar extrato nem peças).
--
--   Ela NÃO é "assinatura ativa eterna": é justamente o contrário, é o
--   carimbo de quando o pago termina. E não substitui `plan_renews_at`, que
--   continua sendo "quando cai a próxima recarga de fichas".
--
-- COMO O JOB USA (lib/billing/apply.ts → runRenewalSweep):
--   mensal no provedor  → plan_prepaid_until = plan_renews_at, então o ramo
--                         pré-pago nunca dispara e nada muda pra quem já
--                         existe (coluna nula = comportamento de hoje).
--   anual no provedor   → plan_prepaid_until = fim do ano pago e
--                         plan_renews_at = daqui a um mês: 12 recargas.
--   pré-pago sem provedor → igual ao anual, só que quem preenche é a gente.
--
-- ADITIVA: nenhuma coluna existente muda de semântica, e conta antiga fica
-- com NULL, que o job trata como "não é pré-paga" (o fluxo de sempre).
-- =====================================================================

alter table public.users
  add column if not exists plan_prepaid_until timestamptz;

comment on column public.users.plan_prepaid_until is
  'Data até a qual o plano JÁ ESTÁ PAGO. Enquanto não passa, o job diário '
  'recarrega as fichas do plano todo mês sem consultar o provedor (o dinheiro '
  'já entrou): serve tanto pro ciclo anual quanto pra assinatura montada à mão '
  'e paga adiantada. Depois dela o job para de recarregar; sem provedor, a '
  'conta vira trial sem apagar extrato nem peças. NULL = conta normal, '
  'comportamento de sempre. Não confundir com plan_renews_at, que é quando '
  'cai a PRÓXIMA recarga.';

-- Quem o job precisa achar rápido: pré-pagos ainda dentro do período.
create index if not exists users_plan_prepaid_until_idx
  on public.users(plan_prepaid_until)
  where plan_prepaid_until is not null;
