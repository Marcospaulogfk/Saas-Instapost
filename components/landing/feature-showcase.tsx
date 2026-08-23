"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  Check,
  ChevronDown,
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

function MockEstilos() {
  /* Os nomes são os mesmos que aparecem no seletor do editor
     (STYLE_OPTIONS em components/carousel/carousel-editor.tsx): o visitante
     encontra na plataforma exatamente o que viu aqui. Antes eram 6 nomes
     inventados, enquanto a copy ao lado prometia 8. */
  const estilos = [
    { n: "Gradiente", bg: "#0B0B10", fg: "#5595F1" },
    { n: "Minimal", bg: "#F5F2EC", fg: "#0E0E0E" },
    { n: "Revista", bg: "#151020", fg: "#E8DCC8" },
    { n: "MyPostFlow", bg: "#1668E3", fg: "#FFFFFF" },
    { n: "Wesley", bg: "#2A1D18", fg: "#FFD9B0" },
    { n: "Bolo", bg: "#FAF8F5", fg: "#0E0E0E" },
    { n: "Seamless", bg: "#0E1116", fg: "#7FE3C0" },
    { n: "Perfil", bg: "#FFFFFF", fg: "#1668E3" },
  ]
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {estilos.map((e, i) => (
        <motion.div
          key={e.n}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 * i, duration: 0.35 }}
          className="overflow-hidden rounded-lg border border-hairline"
        >
          <div
            className="flex aspect-[4/5] flex-col justify-end gap-1.5 p-2.5"
            style={{ backgroundColor: e.bg }}
          >
            <span className="h-1.5 w-4/5 rounded-full" style={{ backgroundColor: e.fg }} />
            <span
              className="h-1.5 w-1/2 rounded-full opacity-50"
              style={{ backgroundColor: e.fg }}
            />
          </div>
          <div className="bg-background px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-text-muted">
            {e.n}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function MockPostUnico() {
  return (
    <div className="grid grid-cols-[1fr_1.1fr] items-center gap-3">
      <div className="space-y-2">
        {["Anúncio de promoção", "Dica rápida", "Prova social"].map((t, i) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.35 }}
            className={`rounded-lg border px-3 py-2.5 text-[12px] ${
              i === 0
                ? "border-border-accent bg-background text-foreground"
                : "border-hairline bg-background text-text-muted"
            }`}
          >
            {t}
          </motion.div>
        ))}
        <div className="pt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">
          1 peça · 1 crédito
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.45 }}
        className="relative aspect-[4/5] overflow-hidden rounded-lg border border-hairline"
      >
        <img
          src="/refs-posts-unicos/comercial/01/referencia.jpg"
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </motion.div>
    </div>
  )
}

/* ── Recursos ──────────────────────────────────────────────────
   Estrutura espelhada da referência aprovada (mypostflow/#recursos):
   barra de abas segmentada em cima, palco branco com copy à esquerda e
   mockup à direita, e acordeão no mobile. O que muda é o conteúdo — e o
   acento, que aqui é o azul da marca no lugar do gradiente do Instagram. */

