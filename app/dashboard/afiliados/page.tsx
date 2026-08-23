// =====================================================================
// /dashboard/afiliados: painel do AFILIADO (dinheiro).
//
// Três estados: aprovado (painel completo), em análise (candidatura
// pendente) e sem candidatura (CTA pro formulário, pré-preenchido).
// 404 com a flag desligada (lib/features.ts), igual ao /indicacao.
// =====================================================================

import Link from "next/link"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { Handshake, Users, Wallet, Clock, CheckCircle2 } from "lucide-react"
import { AFILIADOS_HABILITADO } from "@/lib/features"
import { getPainelAfiliado } from "@/lib/afiliados/queries"
import { requireUser } from "@/lib/data/queries"
import {
  COMISSAO_PADRAO_PCT,
  COOKIE_AFILIADO_DIAS,
  formatarReais,
  montarLinkAfiliado,
} from "@/lib/afiliados/config"
import { formatRelativeDate } from "@/lib/format-date"
import { FormCandidatura } from "@/app/afiliados/form-candidatura"
import { CartaoLinkAfiliado, FormCarteira } from "./afiliados-client"

export const metadata = { title: "Afiliados" }

/** Origem real da requisição (ver /dashboard/indicacao). */
async function origemAtual(): Promise<string | undefined> {
  const h = await headers()
  const host = h.get("x-forwarded-host") || h.get("host")
  if (!host) return undefined
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

function Metrica({
  icone: Icone,
  tile,
  valor,
  rotulo,
}: {
  icone: typeof Users
  tile: string
  valor: string
  rotulo: string
}) {
  return (
    <div className="nv-card nv-fade p-4 flex items-center gap-3">
      <span className={`nv-tile ${tile} w-10 h-10 shrink-0`}>
        <Icone className="w-[18px] h-[18px]" strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="text-[20px] font-bold leading-none tabular-nums" style={{ color: "var(--nv-text)" }}>
          {valor}
        </p>
        <p className="text-[11.5px] mt-1" style={{ color: "var(--nv-text-subtle)" }}>
          {rotulo}
        </p>
      </div>
    </div>
  )
}

function Cabecalho({ sub }: { sub: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="nv-tile nv-tile-purple w-10 h-10">
          <Handshake className="w-5 h-5" strokeWidth={1.9} />
        </span>
        <h1 className="text-2xl font-bold" style={{ color: "var(--nv-text)" }}>
          Afiliados
        </h1>
      </div>
      <p className="text-sm" style={{ color: "var(--nv-text-muted)" }}>
        {sub}
      </p>
    </div>
  )
}

const STATUS_COMISSAO: Record<string, { rotulo: string; badge: string }> = {
  pending: { rotulo: "A pagar", badge: "nv-badge-progress" },
  paid: { rotulo: "Paga", badge: "nv-badge-done" },
  reversed: { rotulo: "Estornada", badge: "nv-badge-draft" },
}

export default async function AfiliadosDashboardPage() {
  if (!AFILIADOS_HABILITADO) notFound()

  const [painel, origem, { user }] = await Promise.all([
    getPainelAfiliado(),
    origemAtual(),
    requireUser(),
  ])
  const af = painel.afiliado

  // Sem candidatura: CTA + formulário pré-preenchido com a conta.
  if (!af || af.status === "rejected") {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8 space-y-5">
        <Cabecalho
          sub={`Ganhe ${COMISSAO_PADRAO_PCT}% em dinheiro, todo mês, por cada cliente que assinar pelo seu link. Participação por aprovação.`}
        />
        <div className="nv-upgrade nv-fade p-5">
          <div className="relative z-10">
            <p className="text-[10.5px] uppercase tracking-wider mb-1.5" style={{ color: "var(--nv-text-subtle)" }}>
              Como funciona
            </p>
            <p className="text-[13px]" style={{ color: "var(--nv-text-muted)" }}>
              Você se candidata, a gente aprova manualmente, você recebe um link.
              Quem clicar e assinar em até {COOKIE_AFILIADO_DIAS} dias vira seu
              cliente e rende {COMISSAO_PADRAO_PCT}% de cada cobrança enquanto
              pagar. Detalhes e valores por plano na{" "}
              <Link href="/afiliados" className="underline" style={{ color: "var(--nv-text)" }}>
                página do programa
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="nv-card nv-fade p-5">
          <h2 className="text-[15px] font-semibold mb-1" style={{ color: "var(--nv-text)" }}>
            Candidatura
          </h2>
          <p className="text-[12.5px] mb-4" style={{ color: "var(--nv-text-muted)" }}>
            Usa o e-mail desta conta pra que o painel apareça aqui assim que for aprovado.
          </p>
          <FormCandidatura
            variante="dashboard"
            prefill={{
              email: user.email ?? "",
              name: (user.user_metadata?.full_name as string | undefined) ?? "",
            }}
          />
        </div>
      </div>
    )
  }

  // Em análise (ou suspenso).
  if (af.status !== "approved") {
    const suspenso = af.status === "suspended"
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8 space-y-5">
        <Cabecalho sub={suspenso ? "Sua conta de afiliado está suspensa." : "Sua candidatura está em análise."} />
        <div className="nv-card nv-fade p-5">
          <div className="flex items-center gap-3">
            <span className="nv-tile nv-tile-orange w-10 h-10 shrink-0">
              <Clock className="w-[18px] h-[18px]" strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: "var(--nv-text)" }}>
                {suspenso ? "Afiliado suspenso" : "Candidatura em análise"}
              </p>
              <p className="text-[12.5px] mt-0.5" style={{ color: "var(--nv-text-muted)" }}>
                {suspenso
                  ? "Fale com o suporte pra entender o motivo."
                  : `Enviada ${formatRelativeDate(af.createdAt)}. A gente analisa manualmente e responde em ${af.email}.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Aprovado: painel completo.
  const link = montarLinkAfiliado(af.code, origem)

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8 space-y-5">
      <Cabecalho
        sub={`Você recebe ${af.commissionPct}% de cada cobrança dos clientes que entrarem pelo seu link, enquanto eles pagarem.`}
      />

      <CartaoLinkAfiliado codigo={af.code} link={link} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Metrica icone={Users} tile="nv-tile-blue" valor={String(painel.totalIndicados)} rotulo="Clientes indicados" />
        <Metrica icone={Clock} tile="nv-tile-orange" valor={formatarReais(painel.comissaoPendente)} rotulo="Comissão a pagar" />
        <Metrica icone={CheckCircle2} tile="nv-tile-green" valor={formatarReais(painel.comissaoPaga)} rotulo="Comissão paga" />
      </div>

      <FormCarteira walletAtual={af.asaasWalletId} />

      <div className="nv-card nv-fade p-5">
        <h2 className="text-[15px] font-semibold mb-3.5" style={{ color: "var(--nv-text)" }}>
          Histórico de comissões
        </h2>
        {painel.comissoes.length === 0 ? (
          <p className="text-[12.5px] py-3" style={{ color: "var(--nv-text-subtle)" }}>
            Nenhuma comissão ainda. Ela aparece aqui na primeira cobrança confirmada de um cliente seu.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {["Data", "Cobrança", "Comissão", "Status"].map((h) => (
                    <th
                      key={h}
                      className="text-[10.5px] uppercase tracking-wider font-medium pb-2 pr-4 whitespace-nowrap"
                      style={{ color: "var(--nv-text-subtle)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {painel.comissoes.map((c) => {
                  const st = STATUS_COMISSAO[c.status] ?? STATUS_COMISSAO.pending
                  return (
                    <tr key={c.id} style={{ borderTop: "1px solid var(--nv-border)" }}>
                      <td className="py-2.5 pr-4 text-[12.5px] whitespace-nowrap" style={{ color: "var(--nv-text-muted)" }}>
                        {formatRelativeDate(c.createdAt)}
                      </td>
                      <td className="py-2.5 pr-4 text-[12.5px] tabular-nums whitespace-nowrap" style={{ color: "var(--nv-text)" }}>
                        {formatarReais(c.grossValue)}
                      </td>
                      <td className="py-2.5 pr-4 text-[12.5px] tabular-nums whitespace-nowrap" style={{ color: "var(--nv-text)" }}>
                        {formatarReais(c.commissionValue)}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span className={`nv-badge ${st.badge}`}>{st.rotulo}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="nv-card nv-fade p-5">
        <h2 className="text-[15px] font-semibold mb-2.5" style={{ color: "var(--nv-text)" }}>
          Regras
        </h2>
        <ul className="space-y-1.5 text-[12.5px]" style={{ color: "var(--nv-text-muted)" }}>
          <li>Comissão em toda cobrança confirmada do cliente, inclusive renovações.</li>
          <li>Cobrança estornada ou cancelada estorna a comissão.</li>
          <li>Atribuição por cookie de {COOKIE_AFILIADO_DIAS} dias a partir do clique.</li>
          <li>Não cumula com o programa de indicação em tokens.</li>
          <li>Sem walletId do Asaas, a comissão acumula e é paga por Pix manual.</li>
        </ul>
      </div>
    </div>
  )
}
