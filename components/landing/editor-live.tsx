"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  Download,
  History,
  Image as ImageIcon,
  Layers,
  Loader2,
  Palette,
  Pencil,
  Plus,
  Redo2,
  Save,
  Settings2,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Trash2,
  Type,
  Undo2,
} from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { useNaTela } from "./use-na-tela"

/* ============================================================================
 * O diferencial em movimento: a MESMA interface que o cliente usa por dentro.
 *
 * A animação roda o fluxo inteiro em ~18s, sem print e sem vídeo:
 *   1. /dashboard/criar  -> a pauta é digitada e o carrossel é gerado
 *   2. /dashboard/editor -> o carrossel abre e alguém EDITA (seleciona o
 *      título, reescreve, troca a cor da marca, arrasta, salva)
 *
 * O chrome é copiado do produto de verdade, peça por peça:
 *   - stepper de app/dashboard/criar/page.tsx (Formato · Modo · Estilo · Ideia)
 *   - sidebar preta de components/carousel/block-panel.tsx (PanelTopBar,
 *     BlockEditorShell com as abas Conteúdo/Estilo/Avançado, badge do histórico)
 *   - toolbar e filmstrip de components/carousel/carousel-editor.tsx
 *   - caixa de seleção, chip do tipo, alça e guia ciano de editable-canvas.tsx
 * Mexeu no editor, mexe aqui: a promessa desta seção é ser a tela real.
 * ========================================================================== */

const ACCENT_PADRAO = "#1668E3"
const ACCENT_NOVO = "#12A5F5"

const TEMA = "5 erros que fazem a clínica perder cliente no Instagram"
const TITULO_GERADO = "5 ERROS QUE FAZEM A CLÍNICA PERDER CLIENTE"
const TITULO_EDITADO = "5 ERROS QUE ESVAZIAM A SUA AGENDA"

const ETAPAS = ["Lendo a marca", "Escrevendo o roteiro", "Gerando as imagens", "Montando os slides"]

/* Roteiro que aparece nos 8 slides. Curto de propósito: no tamanho do
   filmstrip, o que precisa ler é o título. */
type Peca = { kicker: string; titulo: string; corpo?: string }

const ROTEIRO: Peca[] = [
  { kicker: "Estética", titulo: TITULO_GERADO, corpo: "E como resolver cada um esta semana" },
  { kicker: "01", titulo: "Feed sem rosto", corpo: "Ninguém marca consulta com quem não viu" },
  { kicker: "02", titulo: "Legenda que só fala de você", corpo: "O cliente quer saber do problema dele" },
  { kicker: "03", titulo: "Post bonito, sem chamada", corpo: "Sem convite, o direct não chega" },
  { kicker: "04", titulo: "Sumir cinco dias", corpo: "O alcance cai antes de você perceber" },
  { kicker: "05", titulo: "Preço no lugar do valor", corpo: "Preço só compara, valor convence" },
  { kicker: "Resumo", titulo: "Constância vence talento", corpo: "Um post por dia, todo dia" },
  { kicker: "Agora", titulo: "Salva pra não esquecer", corpo: "@clinicabella" },
]

/* ── Roteiro da animação ────────────────────────────────────────────────
   Cada cena herda a anterior e só declara o que muda. `alvo` é o data-alvo do
   elemento pra onde o cursor vai: a posição é MEDIDA no DOM, nunca chutada. */
type Estado = {
  tela: "criar" | "editor"
  step: number
  temaAlvo: string
  gerando: number
  prontos: number
  painel: "editar" | "bloco"
  tituloAlvo: string
  accent: string
  hover: boolean
  selecao: boolean
  guias: boolean
  arrastando: boolean
  sujo: boolean
  salvo: boolean
  historico: number
  alvo: string | null
  clique: boolean
}

type Cena = Partial<Estado> & { dur: number }

const BASE: Estado = {
  tela: "criar",
  step: 4,
  temaAlvo: "",
  gerando: -1,
  prontos: 0,
  painel: "editar",
  tituloAlvo: TITULO_GERADO,
  accent: ACCENT_PADRAO,
  hover: false,
  selecao: false,
  guias: false,
  arrastando: false,
  sujo: false,
  salvo: false,
  historico: 0,
  alvo: null,
  clique: false,
}

