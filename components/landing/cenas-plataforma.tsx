"use client"

import type { ReactNode } from "react"
import {
  BarChart3,
  Calendar,
  Check,
  Clock,
  Instagram,
  Lightbulb,
  Plus,
  Sparkles,
} from "lucide-react"

import { useFases } from "./slider-par"

/*
 * CENAS DA SEÇÃO "A PLATAFORMA".
 *
 * Cada cena é uma TELA do produto desenhada com as mesmas peças (fio de borda,
 * mono em caixa alta pros rótulos, azul da marca só como fill). Elas rodam em
 * FASES pelo `useFases`: enquanto a cena está no palco, o relógio avança e ela
 * se monta na frente de quem está olhando, em vez de aparecer pronta.
 *
 * Regra que vale pra todas: elas encenam o que o produto FAZ hoje (calendário,
 * publicação no Instagram, várias marcas, biblioteca, pautas) e não mostram
 * número de cliente, curtida nem alcance, que a gente não tem como defender.
 */

/** Moldura da cena: a "tela" do app dentro do palco. */
function Tela({ children, titulo }: { children: ReactNode; titulo: string }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-hairline bg-surface shadow-card">
      <div className="flex items-center gap-2 border-b border-hairline px-3.5 py-2.5">
        <span className="text-[12px] font-semibold text-foreground">{titulo}</span>
        <span className="ml-auto flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-hairline-strong" />
          <span className="h-1.5 w-1.5 rounded-full bg-hairline-strong" />
        </span>
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  )
}

/* ── 01. Calendário editorial ─────────────────────────────────────────────
   Cinco dias da semana. A cada fase, um dia a mais sai de "vazio" pra
   "agendado": é a semana se preenchendo. */
