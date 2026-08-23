"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Check, ImageIcon, Sparkles } from "lucide-react"
import { useNaTela } from "./use-na-tela"

/* Temas que o campo "digita" sozinho — linguagem de cliente real, não de demo. */
const TEMAS = [
  "5 erros que matam o alcance do seu perfil",
  "por que sua oferta não converte no story",
  "3 rituais de skincare pro verão",
]

/* Miniaturas dos slides. Ver aviso em proof-wall.tsx: as imagens de
   /refs-posts-unicos são referências de design, não output da engine. */
const SLIDES = [
  "/refs-posts-unicos/Profissional/01/referencia.jpg",
  "/refs-posts-unicos/informativo/01/referencia.jpg",
  "/refs-posts-unicos/comercial/02/referencia.jpg",
  "/refs-posts-unicos/fitness/03/referencia.jpg",
  "/refs-posts-unicos/beauty/04/referencia.jpg",
  "/refs-posts-unicos/informativo/03/referencia.jpg",
  "/refs-posts-unicos/comercial/04/referencia.jpg",
  "/refs-posts-unicos/Profissional/03/referencia.jpg",
]

const ETAPAS = ["Lendo a marca", "Escrevendo o roteiro", "Gerando imagens", "Montando slides"]

type Fase = "digitando" | "gerando" | "pronto"

/**
 * Mockup vivo da engine no hero: digita o tema, dispara a geração e preenche
 * os 8 slides um a um. É o produto acontecendo — não um print parado.
 */