const CENAS: Cena[] = [
  /* 1 · a pauta */
  {
    dur: 700,
    tela: "criar",
    step: 4,
    temaAlvo: "",
    alvo: "tema",
    prontos: 0,
    gerando: -1,
    sujo: false,
    salvo: false,
    selecao: false,
    hover: false,
    historico: 0,
    accent: ACCENT_PADRAO,
    tituloAlvo: TITULO_GERADO,
    painel: "editar",
  },
  { dur: 2600, temaAlvo: TEMA },
  { dur: 600, alvo: "gerar" },
  { dur: 300, clique: true },

  /* 2 · a engine trabalhando */
  { dur: 700, step: 5, gerando: 0, alvo: null },
  { dur: 800, gerando: 1, prontos: 2 },
  { dur: 900, gerando: 2, prontos: 5 },
  { dur: 900, gerando: 3, prontos: 8 },

  /* 3 · o editor abre com o carrossel pronto */
  { dur: 1100, tela: "editor", painel: "editar", alvo: null },
  { dur: 800, alvo: "titulo", hover: true },
  { dur: 500, clique: true, selecao: true, painel: "bloco", hover: false, historico: 1 },

  /* 4 · reescreve o título */
  { dur: 600, alvo: "campo" },
  { dur: 2400, tituloAlvo: TITULO_EDITADO, sujo: true, historico: 2 },

  /* 5 · troca a cor do destaque */
  { dur: 600, alvo: "cor" },
  { dur: 700, clique: true, accent: ACCENT_NOVO, historico: 3 },

  /* 6 · arrasta o título (guia de centro aparece) */
  { dur: 900, alvo: "titulo", arrastando: true, guias: true, historico: 4 },
  { dur: 500, arrastando: false, guias: false },

  /* 7 · salva */
  { dur: 600, alvo: "salvar" },
  { dur: 400, clique: true },
  { dur: 2200, salvo: true, sujo: false, alvo: null, selecao: false },
]

/* A digitação apaga só até onde os dois textos divergem, como quem seleciona o
   fim da frase e reescreve. */
function prefixoComum(a: string, b: string) {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return a.slice(0, i)
}

function useDigitacao(alvo: string, ativo: boolean) {
  const [txt, setTxt] = useState(alvo)

  useEffect(() => {
    if (!ativo) {
      setTxt(alvo)
      return
    }
    if (txt === alvo) return
    const apagando = txt.length > prefixoComum(txt, alvo).length
    const t = setTimeout(
      () => {
        setTxt((atual) => {
          const comum = prefixoComum(atual, alvo)
          return atual.length > comum.length
            ? atual.slice(0, -1)
            : alvo.slice(0, atual.length + 1)
        })
      },
      apagando ? 22 : 34,
    )
    return () => clearTimeout(t)
  }, [txt, alvo, ativo])

  return txt
}

