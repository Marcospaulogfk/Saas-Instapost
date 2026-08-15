"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  Check,
  Download,
  FileText,
  Layers,
  Link2,
  MousePointer2,
  Palette,
  Type,
} from "lucide-react"
import { useNaTela } from "./use-na-tela"

/* ── Mockups ────────────────────────────────────────────────────
   Cada recurso é mostrado funcionando, não descrito num card de ícone. */

function MockMarca() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-hairline bg-background px-3 py-2.5">
        <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="font-mono text-[11px] text-text-secondary truncate">
          minhaclinica.com.br
        </span>
        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-primary">
          lido
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { l: "Tom de voz", v: "Acolhedor, sem jargão" },
          { l: "Público", v: "Mulheres 30–45" },
          { l: "Promessa", v: "Resultado sem exagero" },
          { l: "Evitar", v: "Termos médicos crus" },
        ].map((c, i) => (
          <motion.div
            key={c.l}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 * i, duration: 0.4 }}
            className="rounded-lg border border-hairline bg-background p-3"
          >
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted mb-1">
              {c.l}
            </div>
            <div className="text-[12px] text-foreground leading-snug">{c.v}</div>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-hairline bg-background p-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted mr-1">
          Paleta
        </span>
        {["#1668E3", "#0E0E0E", "#F5F2EC", "#5595F1"].map((c, i) => (
          <motion.span
            key={c}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + 0.08 * i, type: "spring", stiffness: 300, damping: 18 }}
            className="h-6 w-6 rounded-md border border-hairline-strong"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  )
}

