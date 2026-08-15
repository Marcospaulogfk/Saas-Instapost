/**
 * Trilha — página PRIVADA do dono (CEO). Rota escondida, fora da navegação:
 * gate por allowlist de e-mail (TRILHA_EMAILS ou o default do dono); qualquer
 * outra conta (ou sem sessão) recebe 404 — pra cliente, não existe.
 *
 * Conteúdo: o papel do Nexus Content no plano 12k (Desktop/PLANO-12K.md v3 +
 * ESTRATEGIA-OUTBOUND-FUNIL.md). Conteúdo de código: mudou o plano lá,
 * muda aqui no mesmo commit.
 */
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Trilha",
  robots: { index: false, follow: false },
}

const DONO_DEFAULT = "marcosodpor@gmail.com"

function emailsPermitidos(): string[] {
  const env = (process.env.TRILHA_EMAILS ?? "").trim()
  if (!env) return [DONO_DEFAULT]
  return env.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
}

/** 'AAAA-MM-DD' em São Paulo, pra comparar com as datas do plano. */
function hojeISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date())
}

function diasAte(data: string): number {
  return Math.ceil((new Date(`${data}T00:00:00-03:00`).getTime() - Date.now()) / 86_400_000)
}

/* ------------------------------ o plano (SP) ------------------------------ */

const OBJETIVO =
  "Motor composto do plano 12k (R$12k/mês até 18/06/2027). Até outubro: dogfood + Culturizese + " +
  "destravar produto. Novembro em diante: outbound próprio (isca do carrossel personalizado). " +
  "Alvo junho/2027: ~38 clientes, MRR ~R$2,9k só de Nexus Content."

const BLOQUEADORES = [
  { item: "Checkout Cakto operacional", nota: "Sem ele não existe conversão — o funil inteiro morre no fim", quando: "Out (S10)" },
  { item: "Trial de 1 carrossel ponta a ponta sem fricção", nota: "É a landing do outbound inteiro", quando: "Out (S11)" },
  { item: "localStorage → Supabase (pautas, XP, onboarding)", nota: "Usuário não pode perder dados ao trocar de device", quando: "Out (S11)" },
  { item: "Teste visual lado-a-lado vs GalilAI aprovado", nota: "Se a diferença não for óbvia num print, o preço R$47 não se sustenta", quando: "Out (S11)" },
  { item: "Rebrand package.json/README (instapost → syncpost)", nota: "Meta App Review rejeita marca inconsistente", quando: "Out" },
  { item: "Relógios: 2 domínios de e-mail em warmup + chip aquecendo", nota: "3–4 semanas e 10–14 dias — não se compram com pressa depois", quando: "Out (S11)" },
]

type Mes = { id: string; rotulo: string; tema: string; clientes: string; marco: string }
const MESES: Mes[] = [
  { id: "2026-08", rotulo: "Ago/26", tema: "Dogfood", clientes: "0", marco: "Conteúdo da WebSync/EverReply feito no Nexus Content · Culturizese (R$600 + 30% comissão)" },
  { id: "2026-09", rotulo: "Set/26", tema: "Dogfood + vitrine", clientes: "0", marco: "@syncpost com feed feito no próprio produto (demo viva pro outbound de novembro)" },
  { id: "2026-10", rotulo: "Out/26", tema: "Produto destravado + relógios", clientes: "0", marco: "Bloqueadores fechados · lotes A/B extraídos (250 social media + 250 micro agência)" },
  { id: "2026-11", rotulo: "Nov/26", tema: "🚀 Outbound ativo (piloto)", clientes: "0–2", marco: "Cadência 14 dias · 15 iscas/dia · A/B social media × micro agência · trial assistido" },
  { id: "2026-12", rotulo: "Dez/26", tema: "Análise do A/B", clientes: "2–5", marco: "Resposta E ativação decidem o nicho vencedor → dobrar nele" },
  { id: "2027-01", rotulo: "Jan/27", tema: "Calibragem", clientes: "6–11", marco: "5–8 novos/mês · primeiros depoimentos (trocar 1–2 meses grátis por vídeo/print)" },
  { id: "2027-02", rotulo: "Fev/27", tema: "Afiliados", clientes: "11–17", marco: "40% 1ª fatura + 20% recorrente com os social medias clientes (o afiliado perfeito)" },
  { id: "2027-03", rotulo: "Mar/27", tema: "Lote 3 + paid teste", clientes: "17–24", marco: "Dentistas/nutris (blueprint Sorriai; sinergia com a prospecção de clínicas do EverReply)" },
  { id: "2027-04", rotulo: "Abr/27", tema: "Consolidação", clientes: "23–31", marco: "Ciclos anual −40% pra travar receita" },
  { id: "2027-05", rotulo: "Mai/27", tema: "Escala", clientes: "28–38", marco: "Churn precoce sob controle (<15% mês 1) · upsell Pro/Studio" },
  { id: "2027-06", rotulo: "Jun/27", tema: "🎯 A meta", clientes: "33–44", marco: "MRR ~R$2,9k de Nexus Content dentro dos R$12k/mês totais" },
]

const FUNIL = [
  { etapa: "300 tocados → resposta ao toque 1", meta: "≥20% (saúde) · <10% em 2 lotes = parar e refazer isca/lista" },
  { etapa: "Resposta → “sim, manda” (viu a demo)", meta: "≥60% das respostas" },
  { etapa: "Demo → trial ou call", meta: "≥35%" },
  { etapa: "Trial → ativou (gerou sozinho)", meta: "≥60% — trial não ativado converte ~0" },
  { etapa: "Ativou → pagou", meta: "≥30% · <20% após 60 dias = problema é ativação, não mercado" },
  { etapa: "Resultado realista", meta: "2–4 clientes/mês no início · 5–8 calibrado" },
]