export function EditorLive() {
  const reduced = useReducedMotion()
  const [ref, naTela] = useNaTela<HTMLDivElement>()
  const ativo = naTela && !reduced

  /* Estado de cada cena = tudo que veio antes + o que ela muda. */
  const ESTADOS = useMemo(() => {
    const out: Estado[] = []
    let atual = BASE
    for (const cena of CENAS) {
      const { dur: _dur, ...muda } = cena
      atual = { ...atual, clique: false, ...muda }
      out.push(atual)
    }
    return out
  }, [])

  const [i, setI] = useState(0)
  const estado = reduced ? ESTADOS[ESTADOS.length - 1] : ESTADOS[i]

  useEffect(() => {
    if (!ativo) return
    const t = setTimeout(() => setI((n) => (n + 1) % CENAS.length), CENAS[i].dur)
    return () => clearTimeout(t)
  }, [i, ativo])

  const tema = useDigitacao(estado.temaAlvo, ativo)
  const titulo = useDigitacao(estado.tituloAlvo, ativo)

  /* Cursor: mede o alvo no DOM, então ele encosta no botão de verdade em
     qualquer largura de tela. */
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => {
    if (!ativo || !estado.alvo) return
    const medir = () => {
      const root = ref.current
      if (!root) return
      const el = root.querySelector<HTMLElement>(`[data-alvo="${estado.alvo}"]`)
      if (!el) return
      const r = el.getBoundingClientRect()
      const rr = root.getBoundingClientRect()
      setCursor({ x: r.left - rr.left + r.width / 2, y: r.top - rr.top + r.height / 2 })
    }
    const raf = requestAnimationFrame(medir)
    window.addEventListener("resize", medir)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", medir)
    }
  }, [i, estado.alvo, estado.tela, estado.painel, ativo, ref])

  const rota = estado.tela === "criar" ? "/dashboard/criar" : "/dashboard/editor"

  return (
    <div ref={ref} className="relative">
      <div className="relative overflow-hidden rounded-2xl border border-border-accent bg-background shadow-card">
        {/* Barra da janela: a rota muda quando a tela muda. */}
        <div className="flex items-center gap-3 border-b border-hairline bg-surface px-4 py-2.5">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((k) => (
              <span key={k} className="h-2.5 w-2.5 rounded-full bg-white/15" />
            ))}
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <span className="truncate rounded-md border border-hairline bg-background px-3 py-1 font-mono text-[10px] tracking-[0.06em] text-text-muted">
              nexuscontentai.com.br
              <span className="text-text-secondary">{rota}</span>
            </span>
          </div>
          <span className="hidden shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-primary sm:flex">
            {estado.salvo ? (
              <>
                <Check className="h-3 w-3" /> Salvo
              </>
            ) : (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="lp-ring-pulse absolute inline-flex h-full w-full rounded-full bg-primary" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                {estado.tela === "criar" ? (estado.gerando >= 0 ? "Gerando" : "Pauta") : "Editando"}
              </>
            )}
          </span>
        </div>

        {/* Altura fixa: a troca de tela não pode empurrar a página. */}
        <div className="relative h-[400px] sm:h-[460px] md:h-[500px]">
          <AnimatePresence mode="wait">
            {estado.tela === "criar" ? (
              <motion.div
                key="criar"
                className="absolute inset-0"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <TelaCriar estado={estado} tema={tema} />
              </motion.div>
            ) : (
              <motion.div
                key="editor"
                className="absolute inset-0"
                initial={reduced ? false : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.21, 0.6, 0.35, 1] }}
              >
                <TelaEditor estado={estado} titulo={titulo} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cursor do usuário */}
          {cursor && (
            <motion.div
              className="pointer-events-none absolute left-0 top-0 z-40"
              animate={{ x: cursor.x, y: cursor.y }}
              transition={{ type: "spring", stiffness: 140, damping: 20, mass: 0.7 }}
            >
              {estado.clique && (
                <motion.span
                  key={i}
                  className="absolute -left-3 -top-3 h-6 w-6 rounded-full border-2 border-brand-400"
                  initial={{ opacity: 0.9, scale: 0.4 }}
                  animate={{ opacity: 0, scale: 1.8 }}
                  transition={{ duration: 0.5 }}
                />
              )}
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                aria-hidden
              >
                <path
                  d="M1 1l5.5 13 2-5.5L14 6.5 1 1z"
                  fill="#fff"
                  stroke="#0A0A12"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Tela 1: /dashboard/criar ─────────────────────────────────────────── */

const STEPS = ["Formato", "Modo", "Estilo", "Ideia", "Aprovar"]

function TelaCriar({ estado, tema }: { estado: Estado; tema: string }) {
  const gerando = estado.gerando >= 0

  return (
    <div className="flex h-full flex-col px-5 py-5 md:px-8 md:py-7">
      {/* Stepper (os mesmos passos do app) */}
      <div className="mb-6 flex items-center justify-center gap-1.5 sm:gap-3">
        {STEPS.map((label, k) => {
          const n = k + 1
          const atual = n === estado.step
          const feito = n < estado.step
          return (
            <div key={label} className="flex items-center gap-1.5 sm:gap-3">
              <span
                className={`flex items-center gap-1 whitespace-nowrap text-[10px] font-medium sm:gap-1.5 sm:text-xs ${
                  atual ? "text-brand-400" : feito ? "text-text-secondary" : "text-text-muted"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2 ${
                    atual
                      ? "bg-brand-500 ring-4 ring-brand-500/30"
                      : feito
                        ? "bg-emerald-500"
                        : "bg-text-muted"
                  }`}
                />
                {label}
              </span>
              {k < STEPS.length - 1 && <span className="h-px w-2.5 bg-hairline sm:w-8" />}
            </div>
          )
        })}
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        {/* Campo da pauta */}
        <div className="rounded-xl border border-hairline bg-surface p-4">
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium">Sobre o que é o carrossel?</span>
            <span className="shrink-0 rounded-full border border-border-accent bg-primary/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
              Marca: Clínica Bella
            </span>
          </div>
          <div
            data-alvo="tema"
            className="mt-2 min-h-[62px] rounded-lg border border-hairline bg-background px-3.5 py-3 text-[14px] leading-relaxed text-foreground"
          >
            {tema}
            {!gerando && (
              <span className="lp-caret ml-0.5 inline-block h-[1.05em] w-[2px] align-[-0.15em] bg-primary" />
            )}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
              Carrossel · 8 slides · Feed 4:5
            </span>
            <span
              data-alvo="gerar"
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-medium text-white"
            >
              {gerando ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {gerando ? "Gerando…" : "Gerar carrossel"}
            </span>
          </div>
        </div>

        {/* Etapas da engine */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {ETAPAS.map((e, k) => {
            const ligada = gerando && k <= estado.gerando
            const feita = gerando && k < estado.gerando
            return (
              <span
                key={e}
                className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors duration-300 ${
                  ligada
                    ? "border-border-accent bg-primary/5 text-primary"
                    : "border-hairline text-text-subtle"
                }`}
              >
                {feita && <Check className="-mt-0.5 mr-1 inline h-2.5 w-2.5" />}
                {e}
              </span>
            )
          })}
        </div>

        {/* Os 8 slides nascendo */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {ROTEIRO.map((p, k) => {
            const pronto = k < estado.prontos
            return (
              <div
                key={p.titulo}
                className="relative aspect-[4/5] overflow-hidden rounded-lg border border-hairline bg-background"
              >
                {pronto ? (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.06, filter: "blur(6px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.4, ease: [0.21, 0.6, 0.35, 1] }}
                  >
                    <MiniSlide peca={p} indice={k} accent={estado.accent} compacto />
                  </motion.div>
                ) : (
                  <div className="grid-bg-fade absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-3.5 w-3.5 text-text-subtle" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-auto pt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          Roteiro, design e imagem · {estado.prontos}/8 slides
        </p>
      </div>
    </div>
  )
}

/* ── Tela 2: o editor ─────────────────────────────────────────────────── */

const SECTIONS = [
  { Icon: Palette, label: "Estilo do carrossel" },
  { Icon: Type, label: "Conteúdo do slide" },
  { Icon: Layers, label: "Elemento selecionado" },
  { Icon: ImageIcon, label: "Imagem" },
  { Icon: Sparkles, label: "Fundo" },
]

const ABAS = [
  { id: "conteudo", Icon: Pencil, label: "Conteúdo" },
  { id: "estilo", Icon: Palette, label: "Estilo" },
  { id: "avancado", Icon: Settings2, label: "Avançado" },
]

function TelaEditor({ estado, titulo }: { estado: Estado; titulo: string }) {
  return (
    <div className="flex h-full">
      {/* Sidebar preta: a mesma do editor (block-panel.tsx) */}
      <aside className="flex w-[164px] shrink-0 flex-col gap-3 overflow-hidden border-r border-white/10 bg-black p-3 sm:w-[190px] md:w-[214px]">
        {/* PanelTopBar */}
        <div className="flex items-center gap-1 px-0.5">
          <span className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
            <Logo size={18} variant="content" showWordmark={false} />
          </span>
          {[
            { id: "elementos", Icon: Plus },
            { id: "editar", Icon: SlidersHorizontal },
            { id: "historico", Icon: History },
          ].map(({ id, Icon }) => {
            const on = id === "editar"
            return (
              <span
                key={id}
                className={`relative flex h-8 w-8 items-center justify-center rounded-lg ${
                  on ? "bg-white/15 text-white" : "text-white/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {id === "historico" && estado.historico > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-semibold text-white">
                    {estado.historico}
                  </span>
                )}
              </span>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {estado.painel === "bloco" ? (
            <motion.div
              key="bloco"
              className="space-y-3"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* BlockEditorShell */}
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 pr-7 text-center text-[13px] font-semibold text-white">
                  Editar Título
                </span>
              </div>

              <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-white/10">
                {ABAS.map(({ id, Icon, label }) => (
                  <span
                    key={id}
                    className={`flex flex-col items-center gap-1 py-2 text-[10px] ${
                      id === "conteudo" ? "bg-white/10 text-white" : "text-white/50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ))}
              </div>

              {/* Campo de texto do bloco */}
              <div className="space-y-1.5">
                <span className="block text-[10px] uppercase tracking-[0.12em] text-white/40">
                  Texto
                </span>
                <div
                  data-alvo="campo"
                  className="min-h-[56px] rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-2 text-[11px] leading-snug text-white"
                >
                  {titulo}
                  <span className="lp-caret ml-0.5 inline-block h-[1em] w-[2px] align-[-0.15em] bg-brand-400" />
                </div>
              </div>

              {/* Cor do destaque */}
              <div className="space-y-1.5">
                <span className="block text-[10px] uppercase tracking-[0.12em] text-white/40">
                  Cor do destaque
                </span>
                <div data-alvo="cor" className="flex gap-1.5">
                  {[ACCENT_PADRAO, ACCENT_NOVO, "#FFFFFF", "#F4B740"].map((c) => (
                    <span
                      key={c}
                      className={`h-6 w-6 rounded-md border-2 transition-colors ${
                        estado.accent === c ? "border-white" : "border-white/15"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <p className="text-[10px] leading-snug text-white/40">
                Editar nunca gasta token.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="editar"
              className="space-y-2"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
            >
              {SECTIONS.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                  <span className="flex-1 truncate text-[11px] font-medium text-white/90">
                    {label}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* Coluna direita: toolbar + filmstrip */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-hairline bg-background/95 px-4 py-2.5">
          <span className="inline-flex h-8 items-center gap-2 rounded-md border border-hairline bg-surface px-2.5 text-[11px] text-text-secondary">
            <Smartphone className="h-3.5 w-3.5" />
            Feed 4:5
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            {(estado.sujo || estado.salvo) && (
              <>
                <span className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary">
                  <Undo2 className="h-3.5 w-3.5" />
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-md text-text-subtle">
                  <Redo2 className="h-3.5 w-3.5" />
                </span>
              </>
            )}

            <AnimatePresence mode="popLayout">
              {estado.sujo && (
                <motion.span
                  key="salvar"
                  data-alvo="salvar"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[11px] font-medium text-white"
                >
                  <Save className="h-3 w-3" />
                  Salvar alterações
                </motion.span>
              )}
              {estado.salvo && (
                <motion.span
                  key="salvo"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-hairline px-3 text-[11px] text-emerald-400"
                >
                  <Check className="h-3 w-3" />
                  Salvo
                </motion.span>
              )}
            </AnimatePresence>

            <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-hairline-strong px-3 text-[11px] text-text-secondary">
              <Download className="h-3 w-3" />
              Baixar Todos
            </span>
          </div>
        </div>

        {/* Filmstrip: o slide ativo é o canvas editável, o resto espia do lado */}
        <div className="flex flex-1 items-center overflow-hidden px-3 sm:px-5">
          <div className="flex w-max items-center gap-4">
            {ROTEIRO.map((p, k) => (
              <div key={p.titulo} className="relative shrink-0">
                {k === 0 ? (
                  <div className="relative w-[168px] overflow-hidden rounded-xl bg-black ring-2 ring-brand-500 sm:w-[196px] md:w-[228px]">
                    <MiniSlide
                      peca={{ ...p, titulo }}
                      indice={0}
                      accent={estado.accent}
                      hover={estado.hover}
                      selecao={estado.selecao}
                      arrastando={estado.arrastando}
                    />
                    {estado.guias && (
                      <span className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-px bg-cyan-400/90" />
                    )}
                  </div>
                ) : (
                  <div className="w-[128px] overflow-hidden rounded-xl border border-hairline bg-black opacity-70 sm:w-[148px] md:w-[172px]">
                    <MiniSlide peca={p} indice={k} accent={estado.accent} />
                  </div>
                )}

                <span className="absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-md bg-black/60 text-[10px] font-semibold tabular-nums text-white">
                  {k + 1}
                </span>

                {k === 0 && (
                  <div className="absolute right-2 top-2 z-10 flex gap-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-black/60 text-white">
                      <Copy className="h-3 w-3" />
                    </span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-black/60 text-white">
                      <Trash2 className="h-3 w-3" />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── O slide ──────────────────────────────────────────────────────────── */

function MiniSlide({
  peca,
  indice,
  accent,
  compacto = false,
  hover = false,
  selecao = false,
  arrastando = false,
}: {
  peca: Peca
  indice: number
  accent: string
  compacto?: boolean
  hover?: boolean
  selecao?: boolean
  arrastando?: boolean
}) {
  const capa = indice === 0

  return (
    <div
      className="relative flex aspect-[4/5] w-full flex-col overflow-hidden"
      style={{ backgroundColor: "#0A0A12" }}
    >
      {/* Glow da marca: é ele que vira quando a cor do destaque muda. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 85% 55% at 15% 105%, ${accent}55 0%, transparent 62%), linear-gradient(155deg, #0A0A12 0%, ${accent}1A 55%, #0A0A12 100%)`,
        }}
      />

      <div className={`relative z-10 flex flex-1 flex-col ${compacto ? "p-2" : "p-3.5"}`}>
        {/* pr-11 na capa do editor: o contador não pode ficar embaixo dos botões
            de duplicar/excluir que o editor desenha no canto. */}
        <div className={`flex items-center justify-between ${capa && !compacto ? "pr-11" : ""}`}>
          <span
            className={`rounded-full border px-1.5 py-0.5 font-semibold uppercase tracking-[0.14em] ${
              compacto ? "text-[5px]" : "text-[7px]"
            }`}
            style={{ borderColor: `${accent}66`, color: accent }}
          >
            {peca.kicker}
          </span>
          <span
            className={`font-semibold tabular-nums tracking-[0.14em] ${
              compacto ? "text-[5px]" : "text-[7px]"
            }`}
            style={{ color: accent }}
          >
            {String(indice + 1).padStart(2, "0")} / 08
          </span>
        </div>

        <div className="mt-auto space-y-1.5">
          {/* O título é o elemento que a animação seleciona e reescreve. */}
          <div
            data-alvo={capa && !compacto ? "titulo" : undefined}
            className={`relative transition-transform duration-500 ${
              arrastando ? "translate-x-[6px]" : ""
            }`}
          >
            {hover && (
              <span className="pointer-events-none absolute -inset-1 rounded-[3px] border border-dashed border-brand-400">
                <span className="absolute -top-[15px] left-0 rounded bg-brand-600 px-1 py-[1px] text-[7px] font-semibold uppercase tracking-wide text-white">
                  Título
                </span>
              </span>
            )}
            {selecao && (
              <span className="pointer-events-none absolute -inset-1 rounded-[3px] border-2 border-brand-500">
                <span className="absolute -top-[15px] left-0 rounded bg-brand-600 px-1 py-[1px] text-[7px] font-semibold uppercase tracking-wide text-white">
                  Título
                </span>
                <span className="absolute -bottom-[5px] -right-[5px] h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-600" />
              </span>
            )}
            <p
              className={`font-black uppercase leading-[0.98] tracking-tight text-white ${
                compacto ? "text-[9px]" : capa ? "text-[15px] md:text-[17px]" : "text-[11px]"
              }`}
            >
              {peca.titulo}
            </p>
          </div>

          {/* Linha de progresso do carrossel (estilo seamless) */}
          <div className="flex gap-[3px] pt-0.5">
            {Array.from({ length: 8 }).map((_, k) => (
              <span
                key={k}
                className="h-[2px] flex-1 rounded-full"
                style={{ backgroundColor: k <= indice ? accent : "rgba(255,255,255,0.18)" }}
              />
            ))}
          </div>

          {peca.corpo && (
            <p
              className={`leading-snug text-white/75 ${
                compacto ? "line-clamp-1 text-[6px]" : "line-clamp-2 text-[8px]"
              }`}
            >
              {peca.corpo}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