function MockRoteiro() {
  const linhas = [
    { n: "01", t: "Você posta todo dia e o alcance não sobe", tag: "gancho" },
    { n: "02", t: "O problema não é o algoritmo", tag: "virada" },
    { n: "03", t: "É a falta de padrão visual", tag: "tese" },
    { n: "04", t: "Veja o que muda em 7 dias", tag: "prova" },
    { n: "08", t: "Comece hoje — link na bio", tag: "cta" },
  ]
  return (
    <div className="space-y-2">
      {linhas.map((l, i) => (
        <motion.div
          key={l.n}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 * i, duration: 0.4 }}
          className="flex items-center gap-3 rounded-lg border border-hairline bg-background px-3 py-2.5"
        >
          <span className="font-mono text-[10px] tabular-nums text-primary">{l.n}</span>
          <span className="text-[13px] text-foreground truncate flex-1">{l.t}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted shrink-0">
            {l.tag}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function MockImagem() {
  const imgs = [
    "/refs-posts-unicos/beauty/03/referencia.jpg",
    "/refs-posts-unicos/fitness/01/referencia.jpg",
    "/refs-posts-unicos/comercial/03/referencia.jpg",
  ]
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-hairline bg-background px-3 py-2.5">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted mb-1.5">
          Prompt montado pela engine
        </div>
        <p className="text-[12px] text-text-secondary leading-relaxed">
          retrato editorial, luz lateral quente, fundo texturizado, paleta da marca,
          espaço negativo à direita para o título
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {imgs.map((src, i) => (
          <motion.div
            key={src}
            initial={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            transition={{ delay: 0.2 + 0.18 * i, duration: 0.6 }}
            className="relative aspect-[4/5] rounded-lg overflow-hidden border border-hairline"
          >
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function MockEditor() {
  return (
    <div className="grid grid-cols-[1.3fr_1fr] gap-3">
      {/* canvas */}
      <div className="relative aspect-[4/5] rounded-lg border border-hairline bg-background overflow-hidden">
        <img
          src="/refs-posts-unicos/informativo/02/referencia.jpg"
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        {/* caixa de seleção */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="absolute left-[10%] right-[10%] bottom-[16%] h-[26%] border-2 border-primary rounded-sm"
        >
          {["-top-1 -left-1", "-top-1 -right-1", "-bottom-1 -left-1", "-bottom-1 -right-1"].map((p) => (
            <span
              key={p}
              className={`absolute ${p} h-2 w-2 rounded-[2px] bg-primary border border-white/70`}
            />
          ))}
        </motion.div>
        <motion.div
          initial={{ x: -20, y: 30, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="absolute left-[42%] bottom-[22%]"
        >
          <MousePointer2 className="w-4 h-4 text-white drop-shadow" fill="white" />
        </motion.div>
      </div>
      {/* painel de propriedades */}
      <div className="space-y-2">
        {[
          { icon: Type, l: "Fonte", v: "Anton · 64" },
          { icon: Palette, l: "Cor", v: "#1668E3" },
          { icon: Layers, l: "Camada", v: "Título" },
        ].map((r, i) => (
          <motion.div
            key={r.l}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + 0.1 * i, duration: 0.35 }}
            className="flex items-center gap-2 rounded-lg border border-hairline bg-background px-2.5 py-2"
          >
            <r.icon className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-muted">
              {r.l}
            </span>
            <span className="ml-auto font-mono text-[10px] text-foreground truncate">{r.v}</span>
          </motion.div>
        ))}
        <div className="rounded-lg border border-hairline bg-background p-2.5">
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-muted mb-2">
            Posição
          </div>
          <div className="h-1 rounded-full bg-hairline relative">
            <motion.span
              initial={{ width: "30%" }}
              animate={{ width: "68%" }}
              transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function MockExport() {
  const arquivos = ["slide-01.png", "slide-02.png", "slide-03.png", "slide-04.png"]
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between rounded-lg border border-border-accent bg-background px-3 py-2.5">
        <span className="flex items-center gap-2 text-[13px] text-foreground">
          <Download className="w-3.5 h-3.5 text-primary" />
          carrossel-marca.zip
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
          1080×1350
        </span>
      </div>
      {arquivos.map((a, i) => (
        <motion.div
          key={a}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 * i, duration: 0.35 }}
          className="flex items-center gap-2.5 rounded-lg border border-hairline bg-background px-3 py-2"
        >
          <FileText className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span className="font-mono text-[11px] text-text-secondary">{a}</span>
          <Check className="w-3.5 h-3.5 text-primary ml-auto" />
        </motion.div>
      ))}
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted pt-1">
        PNG nomeado por slide · sem marca d&apos;água nos planos pagos
      </p>
    </div>
  )
}

/* ── Recursos ──────────────────────────────────────────────────── */

const RECURSOS = [
  {
    id: "marca",
    aba: "Treino de marca",
    kicker: "Aprende uma vez",
    titulo: "Manda o link do seu site. A IA faz o resto.",
    desc:
      "Ela lê a página, extrai tom de voz, público, promessa e paleta — e passa a aplicar isso em todo carrossel. Sem rebriefing a cada post.",
    bullets: ["Várias marcas na mesma conta", "Palavras proibidas e referências de escrita"],
    mock: MockMarca,
  },
  {
    id: "roteiro",
    aba: "Roteiro",
    kicker: "Uma ideia por slide",
    titulo: "Roteiro com gancho, virada e CTA — não texto solto.",
    desc:
      "A engine escreve em português de verdade, com estrutura de retenção: o slide 1 segura o dedo, o último converte.",
    bullets: ["8 slides com função definida", "Reescreve qualquer slide em 1 clique"],
    mock: MockRoteiro,
  },
  {
    id: "imagem",
    aba: "Imagem",
    kicker: "Sem cara de banco de imagem",
    titulo: "Imagens montadas pro seu território visual.",
    desc:
      "O prompt é construído a partir da sua marca — luz, paleta e enquadramento com espaço pro texto. Flux e Nano Banana 2 na geração.",
    bullets: ["Espaço negativo reservado pro título", "Direitos comerciais inclusos"],
    mock: MockImagem,
  },
  {
    id: "editor",
    aba: "Editor",
    kicker: "Controle total",
    titulo: "Clicou, arrastou, mudou. Igual num editor de verdade.",
    desc:
      "Selecione qualquer elemento do slide e ajuste fonte, tamanho, cor e posição. Sem precisar abrir o Canva pra corrigir uma vírgula.",
    bullets: ["Seleção, arraste e redimensionamento", "Identidade editável por slide"],
    mock: MockEditor,
  },
  {
    id: "export",
    aba: "Export",
    kicker: "Pronto pro feed",
    titulo: "Full HD em 4:5, ou o carrossel inteiro em ZIP.",
    desc:
      "Exporta na resolução nativa do Instagram, com os slides nomeados na ordem certa. É só subir.",
    bullets: ["PNG 1080×1350 por slide", "ZIP do carrossel completo"],
    mock: MockExport,
  },
]

export function FeatureShowcase() {
  const reduced = useReducedMotion()
  const [ref, naTela] = useNaTela<HTMLDivElement>()
  const [ativo, setAtivo] = useState(0)
  const [pausado, setPausado] = useState(false)

  /* Auto-avanço: a seção se apresenta sozinha; o clique assume o controle. */
  useEffect(() => {
    if (reduced || pausado || !naTela) return
    const t = setTimeout(() => setAtivo((a) => (a + 1) % RECURSOS.length), 7000)
    return () => clearTimeout(t)
  }, [ativo, pausado, reduced, naTela])

  const atual = RECURSOS[ativo]
  const Mock = atual.mock

  return (
    <div ref={ref} onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}>
      {/* Abas */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {RECURSOS.map((r, i) => (
          <button
            key={r.id}
            onClick={() => setAtivo(i)}
            aria-pressed={i === ativo}
            className={`relative rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
              i === ativo
                ? "border-border-accent text-foreground bg-surface"
                : "border-hairline text-text-muted hover:text-text-secondary hover:border-hairline-strong"
            }`}
          >
            {i === ativo && !reduced && !pausado && (
              <motion.span
                key={`prog-${ativo}`}
                className="absolute bottom-0 left-4 right-4 h-px bg-primary origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 7, ease: "linear" }}
              />
            )}
            {r.aba}
          </button>
        ))}
      </div>

      {/* Painel */}
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`txt-${atual.id}`}
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary mb-4">
              {atual.kicker}
            </div>
            <h3 className="lp-display text-2xl md:text-[2rem] leading-[1.15] mb-4">
              {atual.titulo}
            </h3>
            <p className="text-text-secondary leading-relaxed mb-6">{atual.desc}</p>
            <ul className="space-y-2.5">
              {atual.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>

        <div className="relative rounded-2xl border border-border-accent bg-surface border-t-2 border-t-primary p-5 shadow-card min-h-[380px] flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-hairline">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              Nexus Content / {atual.aba}
            </span>
            <span className="flex gap-1.5">
              {RECURSOS.map((r, i) => (
                <span
                  key={r.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === ativo ? "w-5 bg-primary" : "w-1.5 bg-hairline-strong"
                  }`}
                />
              ))}
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`mock-${atual.id}`}
              initial={reduced ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <Mock />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
