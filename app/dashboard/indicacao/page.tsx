// =====================================================================
// /dashboard/indicacao — INDIQUE E GANHE
//
// Programa de indicação TWO-SIDED: quem indica ganha e quem é indicado
// também. Os dois só são creditados no PRIMEIRO PAGAMENTO CONFIRMADO do
// indicado (webhook da Cakto → RPC creditar_indicacao_no_pagamento).
// Ver lib/indicacao/config.ts para a calibragem dos números.
// =====================================================================

import { headers } from "next/headers"
import { Gift, Users, Wallet, Clock, CheckCircle2 } from "lucide-react"
import { getPainelIndicacao } from "@/lib/indicacao/queries"
import { getProfile } from "@/lib/data/queries"
import {
  REFERRAL_TOKENS,
  montarLinkIndicacao,
  postsUnicosEquivalentes,
} from "@/lib/indicacao/config"
import { formatRelativeDate } from "@/lib/format-date"
import { CartaoLink, FormConvite, Playbook } from "./indicacao-client"

export const metadata = { title: "Indique e ganhe" }

/**
 * Origem real da requisição.
 *
 * O link precisa sair com o host que o usuário está usando (localhost em
 * dev, app.nexuscontentai.com.br em prod) — NEXT_PUBLIC_APP_URL fica só
 * como fallback pra quando o header não vier.
 */
async function origemAtual(): Promise<string | undefined> {
  const h = await headers()
  const host = h.get("x-forwarded-host") || h.get("host")
  if (!host) return undefined
  const proto =
    h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https")
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
        <p
          className="text-[20px] font-bold leading-none tabular-nums"
          style={{ color: "var(--nv-text)" }}
        >
          {valor}
        </p>
        <p className="text-[11.5px] mt-1" style={{ color: "var(--nv-text-subtle)" }}>
          {rotulo}
        </p>
      </div>
    </div>
  )
}