const CADENCIA = [
  "D-2: Instagram passivo (seguir + curtir + 1 comentário) — NUNCA cold DM",
  "D1: WhatsApp permission-first — “gerei um carrossel com a identidade da [marca] — quer que eu mande?”",
  "D3: 1 slide solto (a única exceção ao permission-first) + LinkedIn convite (ICP 1/2)",
  "D5: e-mail com carrossel completo + link do trial",
  "D9: ângulo NOVO (prova social ou aritmética: R$97 = 6,5% de UM cliente seu)",
  "D14: breakup educado · +45d: revival sazonal",
  "Regra: resposta em qualquer canal PAUSA tudo · responder em 10min converte ~2x",
]

const REGUAS = [
  { sinal: "Resposta toque 1 <10% (2 lotes)", acao: "Parar volume; refazer lista/copy/isca" },
  { sinal: "Trial→pago <20% (60 dias)", acao: "Consertar onboarding/ativação antes de mais leads" },
  { sinal: "Churn mês 1 >15%", acao: "Congelar aquisição 2 semanas, consertar ativação" },
  { sinal: "Bloqueios >2% no dia", acao: "Kill-switch: pausa 48h · QA de 30s em TODA isca antes de enviar" },
]

/* --------------------------------- página --------------------------------- */

export default async function TrilhaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email?.toLowerCase() ?? ""
  if (!email || !emailsPermitidos().includes(email)) notFound()

  const hoje = hojeISO()
  const mesAtual = hoje.slice(0, 7)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 font-display font-bold text-text-primary">Trilha</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">{OBJETIVO}</p>
        </div>
        <span className="rounded-xl border border-border-subtle bg-gradient-card px-4 py-2 text-sm font-semibold text-text-primary">
          18/06/2027 em {diasAte("2027-06-18")} dias
        </span>
      </header>

      {/* Bloqueadores de produto */}
      <section className="rounded-xl border border-border-subtle bg-gradient-card backdrop-blur-xl p-6 space-y-3">
        <h2 className="text-lg font-display font-semibold text-text-primary">
          Antes do disparo — bloqueadores de produto
        </h2>
        <div className="space-y-2">
          {BLOQUEADORES.map((b) => (
            <div key={b.item} className="flex items-start justify-between gap-4 rounded-lg border border-border-subtle p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{b.item}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{b.nota}</p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {b.quando}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Rampa mensal */}
      <section className="rounded-xl border border-border-subtle bg-gradient-card backdrop-blur-xl p-6">
        <h2 className="mb-3 text-lg font-display font-semibold text-text-primary">
          Rampa — clientes Nexus Content até junho/2027
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-text-secondary">
                <th className="py-2 pr-3 font-medium">Mês</th>
                <th className="py-2 pr-3 font-medium">Tema</th>
                <th className="py-2 pr-3 font-medium">Clientes</th>
                <th className="py-2 pr-3 font-medium">Marco</th>
              </tr>
            </thead>
            <tbody>
              {MESES.map((m) => {
                const atual = m.id === mesAtual
                return (
                  <tr key={m.id} className={`border-t border-border-subtle align-top ${atual ? "bg-primary/5" : ""}`}>
                    <td className="whitespace-nowrap py-2.5 pr-3 font-semibold text-text-primary">
                      {m.rotulo}
                      {atual && (
                        <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                          AGORA
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-text-primary">{m.tema}</td>
                    <td className="whitespace-nowrap py-2.5 pr-3 font-semibold text-text-primary">{m.clientes}</td>
                    <td className="py-2.5 pr-3 text-xs leading-snug text-text-secondary">{m.marco}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Funil */}
        <section className="rounded-xl border border-border-subtle bg-gradient-card backdrop-blur-xl p-6">
          <h2 className="mb-3 text-lg font-display font-semibold text-text-primary">
            Funil projetado — metas de saúde
          </h2>
          <div className="space-y-2">
            {FUNIL.map((f) => (
              <div key={f.etapa} className="rounded-lg border border-border-subtle p-3">
                <p className="text-sm font-medium text-text-primary">{f.etapa}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{f.meta}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          {/* Cadência */}
          <section className="rounded-xl border border-border-subtle bg-gradient-card backdrop-blur-xl p-6">
            <h2 className="mb-3 text-lg font-display font-semibold text-text-primary">
              Cadência de 14 dias (resumo)
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-xs text-text-secondary">
              {CADENCIA.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>

          {/* Réguas */}
          <section className="rounded-xl border border-border-subtle bg-gradient-card backdrop-blur-xl p-6">
            <h2 className="mb-3 text-lg font-display font-semibold text-text-primary">Réguas de abandono</h2>
            <div className="space-y-2">
              {REGUAS.map((r) => (
                <div key={r.sinal} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-sm font-medium text-text-primary">{r.sinal}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">{r.acao}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <p className="text-xs text-text-secondary">
        Fonte de verdade: Desktop/PLANO-12K.md (v3) + ESTRATEGIA-OUTBOUND-FUNIL.md. Detalhe fino de
        cada mês é escrito no último domingo do mês anterior — esta página acompanha no mesmo commit.
      </p>
    </div>
  )
}
