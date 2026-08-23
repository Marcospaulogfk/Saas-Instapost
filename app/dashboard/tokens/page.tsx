// =====================================================================
// /dashboard/tokens
// A página que não existia: UMA fonte de saldo (três baldes), tabela de
// preços em tokens (de lib/tokens.ts, nunca texto solto), extrato
// (token_transactions), consumo do mês e gestão da assinatura por dentro
// do app. Substitui os 3 lugares que mostravam saldo de jeitos diferentes.
// Ver TOKENS-INDICACAO-AFILIADOS-rev3.docx §7.
// =====================================================================

import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Gift,
  Layers,
  Receipt,
  ShoppingBag,
  Sparkles,
  Wallet,
} from "lucide-react"
import { getProfile, tokensDisponiveis } from "@/lib/data/queries"
import { TOKEN_COST, tokenCostForCarousel, tokenCostForSinglePost } from "@/lib/tokens"
import { CYCLE_INFO, PLAN_LABEL, priceFor, isPaidPlan, isBillingCycle } from "@/lib/billing/plans"
import { INDICACAO_HABILITADA, AFILIADOS_HABILITADO } from "@/lib/features"
import { getConsumoDoMes, getExtrato, KIND_LABEL, linkDaPeca } from "@/lib/extrato/queries"
import { BotaoCancelar, FiltroMes, LinkPlanos } from "./tokens-client"


export const metadata: Metadata = { title: "Tokens e plano" }

const fmt = (n: number) => n.toLocaleString("pt-BR")
const data = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })

function Balde({
  icone: Icone,
  tile,
  valor,
  rotulo,
  sub,
}: {
  icone: typeof Coins
  tile: string
  valor: string
  rotulo: string
  sub?: string
}) {
  return (
    <div className="nv-card nv-fade flex items-center gap-3 p-4">
      <span className={`nv-tile ${tile} h-10 w-10 shrink-0`}>
        <Icone className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="text-[20px] font-bold leading-none tabular-nums" style={{ color: "var(--nv-text)" }}>
          {valor}
        </p>
        <p className="mt-1 text-[11.5px]" style={{ color: "var(--nv-text-subtle)" }}>
          {rotulo}
          {sub ? ` · ${sub}` : ""}
        </p>
      </div>
    </div>
  )
}