export function HeroEngine() {
  const reduced = useReducedMotion()
  const [ref, naTela] = useNaTela<HTMLDivElement>()
  const [ciclo, setCiclo] = useState(0)
  const [fase, setFase] = useState<Fase>("digitando")
  const [digitado, setDigitado] = useState("")
  const [prontos, setProntos] = useState(0)
  const [etapa, setEtapa] = useState(0)

  const tema = TEMAS[ciclo % TEMAS.length]

  /* Sem movimento: mostra o estado final, completo e legível. */
  useEffect(() => {
    if (!reduced) return
    setDigitado(TEMAS[0])
    setFase("pronto")
    setProntos(SLIDES.length)
    setEtapa(ETAPAS.length - 1)
  }, [reduced])

  /* Fase 1 — digitação caractere a caractere. */
  useEffect(() => {
    if (reduced || !naTela || fase !== "digitando") return
    if (digitado.length === tema.length) {
      const t = setTimeout(() => setFase("gerando"), 600)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setDigitado(tema.slice(0, digitado.length + 1)), 38)
    return () => clearTimeout(t)
  }, [digitado, tema, fase, reduced, naTela])

  /* Fase 2 — slides entram um a um; a etapa acompanha o progresso. */
  useEffect(() => {
    if (reduced || !naTela || fase !== "gerando") return
    if (prontos === SLIDES.length) {
      const t = setTimeout(() => setFase("pronto"), 500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setProntos((n) => n + 1)
      setEtapa(Math.min(Math.floor(((prontos + 1) / SLIDES.length) * ETAPAS.length), ETAPAS.length - 1))
    }, 320)
    return () => clearTimeout(t)
  }, [prontos, fase, reduced, naTela])

  /* Fase 3 — segura o resultado e recomeça com outro tema. */
  useEffect(() => {
    if (reduced || !naTela || fase !== "pronto") return
    const t = setTimeout(() => {
      setCiclo((c) => c + 1)
      setDigitado("")
      setProntos(0)
      setEtapa(0)
      setFase("digitando")
    }, 3400)
    return () => clearTimeout(t)
  }, [fase, reduced, naTela])

  const gerando = fase === "gerando"

  return (
    <div ref={ref} className="relative">
      {/* Painel principal */}
      <div className="relative rounded-2xl border border-border-accent bg-surface border-t-2 border-t-primary p-4 shadow-card">
        {/* Chrome */}
        <div className="flex items-center justify-between px-1 pb-3 border-b border-hairline">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
            Nexus Content / Engine
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] flex items-center gap-1.5">
            {fase === "pronto" ? (
              <span className="flex items-center gap-1.5 text-primary">
                <Check className="w-3 h-3" /> Pronto
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-primary">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="lp-ring-pulse absolute inline-flex h-full w-full rounded-full bg-primary" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                {gerando ? "Gerando" : "Aguardando tema"}
              </span>
            )}
          </span>
        </div>

        {/* Campo de tema — digitando */}
        <div className="mt-4 rounded-xl border border-hairline bg-background px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted mb-2">
            Tema do carrossel
          </div>
          <div className="text-[15px] text-foreground min-h-[1.5em] leading-snug">
            {digitado}
            {fase === "digitando" && (
              <span className="lp-caret inline-block w-[2px] h-[1.05em] align-[-0.15em] bg-primary ml-0.5" />
            )}
          </div>
        </div>

        {/* Etapas da engine */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ETAPAS.map((e, i) => {
            const ativa = fase !== "digitando" && i <= etapa
            const concluida = fase === "pronto" || i < etapa
            return (
              <span
                key={e}
                className={`font-mono text-[9px] uppercase tracking-[0.12em] rounded-full border px-2.5 py-1 transition-colors duration-300 ${
                  ativa
                    ? "border-border-accent text-primary bg-primary/5"
                    : "border-hairline text-text-subtle"
                }`}
              >
                {concluida && <Check className="inline w-2.5 h-2.5 mr-1 -mt-0.5" />}
                {e}
              </span>
            )
          })}
        </div>

        {/* Grade dos 8 slides */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {SLIDES.map((src, i) => {
            const feito = i < prontos
            return (
              <div
                key={src}
                className="relative aspect-[4/5] rounded-lg border border-hairline bg-background overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  {feito ? (
                    <motion.img
                      key={`${ciclo}-img-${i}`}
                      src={src}
                      alt=""
                      /* miniaturas de ~14 KB no topo da página: carregar já evita
                         o slide aparecer vazio no meio da animação */
                      loading="eager"
                      className="absolute inset-0 h-full w-full object-cover"
                      initial={reduced ? false : { opacity: 0, scale: 1.08, filter: "blur(8px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      transition={{ duration: 0.45, ease: [0.21, 0.6, 0.35, 1] }}
                    />
                  ) : (
                    <motion.div
                      key={`${ciclo}-skel-${i}`}
                      className="absolute inset-0 grid-bg-fade flex items-center justify-center"
                      exit={{ opacity: 0 }}
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-text-subtle" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <span className="absolute top-1 left-1.5 font-mono text-[8px] tracking-widest text-white/80 mix-blend-difference">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            )
          })}
        </div>

        {/* Rodapé de status */}
        <div className="mt-3 flex items-center justify-between px-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted tabular-nums">
            PT-BR · {prontos}/8 slides · 4:5
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted tabular-nums">
            {fase === "pronto" ? "2.8s" : `${(prontos * 0.35).toFixed(1)}s`}
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="mt-2 h-[3px] rounded-full bg-hairline overflow-hidden">
          <motion.div
            className="h-full bg-gradient-brand"
            animate={{ width: `${(prontos / SLIDES.length) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Card flutuante — marca aprendida */}
      <div className="lp-float absolute -bottom-7 -left-5 hidden sm:block rounded-xl border border-border-accent bg-surface-2 border-t-2 border-t-primary p-3.5 w-56 shadow-card">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted mb-2.5">
          Marca aprendida
        </div>
        <div className="space-y-1.5">
          {["Tom · direto e confiante", "Paleta · azul + neutros", "Público · PMEs"].map((r) => (
            <div key={r} className="flex items-center gap-2 text-[11px] text-text-secondary">
              <Check className="w-3 h-3 text-primary shrink-0" />
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* Card flutuante — velocidade */}
      <div className="lp-float-slow absolute -top-6 -right-4 hidden sm:flex items-center gap-2 rounded-xl border border-border-accent bg-surface-2 border-t-2 border-t-primary px-3.5 py-3 shadow-card">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-secondary">
          8 slides · 3 min
        </span>
      </div>
    </div>
  )
}