export function CenaCalendario({ ativo }: { ativo: boolean }) {
  const dias = [
    { d: "Seg", p: "5 erros que esvaziam a agenda" },
    { d: "Ter", p: "Antes e depois em 7 dias" },
    { d: "Qua", p: "Sua pele não precisa de 10 produtos" },
    { d: "Qui", p: "O que ninguém te conta na consulta" },
    { d: "Sex", p: "Prova social da semana" },
  ]
  const fase = useFases(6, 900, ativo)

  return (
    <Tela titulo="Calendário editorial">
      <div className="space-y-2">
        {dias.map((dia, i) => {
          const cheio = i < fase
          return (
            <div
              key={dia.d}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-500 ${
                cheio ? "border border-brand-600/40 bg-brand-900/15" : "border border-dashed border-hairline-strong"
              }`}
            >
              <span className="w-8 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                {dia.d}
              </span>
              {cheio ? (
                <>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">{dia.p}</span>
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                </>
              ) : (
                <span className="flex items-center gap-1.5 text-[12px] text-text-muted">
                  <Plus className="h-3 w-3" />
                  vazio
                </span>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-text-muted">
        <Calendar className="h-3 w-3 text-primary" />
        A semana inteira decidida de uma vez, não post por post.
      </p>
    </Tela>
  )
}

/* ── 02. Publicação no Instagram ──────────────────────────────────────────
   Quatro fases: conta conectada, peça na fila, horário chegando, no ar. */
export function CenaPublicacao({ ativo }: { ativo: boolean }) {
  const fase = useFases(5, 1100, ativo)
  const passos = [
    { i: Instagram, t: "Conta conectada", s: "@suaclinica" },
    { i: Clock, t: "Na fila", s: "quarta, 19h00" },
    { i: Sparkles, t: "Enviando os 7 slides", s: "1080x1350" },
    { i: Check, t: "No ar", s: "sem você abrir o app" },
  ]

  return (
    <Tela titulo="Publicação">
      <div className="space-y-2">
        {passos.map((p, i) => {
          const on = i < fase
          return (
            <div
              key={p.t}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-500 ${
                on
                  ? "border-brand-600/40 bg-brand-900/15 opacity-100"
                  : "border-hairline bg-background opacity-45"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  on ? "bg-primary text-white" : "bg-surface-2 text-text-muted"
                }`}
              >
                <p.i className="h-3.5 w-3.5" strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] text-foreground">{p.t}</span>
                <span className="block truncate font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">
                  {p.s}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </Tela>
  )
}

/* ── 03. Várias marcas na mesma conta ─────────────────────────────────────
   A marca ativa gira a cada fase: é o argumento de quem atende cliente. */
export function CenaMarcas({ ativo }: { ativo: boolean }) {
  const marcas = [
    { n: "Sua Clínica", cores: ["#1668E3", "#0E0E0E", "#F5F2EC"], tom: "Acolhedor, sem jargão" },
    { n: "Studio Fit", cores: ["#D1FE17", "#101012", "#FFFFFF"], tom: "Direto, energia alta" },
    { n: "Casa Pão", cores: ["#C97B3C", "#FAF3E7", "#2A1D18"], tom: "Caseiro, sem pressa" },
  ]
  const fase = useFases(3, 2000, ativo)

  return (
    <Tela titulo="Marcas">
      <div className="space-y-2">
        {marcas.map((m, i) => {
          const on = i === fase
          return (
            <div
              key={m.n}
              className={`rounded-lg border px-3 py-2.5 transition-colors duration-500 ${
                on ? "border-brand-600/50 bg-brand-900/15" : "border-hairline bg-background"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-medium text-foreground">{m.n}</span>
                {on ? (
                  <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
                    ativa
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {m.cores.map((c) => (
                  <span
                    key={c}
                    className="h-4 w-4 rounded border border-hairline-strong"
                    style={{ backgroundColor: c }}
                  />
                ))}
                <span className="ml-1 truncate font-mono text-[9px] uppercase tracking-[0.1em] text-text-muted">
                  {m.tom}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] text-text-muted">
        Trocar de marca troca tom, paleta e regras de uma vez. Nada vaza de uma pra outra.
      </p>
    </Tela>
  )
}

/* ── 04. Biblioteca de peças ──────────────────────────────────────────────
   A grade se preenche por fase, imagem por imagem. */
export function CenaBiblioteca({ ativo }: { ativo: boolean }) {
  const pecas = [
    "/refs-posts-unicos/beauty/01/referencia.jpg",
    "/refs-posts-unicos/fitness/02/referencia.jpg",
    "/refs-posts-unicos/informativo/01/referencia.jpg",
    "/refs-posts-unicos/comercial/01/referencia.jpg",
    "/refs-posts-unicos/Profissional/01/referencia.jpg",
    "/refs-posts-unicos/beauty/03/referencia.jpg",
  ]
  const fase = useFases(7, 500, ativo)

  return (
    <Tela titulo="Biblioteca">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {["Tudo", "Carrossel", "Post único", "Rascunho"].map((f, i) => (
          <span
            key={f}
            className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${
              i === 0
                ? "bg-primary text-white"
                : "border border-hairline bg-background text-text-muted"
            }`}
          >
            {f}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {pecas.map((src, i) => (
          <div
            key={src}
            className={`overflow-hidden rounded-lg border border-hairline transition-all duration-500 ${
              i < fase ? "opacity-100 blur-0" : "opacity-0 blur-[6px]"
            }`}
          >
            <img src={src} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-text-muted">
        Tudo que você gerou fica salvo e reeditável. Peça antiga vira base da próxima.
      </p>
    </Tela>
  )
}

/* ── 05. Pautas ───────────────────────────────────────────────────────────
   As sugestões entram uma a uma e a primeira é escolhida no fim. */
export function CenaPautas({ ativo }: { ativo: boolean }) {
  const pautas = [
    "O erro de skincare que quase todo mundo comete",
    "Quanto tempo leva pra ver resultado de verdade",
    "3 perguntas pra fazer antes de fechar procedimento",
    "O que a gente NUNCA recomenda, e por quê",
  ]
  const fase = useFases(6, 800, ativo)

  return (
    <Tela titulo="Pautas da semana">
      <div className="space-y-2">
        {pautas.map((p, i) => {
          const on = i < fase
          const escolhida = fase >= 5 && i === 0
          return (
            <div
              key={p}
              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-all duration-500 ${
                escolhida
                  ? "border-brand-600/50 bg-brand-900/20"
                  : "border-hairline bg-background"
              } ${on ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"}`}
            >
              <Lightbulb
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${escolhida ? "text-primary" : "text-text-muted"}`}
                strokeWidth={1.8}
              />
              <span className="text-[12px] leading-snug text-foreground">{p}</span>
              {escolhida ? (
                <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
                  gerar
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-text-muted">
        <BarChart3 className="h-3 w-3 text-primary" />
        Sugestões a partir da sua marca e do que já foi publicado.
      </p>
    </Tela>
  )
}