const RECURSOS = [
  {
    id: "marca",
    aba: "Treino de marca",
    Icone: Link2,
    chip: "Aprende uma vez",
    titulo: "Manda o link do seu site.",
    destaque: "A IA faz o resto.",
    desc: "Ela lê a página, extrai tom de voz, público, promessa e paleta — e passa a aplicar isso em todo carrossel. Sem rebriefing a cada post.",
    bullets: [
      "Várias marcas na mesma conta",
      "Palavras proibidas e referências de escrita",
      "Some do zero: 3 perguntas se você não tem site",
    ],
    mock: MockMarca,
  },
  {
    id: "roteiro",
    aba: "Roteiro que segura",
    Icone: FileText,
    chip: "Uma ideia por slide",
    titulo: "Gancho, virada e CTA —",
    destaque: "não texto solto.",
    desc: "A engine escreve em português de verdade, com estrutura de retenção: o slide 1 segura o dedo, o último converte.",
    bullets: [
      "8 slides com função definida",
      "Reescreve qualquer slide em 1 clique",
      "Legenda e hashtags saem junto",
    ],
    mock: MockRoteiro,
  },
  {
    id: "imagem",
    aba: "Imagem da sua marca",
    Icone: Palette,
    chip: "Sem cara de banco de imagem",
    titulo: "Imagens montadas pro",
    destaque: "seu território visual.",
    desc: "O prompt é construído a partir da sua marca — luz, paleta e enquadramento com espaço pro texto. Flux e Nano Banana 2 na geração.",
    bullets: [
      "Espaço negativo reservado pro título",
      "Direitos comerciais inclusos",
      "Foto real via banco aberto quando o tema pede",
    ],
    mock: MockImagem,
  },
  {
    id: "editor",
    aba: "Editor no slide",
    Icone: MousePointer2,
    chip: "Controle total",
    titulo: "Clicou, arrastou, mudou.",
    destaque: "Igual num editor de verdade.",
    desc: "Selecione qualquer elemento do slide e ajuste fonte, tamanho, cor e posição. Sem precisar abrir o Canva pra corrigir uma vírgula.",
    bullets: [
      "Seleção, arraste e redimensionamento",
      "Identidade editável por slide",
      "Trocar a imagem sem refazer o carrossel",
    ],
    mock: MockEditor,
  },
  {
    id: "estilos",
    aba: "8 estilos de carrossel",
    Icone: Layers,
    chip: "Escala com padrão",
    titulo: "Oito territórios visuais,",
    destaque: "um clique cada.",
    desc: "Do dark vibrante ao minimal suíço — layouts inspirados em quem viraliza, já ajustados à sua paleta e tipografia.",
    bullets: [
      "Troca de estilo sem refazer o roteiro",
      "Tipografia e cor herdadas da marca",
      "Mesmo padrão em todas as peças do mês",
    ],
    mock: MockEstilos,
  },
  {
    id: "post-unico",
    aba: "Post único",
    Icone: Type,
    chip: "Peça avulsa",
    titulo: "Nem todo dia pede carrossel.",
    destaque: "Às vezes é um post só.",
    desc: "Mesmo processo, uma peça: você escolhe o objetivo, a engine monta a arte e você edita direto no canvas.",
    bullets: [
      "Objetivo define o layout",
      "Editável no mesmo editor do carrossel",
      "Custa uma fração de um carrossel completo",
    ],
    mock: MockPostUnico,
  },
  {
    id: "export",
    aba: "Export pro feed",
    Icone: Download,
    chip: "Pronto pra postar",
    titulo: "Full HD em 4:5, ou o",
    destaque: "carrossel inteiro em ZIP.",
    desc: "Exporta na resolução nativa do Instagram, com os slides nomeados na ordem certa. É só subir.",
    bullets: [
      "PNG 1080×1350 por slide",
      "ZIP do carrossel completo",
      "Sem marca d'água nos planos pagos",
    ],
    mock: MockExport,
  },
]