export default async function TokensPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; checkout?: string }>
}) {
  const sp = await searchParams
  const [{ profile }, extrato, consumo] = await Promise.all([
    getProfile(),
    getExtrato({ mes: sp.mes ?? null }),
    getConsumoDoMes(),
  ])

  const plano = Math.max(0, profile?.credits ?? 0)
  const avulso = Math.max(0, profile?.topup_credits ?? 0)
  const bonus = Math.max(0, profile?.referral_credits ?? 0)
  const total = tokensDisponiveis(profile)
  const grant = profile?.plan_credits_monthly ?? 0
  const usados = Math.max(0, profile?.plan_credits_used_this_month ?? 0)
  const pct = grant > 0 ? Math.min(100, Math.round((usados / grant) * 100)) : 0

  const status = profile?.subscription_status ?? "trial"
  const planId = isPaidPlan(profile?.plan_id) ? profile!.plan_id! : null
  const cycle = isBillingCycle(profile?.plan_cycle) ? profile!.plan_cycle! : null
  // Clientes marcados à mão (antes da cobrança existir) são ativos sem
  // plan_id/ciclo: tratados como ativos, só sem as linhas de cobrança.
  const ativo = status === "active"
  const comCobranca = ativo && Boolean(planId) && Boolean(cycle)
  const renovaEm = profile?.plan_renews_at ?? null
  const nomePlano =
    status === "active"
      ? planId
        ? PLAN_LABEL[planId]
        : grant >= 3000
          ? "Studio"
          : grant >= 1000
            ? "Pro"
            : "Starter"
      : PLAN_LABEL.trial
  const statusLabel: Record<string, string> = {
    active: "Ativo",
    trial: "Teste grátis",
    past_due: "Pagamento em atraso",
    canceled: "Cancelado",
    incomplete: "Incompleto",
  }

  // Meses disponíveis no filtro: 6 últimos.
  const agora = new Date()
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })

  const precos: { peca: string; tokens: string; nota?: string }[] = [
    { peca: "Carrossel: roteiro + legenda", tokens: String(TOKEN_COST.textOnly) },
    { peca: "Imagem de capa do carrossel", tokens: String(TOKEN_COST.imageCover) },
    { peca: "Imagem de slide do miolo", tokens: `${TOKEN_COST.imageSlide} cada` },
    {
      peca: "Carrossel de 7 slides com capa",
      tokens: String(tokenCostForCarousel(7, { cover: true, slides: false })),
      nota: "roteiro + capa",
    },
    {
      peca: "Carrossel de 7 slides completo",
      tokens: String(tokenCostForCarousel(7, { cover: true, slides: true })),
      nota: "roteiro + capa + 6 imagens",
    },
    { peca: "Post único (texto + arte)", tokens: String(tokenCostForSinglePost()) },
    { peca: "Edição da arte do post único", tokens: String(TOKEN_COST.editBitmap) },
    { peca: "Pautas (após 3 grátis por dia)", tokens: String(TOKEN_COST.ideas) },
    { peca: "Editar no editor", tokens: "grátis", nota: "sempre, sem limite" },
  ]

  const consumoItens = [
    { nome: "Carrosséis", v: consumo.carrossel },
    { nome: "Posts únicos", v: consumo.postUnico },
    { nome: "Imagens e edições", v: consumo.imagens },
    { nome: "Pautas", v: consumo.pautas },
    { nome: "Outros", v: consumo.outros },
  ].filter((i) => i.v > 0)

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6 pb-24 lg:p-8 lg:pb-8">
      {/* Cabeçalho */}
      <div>
        <div className="mb-2 flex items-center gap-3">
          <span className="nv-tile nv-tile-blue h-10 w-10">
            <Coins className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <h1 className="text-2xl font-bold" style={{ color: "var(--nv-text)" }}>
            Tokens e plano
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--nv-text-muted)" }}>
          Um token é uma unidade de trabalho da IA. Texto é barato, imagem é cara, editar é
          grátis. O plano recarrega todo mês; bônus de indicação e tokens avulsos não vencem.
        </p>
      </div>

      {sp.checkout === "ok" && (
        <div className="nv-card nv-fade p-4 text-[12.5px]" style={{ color: "#62e29a" }}>
          Pagamento recebido. Assim que o provedor confirmar (Pix cai na hora, cartão em
          instantes) seus tokens do plano aparecem aqui e no topo.
        </div>
      )}
      {status === "past_due" && (
        <div className="nv-card nv-fade p-4 text-[12.5px]" style={{ color: "#f6c35a" }}>
          Seu último pagamento não foi confirmado. Você tem 5 dias de carência; depois o
          plano volta ao teste grátis (bônus e avulsos ficam).
        </div>
      )}

      {/* Saldo: três baldes + total */}
      <div className="nv-upgrade nv-fade p-5">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--nv-text-subtle)" }}>
              Disponível agora
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums" style={{ color: "var(--nv-text)" }}>
              {fmt(total)} <span className="text-base font-normal" style={{ color: "var(--nv-text-muted)" }}>tokens</span>
            </p>
            {grant > 0 && (
              <p className="mt-2 text-[12px]" style={{ color: "var(--nv-text-muted)" }}>
                Plano: {fmt(usados)} de {fmt(grant)} usados neste ciclo ({pct}%)
                {renovaEm ? ` · renova em ${data(renovaEm)}` : ""}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {ativo ? <LinkPlanos>Mudar de plano</LinkPlanos> : <LinkPlanos>Assinar um plano</LinkPlanos>}
            {INDICACAO_HABILITADA && (
              <Link href="/dashboard/indicacao" className="nv-btn-ghost inline-flex h-9 items-center rounded-lg px-3 text-[12.5px]">
                Indicar e ganhar
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Balde
          icone={Layers}
          tile="nv-tile-blue"
          valor={fmt(plano)}
          rotulo="Do plano"
          sub={renovaEm ? `renova ${data(renovaEm)}` : "zera na renovação"}
        />
        <Balde icone={ShoppingBag} tile="nv-tile-orange" valor={fmt(avulso)} rotulo="Avulsos" sub="não vencem" />
        <Balde icone={Gift} tile="nv-tile-purple" valor={fmt(bonus)} rotulo="Bônus de indicação" sub="não vencem" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Plano */}
        <section className="nv-card nv-fade p-5 lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4" style={{ color: "var(--nv-text-subtle)" }} />
            <h2 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: "var(--nv-text-subtle)" }}>
              Plano
            </h2>
          </div>
          <p className="text-xl font-bold" style={{ color: "var(--nv-text)" }}>
            {nomePlano}
          </p>
          <dl className="mt-3 space-y-1.5 text-[12.5px]">
            <div className="flex justify-between">
              <dt style={{ color: "var(--nv-text-muted)" }}>Status</dt>
              <dd style={{ color: "var(--nv-text)" }}>{statusLabel[status] ?? status}</dd>
            </div>
            {comCobranca && (
              <>
                <div className="flex justify-between">
                  <dt style={{ color: "var(--nv-text-muted)" }}>Ciclo</dt>
                  <dd style={{ color: "var(--nv-text)" }}>
                    {cycle === "annual" ? "Anual" : "Mensal"} · R$ {priceFor(planId!, cycle!).total}
                    {cycle === "annual" ? "/ano" : "/mês"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt style={{ color: "var(--nv-text-muted)" }}>Próxima cobrança</dt>
                  <dd style={{ color: "var(--nv-text)" }}>{renovaEm ? data(renovaEm) : "a confirmar"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt style={{ color: "var(--nv-text-muted)" }}>Tokens por mês</dt>
                  <dd style={{ color: "var(--nv-text)" }}>{fmt(grant)}</dd>
                </div>
              </>
            )}
            {ativo && !comCobranca && (
              <div className="flex justify-between">
                <dt style={{ color: "var(--nv-text-muted)" }}>Tokens por mês</dt>
                <dd style={{ color: "var(--nv-text)" }}>{fmt(grant)}</dd>
              </div>
            )}
            {!ativo && (
              <p className="pt-1" style={{ color: "var(--nv-text-muted)" }}>
                No teste grátis você tem {fmt(grant || 45)} tokens uma vez. Assine pra recarregar todo
                mês; o anual sai {Math.round(CYCLE_INFO.annual.discount * 100)}% mais barato com os
                mesmos tokens.
              </p>
            )}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {comCobranca && profile?.billing_subscription_id && <BotaoCancelar renovaEm={renovaEm} />}
            {AFILIADOS_HABILITADO && (
              <Link href="/dashboard/afiliados" className="nv-btn-ghost inline-flex h-9 items-center rounded-lg px-3 text-[12.5px]">
                Seja afiliado
              </Link>
            )}
          </div>
        </section>

        {/* Tabela de preços */}
        <section className="nv-card nv-fade p-5 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--nv-text-subtle)" }} />
            <h2 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: "var(--nv-text-subtle)" }}>
              Quanto custa cada peça
            </h2>
          </div>
          <ul className="divide-y" style={{ borderColor: "var(--nv-border)" }}>
            {precos.map((l) => (
              <li key={l.peca} className="flex items-baseline justify-between gap-3 py-2 text-[12.5px]">
                <span style={{ color: "var(--nv-text)" }}>
                  {l.peca}
                  {l.nota && (
                    <span className="ml-2 text-[11px]" style={{ color: "var(--nv-text-subtle)" }}>
                      {l.nota}
                    </span>
                  )}
                </span>
                <span
                  className="shrink-0 font-mono tabular-nums"
                  style={{ color: l.tokens === "grátis" ? "#62e29a" : "var(--nv-text)" }}
                >
                  {l.tokens}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Consumo do mês */}
      {consumo.total > 0 && (
        <section className="nv-card nv-fade p-5">
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wider" style={{ color: "var(--nv-text-subtle)" }}>
            Consumo deste mês · {fmt(consumo.total)} tokens
          </h2>
          <div className="space-y-2">
            {consumoItens.map((i) => (
              <div key={i.nome} className="flex items-center gap-3 text-[12.5px]">
                <span className="w-36 shrink-0" style={{ color: "var(--nv-text-muted)" }}>
                  {i.nome}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.round((i.v / consumo.total) * 100)}%`, background: "var(--nv-brand)" }}
                  />
                </span>
                <span className="w-14 shrink-0 text-right font-mono tabular-nums" style={{ color: "var(--nv-text)" }}>
                  {fmt(i.v)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Extrato */}
      <section className="nv-card nv-fade p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4" style={{ color: "var(--nv-text-subtle)" }} />
            <h2 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: "var(--nv-text-subtle)" }}>
              Extrato
            </h2>
          </div>
          <FiltroMes atual={sp.mes ?? null} opcoes={meses} />
        </div>

        {extrato.indisponivel ? (
          <p className="py-6 text-center text-[12.5px]" style={{ color: "var(--nv-text-muted)" }}>
            O extrato ainda não está ativo nesta conta.
          </p>
        ) : extrato.linhas.length === 0 ? (
          <p className="py-6 text-center text-[12.5px]" style={{ color: "var(--nv-text-muted)" }}>
            Nenhuma movimentação {sp.mes ? "neste mês" : "ainda"}. Cada peça gerada vira uma linha aqui.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider" style={{ color: "var(--nv-text-subtle)" }}>
                  <th className="py-2 pr-3 font-semibold">Data</th>
                  <th className="py-2 pr-3 font-semibold">Peça</th>
                  <th className="py-2 pr-3 font-semibold">Tipo</th>
                  <th className="py-2 pr-3 text-right font-semibold">Tokens</th>
                  <th className="py-2 text-right font-semibold">Saldo depois</th>
                </tr>
              </thead>
              <tbody>
                {extrato.linhas.map((l) => {
                  const link = linkDaPeca(l)
                  const entrada = l.delta > 0
                  const saldo = l.plan_after + l.topup_after + l.bonus_after
                  const balde =
                    l.delta < 0
                      ? [l.from_plan > 0 && "plano", l.from_topup > 0 && "avulso", l.from_bonus > 0 && "bônus"]
                          .filter(Boolean)
                          .join(" + ")
                      : ""
                  return (
                    <tr key={l.id} className="border-t" style={{ borderColor: "var(--nv-border)" }}>
                      <td className="py-2 pr-3 tabular-nums" style={{ color: "var(--nv-text-muted)" }}>
                        {data(l.created_at)}
                      </td>
                      <td className="py-2 pr-3" style={{ color: "var(--nv-text)" }}>
                        {link ? (
                          <Link href={link} className="hover:underline">
                            {l.title ?? KIND_LABEL[l.kind] ?? l.kind}
                          </Link>
                        ) : (
                          l.title ?? KIND_LABEL[l.kind] ?? l.kind
                        )}
                      </td>
                      <td className="py-2 pr-3" style={{ color: "var(--nv-text-subtle)" }}>
                        {KIND_LABEL[l.kind] ?? l.kind}
                        {balde ? ` · ${balde}` : ""}
                      </td>
                      <td
                        className="py-2 pr-3 text-right font-mono tabular-nums"
                        style={{ color: entrada ? "#62e29a" : "var(--nv-text)" }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {entrada ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                          {entrada ? "+" : ""}
                          {fmt(l.delta)}
                        </span>
                      </td>
                      <td className="py-2 text-right font-mono tabular-nums" style={{ color: "var(--nv-text-muted)" }}>
                        {fmt(saldo)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