export default async function IndicacaoPage({
  searchParams,
}: {
  // `?convite=ok|erro` vem do atalho /dashboard/indicacao/convite/[codigo].
  searchParams: Promise<{ convite?: string }>
}) {
  const [painel, { profile }, origem, sp] = await Promise.all([
    getPainelIndicacao(),
    getProfile(),
    origemAtual(),
    searchParams,
  ])

  const codigo = painel.codigo ?? ""
  const link = codigo ? montarLinkIndicacao(codigo, origem) : ""
  const ehPagante = profile?.subscription_status === "active"
  // O campo de "recebi um convite" só faz sentido pra quem ainda não está
  // vinculado E ainda não pagou — depois da primeira fatura o vínculo não
  // pode mais ser criado (regra anti-fraude no SQL).
  const podeAplicarConvite = !painel.meuVinculo && !ehPagante

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8 space-y-5">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="nv-tile nv-tile-purple w-10 h-10">
            <Gift className="w-5 h-5" strokeWidth={1.9} />
          </span>
          <h1 className="text-2xl font-bold" style={{ color: "var(--nv-text)" }}>
            Indique e ganhe
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--nv-text-muted)" }}>
          Você ganha {REFERRAL_TOKENS.indicador} tokens por indicado que assinar
          um plano. Quem entra pelo seu link ganha {REFERRAL_TOKENS.indicado}{" "}
          tokens junto com a primeira assinatura. Sem limite de indicações.
        </p>
      </div>

      {/* Retorno do atalho /convite/[codigo] */}
      {sp.convite && (
        <div
          className="nv-card nv-fade p-4 text-[12.5px]"
          style={{
            color: sp.convite === "ok" ? "#62e29a" : "#f6c35a",
          }}
        >
          {sp.convite === "ok"
            ? `Convite aplicado. Você ganha ${REFERRAL_TOKENS.indicado} tokens extras assim que assinar seu primeiro plano.`
            : "Não deu pra aplicar esse convite. Confira o código no campo abaixo ou fale com quem te indicou."}
        </div>
      )}

      {/* Como funciona — os dois lados, lado a lado */}
      <div className="nv-upgrade nv-fade p-5">
        <div className="relative z-10 grid gap-5 lg:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] uppercase tracking-wider mb-1.5"
              style={{ color: "var(--nv-text-subtle)" }}
            >
              Você recebe
            </p>
            <p
              className="text-[26px] font-bold leading-none"
              style={{ color: "var(--nv-text)" }}
            >
              {REFERRAL_TOKENS.indicador} tokens
            </p>
            <p className="text-[12.5px] mt-2" style={{ color: "var(--nv-text-muted)" }}>
              Por cada pessoa que assinar um plano pelo seu link. Dá{" "}
              {postsUnicosEquivalentes(REFERRAL_TOKENS.indicador)} posts únicos
              completos. E estes tokens nunca expiram: ficam num saldo separado,
              que a renovação do plano não zera.
            </p>
          </div>
          <div>
            <p
              className="text-[10.5px] uppercase tracking-wider mb-1.5"
              style={{ color: "var(--nv-text-subtle)" }}
            >
              Quem você indica recebe
            </p>
            <p
              className="text-[26px] font-bold leading-none"
              style={{ color: "var(--nv-text)" }}
            >
              {REFERRAL_TOKENS.indicado} tokens
            </p>
            <p className="text-[12.5px] mt-2" style={{ color: "var(--nv-text-muted)" }}>
              Um teste grátis inteiro a mais, creditado junto com a primeira
              assinatura dela. É por isso que o seu link converte mais do que um
              link comum: ele carrega uma oferta, não só uma recomendação.
            </p>
          </div>
        </div>
      </div>

      {/* Código + link */}
      {codigo ? (
        <CartaoLink codigo={codigo} link={link} />
      ) : (
        <div className="nv-card nv-fade p-5">
          <p className="text-[13px]" style={{ color: "var(--nv-text-muted)" }}>
            Não deu pra gerar seu código agora. Recarregue a página em alguns
            segundos.
          </p>
        </div>
      )}

      {/* Métricas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica
          icone={CheckCircle2}
          tile="nv-tile-green"
          valor={String(painel.totalConvertidos)}
          rotulo="Indicados que assinaram"
        />
        <Metrica
          icone={Clock}
          tile="nv-tile-orange"
          valor={String(painel.totalPendentes)}
          rotulo="Cadastrados, ainda sem assinar"
        />
        <Metrica
          icone={Users}
          tile="nv-tile-blue"
          valor={String(painel.indicados.length)}
          rotulo="Total de indicados"
        />
        <Metrica
          icone={Wallet}
          tile="nv-tile-purple"
          valor={String(painel.saldoIndicacao)}
          rotulo="Saldo de indicação (não expira)"
        />
      </div>

      {/* Meu vínculo — quando EU fui indicado */}
      {painel.meuVinculo && (
        <div className="nv-card nv-fade p-5">
          <h2
            className="text-[15px] font-semibold mb-1"
            style={{ color: "var(--nv-text)" }}
          >
            Você entrou por convite
          </h2>
          <p className="text-[12.5px]" style={{ color: "var(--nv-text-muted)" }}>
            {painel.meuVinculo.status === "qualified"
              ? `Bônus liberado: ${painel.meuVinculo.tokensPrevistos} tokens já entraram no seu saldo de indicação.`
              : `Assim que você assinar seu primeiro plano, ${REFERRAL_TOKENS.indicado} tokens extras entram na sua conta — e quem te indicou também é recompensado.`}
          </p>
        </div>
      )}

      {/* Aplicar convite recebido */}
      {podeAplicarConvite && <FormConvite />}

      {/* Seus indicados */}
      <div className="nv-card nv-fade p-5">
        <h2
          className="text-[15px] font-semibold mb-3.5"
          style={{ color: "var(--nv-text)" }}
        >
          Seus indicados
        </h2>

        {painel.indicados.length === 0 ? (
          <p className="text-[12.5px] py-3" style={{ color: "var(--nv-text-subtle)" }}>
            Ninguém entrou pelo seu link ainda. Os textos prontos abaixo levam
            uns 30 segundos pra publicar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {["Indicado", "Status", "Tokens", "Entrou"].map((h) => (
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
                {painel.indicados.map((i) => {
                  const convertido = i.status === "qualified"
                  return (
                    <tr
                      key={i.id}
                      style={{ borderTop: "1px solid var(--nv-border)" }}
                    >
                      <td
                        className="py-2.5 pr-4 text-[12.5px] whitespace-nowrap"
                        style={{ color: "var(--nv-text)" }}
                      >
                        {i.emailMascarado ?? "Conta sem e-mail"}
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        <span
                          className={`nv-badge ${
                            convertido ? "nv-badge-done" : "nv-badge-progress"
                          }`}
                        >
                          {convertido ? "Assinou" : "Aguardando assinatura"}
                        </span>
                      </td>
                      <td
                        className="py-2.5 pr-4 text-[12.5px] tabular-nums whitespace-nowrap"
                        style={{
                          color: convertido
                            ? "var(--nv-text)"
                            : "var(--nv-text-subtle)",
                        }}
                      >
                        {convertido
                          ? `+${i.tokensGanhos}`
                          : `+${REFERRAL_TOKENS.indicador} ao assinar`}
                      </td>
                      <td
                        className="py-2.5 text-[12.5px] whitespace-nowrap"
                        style={{ color: "var(--nv-text-muted)" }}
                      >
                        {formatRelativeDate(i.criadoEm)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Playbook */}
      {codigo && <Playbook link={link} />}

      {/* Regras — deixa a anti-fraude explícita, evita ticket de suporte */}
      <div className="nv-card nv-fade p-5">
        <h2
          className="text-[15px] font-semibold mb-2.5"
          style={{ color: "var(--nv-text)" }}
        >
          Regras
        </h2>
        <ul className="space-y-1.5 text-[12.5px]" style={{ color: "var(--nv-text-muted)" }}>
          <li>
            Os tokens entram quando o indicado paga a primeira assinatura — não
            no cadastro.
          </li>
          <li>Cada pessoa indicada é contada e creditada uma única vez.</li>
          <li>Não vale indicar a si mesmo nem criar contas para si.</li>
          <li>
            Tokens de indicação não expiram e não são zerados na renovação do
            seu plano.
          </li>
          <li>Sem limite de indicações.</li>
        </ul>
      </div>
    </div>
  )
}