export function FeatureShowcase() {
  const reduced = useReducedMotion()
  const [ref, naTela] = useNaTela<HTMLDivElement>()
  const [ativo, setAtivo] = useState(0)
  const [pausado, setPausado] = useState(false)
  const [aberto, setAberto] = useState(0)

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
      {/* ── Desktop: barra de abas + palco ─────────────────────── */}
      <div className="hidden md:block">
        <div
          role="tablist"
          aria-label="Recursos do Nexus Content"
          className="no-scrollbar flex gap-1 overflow-x-auto rounded-[20px] border border-hairline bg-surface p-[5px] shadow-[0_8px_30px_-18px_rgba(0,0,0,0.35)]"
        >
          {RECURSOS.map((r, i) => {
            const on = i === ativo
            return (
              <button
                key={r.id}
                role="tab"
                aria-selected={on}
                onClick={() => setAtivo(i)}
                className="relative flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-2xl px-1.5 pb-[11px] pt-3 transition-colors hover:bg-surface-2"
              >
                <span
                  className={`grid h-[38px] w-[38px] place-items-center rounded-[11px] border transition-all duration-300 ${
                    on
                      ? "border-transparent bg-[linear-gradient(135deg,#1668E3_0%,#4C8DF5_55%,#7A5BFF_100%)] text-white"
                      : "border-hairline bg-surface-2 text-text-muted"
                  }`}
                >
                  <r.Icone className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span
                  className={`flex min-h-[2.6em] max-w-[88px] items-center justify-center text-center text-[10px] font-semibold leading-tight transition-colors ${
                    on ? "lp-text-gradient" : "text-text-muted"
                  }`}
                >
                  {r.aba}
                </span>

                {on && !reduced && !pausado && (
                  <motion.span
                    key={`prog-${ativo}`}
                    className="absolute inset-x-3 bottom-0 h-[2px] origin-left rounded-full bg-primary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 7, ease: "linear" }}
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-7 overflow-hidden rounded-[28px] border border-hairline bg-surface shadow-[0_24px_70px_-34px_rgba(0,0,0,0.5),0_8px_24px_-12px_rgba(0,0,0,0.25)]">
          <div className="grid min-h-[460px] lg:grid-cols-[0.95fr_1.15fr]">
            {/* Copy */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`info-${atual.id}`}
                initial={reduced ? false : { opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? undefined : { opacity: 0, x: 10 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col justify-center px-9 py-10"
              >
                <span className="w-fit rounded-full border border-primary/30 bg-primary/[0.07] px-3 py-[5px] text-[10px] font-bold uppercase tracking-[0.14em] lp-text-gradient">
                  {atual.chip}
                </span>

                <h3 className="mt-3.5 text-[28px] font-normal leading-[1.15] tracking-[-0.02em] text-foreground">
                  {atual.titulo} <span className="lp-text-gradient">{atual.destaque}</span>
                </h3>

                <p className="mt-3.5 text-[15px] leading-[1.65] text-text-secondary">
                  {atual.desc}
                </p>

                <ul className="mt-[22px] flex flex-col gap-2.5">
                  {atual.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm leading-[1.5] text-text-secondary">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            {/* Mockup */}
            <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden border-l border-hairline bg-surface p-6">
              <div className="pointer-events-none absolute -right-[20%] -top-[30%] h-[70%] w-[70%] rounded-full bg-[radial-gradient(circle,rgba(22,104,227,0.14)_0%,rgba(122,91,255,0.08)_45%,transparent_68%)]" />
              <div className="pointer-events-none absolute -bottom-[30%] -left-[20%] h-[70%] w-[70%] rounded-full bg-[radial-gradient(circle,rgba(76,141,245,0.12)_0%,rgba(22,104,227,0.06)_45%,transparent_68%)]" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={`mock-${atual.id}`}
                  initial={reduced ? false : { opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? undefined : { opacity: 0, x: -10 }}
                  transition={{ duration: 0.45, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full"
                >
                  <Mock />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: acordeão ───────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:hidden">
        {RECURSOS.map((r, i) => {
          const on = i === aberto
          return (
            <div
              key={r.id}
              className={`overflow-hidden rounded-[18px] border bg-surface transition-colors ${
                on ? "border-border-accent shadow-[0_4px_20px_rgba(22,104,227,0.12)]" : "border-hairline"
              }`}
            >
              <button
                type="button"
                onClick={() => setAberto(on ? -1 : i)}
                aria-expanded={on}
                className="flex w-full items-center gap-3.5 px-[18px] py-4 text-left"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border transition-all ${
                    on
                      ? "border-transparent bg-[linear-gradient(135deg,#1668E3_0%,#4C8DF5_55%,#7A5BFF_100%)] text-white"
                      : "border-hairline bg-surface-2 text-text-muted"
                  }`}
                >
                  <r.Icone className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span className="flex-1 text-[15px] font-medium leading-tight">{r.aba}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                    on ? "rotate-180 text-primary" : "text-text-subtle"
                  }`}
                />
              </button>

              {/* 0fr → 1fr: anima altura sem medir nada em JS */}
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: on ? "1fr" : "0fr" }}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="px-[18px] pb-5">
                    <span className="inline-block rounded-full border border-primary/25 bg-primary/[0.06] px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-[0.07em] text-primary">
                      {r.chip}
                    </span>
                    <p className="mt-2.5 text-[13px] leading-[1.65] text-text-secondary">
                      {r.desc}
                    </p>
                    <ul className="mt-3.5 flex flex-col gap-[7px]">
                      {r.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-xs leading-[1.45] text-text-muted">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" strokeWidth={2.5} />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 rounded-[20px] border border-hairline bg-surface-2 p-2">
                      <r.mock />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
