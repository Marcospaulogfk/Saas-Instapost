// =====================================================================
// /afiliados: página pública do PROGRAMA DE AFILIADOS (dinheiro).
// Diferente de "Indique e ganhe" (tokens): aqui é comissão em reais,
// recorrente, e só pra quem for aprovado manualmente.
// 404 enquanto AFILIADOS_HABILITADO estiver desligado (lib/features.ts).
// =====================================================================

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Link2, Clock, UserCheck, Wallet, Repeat } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { AFILIADOS_HABILITADO } from "@/lib/features"
import { PLAN_PRICE_MONTHLY, PLAN_LABEL, PAID_PLANS } from "@/lib/billing/plans"
import {
  COMISSAO_PADRAO_PCT,
  COOKIE_AFILIADO_DIAS,
  comissaoMensal,
  formatarReais,
} from "@/lib/afiliados/config"
import { FormCandidatura } from "./form-candidatura"

export const metadata: Metadata = {
  title: "Programa de afiliados",
  description:
    "Indique o Nexus Content e receba 25% de comissão recorrente em cada mensalidade dos clientes que você trouxer.",
  alternates: { canonical: "/afiliados" },
}

const PASSOS = [
  {
    icon: UserCheck,
    titulo: "Candidate-se",
    texto: "Preencha o formulário abaixo. A gente lê cada pedido e aprova manualmente quem tem público e fit com o produto.",
  },
  {
    icon: Link2,
    titulo: "Receba seu link",
    texto: "Aprovado, você ganha um link único no painel. Cada visitante que clica fica atribuído a você.",
  },
  {
    icon: Clock,
    titulo: `Cookie de ${COOKIE_AFILIADO_DIAS} dias`,
    texto: `Quem clicar no seu link e assinar em até ${COOKIE_AFILIADO_DIAS} dias conta como seu cliente, mesmo que volte depois por outro caminho.`,
  },
  {
    icon: Repeat,
    titulo: "Comissão recorrente",
    texto: `${COMISSAO_PADRAO_PCT}% de cada cobrança do cliente, todo mês, enquanto ele continuar assinando. Não é só na primeira.`,
  },
  {
    icon: Wallet,
    titulo: "Pagamento",
    texto: "Com conta Asaas, o repasse é automático (split na cobrança). Sem conta, a comissão acumula e a gente acerta por Pix.",
  },
]

export default function AfiliadosPage() {
  if (!AFILIADOS_HABILITADO) notFound()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid-bg-fade fixed inset-0 -z-10 pointer-events-none" />

      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-hairline">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <Logo size={22} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary hover:text-foreground transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-12">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted mb-4">
          <span className="text-primary">●</span>
          Programa de afiliados
        </div>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] max-w-3xl leading-[1.08]">
          Ganhe {COMISSAO_PADRAO_PCT}% recorrente em cada cliente que você trouxer.
        </h1>
        <p className="mt-5 text-[16px] md:text-[17px] leading-relaxed text-text-secondary max-w-2xl">
          Todo mês, enquanto o cliente pagar. Sem teto de ganhos, sem limite de
          indicações. Vagas aprovadas uma a uma: queremos parceiros que conheçam
          quem produz conteúdo pra Instagram, não links soltos.
        </p>
        <a
          href="#candidatura"
          className="mt-8 inline-flex items-center justify-center h-12 px-7 rounded-full bg-primary text-primary-foreground text-[14px] font-medium hover:opacity-90 transition"
        >
          Quero me candidatar
        </a>
      </section>

      {/* Quanto dá em reais */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted mb-4">
          Quanto você recebe por cliente, por mês
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {PAID_PLANS.map((plano) => {
            const preco = PLAN_PRICE_MONTHLY[plano]
            const comissao = comissaoMensal(preco)
            return (
              <div
                key={plano}
                className="rounded-2xl border border-hairline bg-surface/60 backdrop-blur p-6"
              >
                <p className="text-[13px] text-text-muted">
                  {PLAN_LABEL[plano]} ({formatarReais(preco)}/mês)
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.02em]">
                  {formatarReais(comissao)}
                </p>
                <p className="mt-1 text-[12.5px] text-text-muted">
                  por mês, enquanto o cliente pagar
                </p>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-[13px] text-text-muted max-w-2xl">
          Exemplo: 10 clientes no Pro rendem {formatarReais(comissaoMensal(PLAN_PRICE_MONTHLY.pro) * 10)} por mês
          de comissão recorrente. A comissão segue o valor realmente cobrado
          (planos anuais e descontos entram proporcionalmente).
        </p>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold tracking-[-0.01em] mb-6">Como funciona</h2>
        <ol className="grid gap-4 md:grid-cols-2">
          {PASSOS.map((p, i) => (
            <li key={p.titulo} className="flex gap-4 rounded-2xl border border-hairline p-5">
              <span className="shrink-0 w-10 h-10 rounded-xl grid place-items-center bg-primary/10 text-primary">
                <p.icon className="w-5 h-5" strokeWidth={1.9} />
              </span>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
                  Passo {i + 1}
                </p>
                <p className="font-semibold mt-0.5">{p.titulo}</p>
                <p className="text-[14px] leading-relaxed text-text-secondary mt-1">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Regras */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold tracking-[-0.01em] mb-4">Regras</h2>
        <ul className="space-y-2 text-[14.5px] leading-relaxed text-text-secondary max-w-2xl list-disc pl-5">
          <li>Comissão de {COMISSAO_PADRAO_PCT}% sobre cada cobrança confirmada do cliente indicado, inclusive renovações.</li>
          <li>Cobrança estornada ou cancelada cancela a comissão correspondente.</li>
          <li>Não cumula com o programa de indicação em tokens: cada cliente é atribuído a um único programa.</li>
          <li>Não vale indicar a si mesmo, usar cupom em anúncio de marca ou prometer o que o produto não faz.</li>
          <li>Aprovação e comissão podem ser revistas pelo Nexus Content a qualquer momento, com aviso.</li>
        </ul>
      </section>

      {/* Formulário */}
      <section id="candidatura" className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="rounded-3xl border border-hairline bg-surface/60 backdrop-blur p-6 md:p-10">
          <h2 className="text-2xl font-semibold tracking-[-0.01em]">Candidatura</h2>
          <p className="mt-2 mb-8 text-[14.5px] text-text-secondary max-w-2xl">
            Leva dois minutos. A gente entra em contato pelo e-mail ou WhatsApp
            informado; se você já tem conta no Nexus Content, use o mesmo e-mail
            pra que o painel de afiliado apareça no seu dashboard assim que for
            aprovado.
          </p>
          <FormCandidatura />
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 pb-12 text-[12px] text-text-muted">
        <Link href="/termos" className="hover:text-foreground transition">Termos de uso</Link>
        <span className="mx-2">·</span>
        <Link href="/privacidade" className="hover:text-foreground transition">Privacidade</Link>
      </footer>
    </main>
  )
}
