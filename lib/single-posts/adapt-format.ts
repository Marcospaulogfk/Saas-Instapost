/**
 * Adaptar formato — converte uma arte já composta entre Feed 4:5, Stories 9:16
 * e Quadrado 1:1 REPOSICIONANDO as camadas. Custo: ZERO token.
 *
 * # Por que dá pra fazer sem IA
 *
 * O concorrente (BestContent) cobra 10 créditos e REGENERA a arte do zero pra
 * mudar o formato — porque a peça dele é um bitmap: não existe "mover o
 * título", existe "desenhar de novo", e o design muda. A nossa peça é um
 * FreePostSpec: camadas HTML com âncora declarada. Mudar de formato aqui é
 * aritmética no eixo vertical, não geração.
 *
 * Duas propriedades do spec fazem o determinístico funcionar:
 *
 * 1. **Os três formatos têm 1080px de largura.** Toda âncora horizontal
 *    (`left`, `width`, `right`, `center_x`) — em `%`, `cqw` ou px — aponta pro
 *    mesmo pixel nos três. Este módulo NÃO toca no eixo X.
 * 2. **O eixo Y é o único problema**, e é um problema de distribuição: sobra
 *    espaço (story) ou falta (quadrado).
 *
 * # A regra de ouro: respirar, não esticar
 *
 * Ao CRESCER (4:5 → 9:16, +570px) seria errado escalar tudo por 1,42: o título
 * viraria um outdoor e a foto deformaria a composição. O que o formato alto
 * pede é ar. Então o extra vira, nesta ordem: respiro entre os blocos (metade)
 * e margem de segurança (o resto) — e os tamanhos ficam intactos.
 *
 * Ao ENCOLHER (4:5 → 1:1, -270px) o caminho é o inverso e tem ordem de
 * prioridade: primeiro come a folga das margens (barato, invisível), e só o
 * que sobrar comprime a faixa de conteúdo — aí sim reduzindo TAMANHO junto com
 * espaçamento, porque comprimir posição sem comprimir corpo de fonte é como se
 * garante colisão de texto.
 *
 * # Por que a mesma constante escala posição e tamanho
 *
 * Quando o fator `k` < 1 é aplicado às posições E às alturas, a faixa inteira
 * vira uma homotetia: dois blocos que não se tocavam continuam não se tocando,
 * por construção. É isso que dispensa detecção de colisão — a compressão é
 * geometricamente segura, não "esperamos que caiba".
 *
 * # Medição
 *
 * O melhor número de altura é o real: no editor a arte está renderizada, então
 * `measureSpecBlocks()` lê o retângulo de cada camada no DOM e a adaptação fica
 * exata. Fora do DOM (servidor, spec recém-carregado) cai numa estimativa
 * tipográfica — a mesma régua da crítica de `compose.ts`, reescrita aqui em px
 * porque importar de `compose.ts` arrastaria o SDK da Anthropic pro bundle do
 * cliente.
 */
import type { FreeBlock, FreePostSpec } from "./free-spec"
import { POST_FORMATS, type PostFormat } from "./formats"

const CANVAS_W = 1080
/** 1cqw em px. Constante nos três formatos — é o que salva a adaptação. */
const CQW = CANVAS_W / 100

/**
 * Quanto do espaço que sobra vira respiro ENTRE os blocos (o resto vira
 * margem). Metade porque o extremo de cada lado erra: 0 empilha a peça toda no
 * meio de um canvas vazio, 1 esparrama a composição e quebra a leitura de
 * grupo (kicker colado na headline é intencional, não sobra de espaço).
 */
const BREATHE_SHARE = 0.5

/** Piso de compressão. Abaixo disso o texto fica pequeno demais pra Instagram. */
const MIN_COMPRESSION = 0.72

/** Respiro entre uma faixa colada na borda e o conteúdo que vem depois. */
const BAND_GAP = 16

// =============================================================================
// Unidades
// =============================================================================

/**
 * Converte uma medida do spec pra px.
 *
 * `axisPx` é o tamanho do eixo a que o `%` se refere (altura do canvas pro eixo
 * Y). `cqw` SEMPRE mede na largura, mesmo no eixo vertical — é assim que o
 * editor grava o `top` ao arrastar.
 */
function toPx(v: unknown, axisPx: number): number | null {
  if (typeof v === "number") return v
  if (typeof v !== "string") return null
  const s = v.trim()
  // "min(7cqw, 48px)" e afins são expressões de tamanho de fonte, não âncora.
  if (/[a-z]\(/i.test(s)) return null
  const m = s.match(/^(-?[\d.]+)\s*(%|cqw|px)?$/i)
  if (!m) return null
  const n = parseFloat(m[1])
  if (Number.isNaN(n)) return null
  const unit = (m[2] ?? "px").toLowerCase()
  if (unit === "cqw") return n * CQW
  if (unit === "%") return (n / 100) * axisPx
  return n
}

/**
 * Emite em `cqw`. É a unidade certa pra saída: como cqw mede na largura e a
 * largura é a mesma nos três formatos, o valor gravado é um px absoluto que não
 * se move sozinho se o spec for reaberto noutro canvas.
 */
function cqw(px: number): string {
  return `${Math.round((px / CQW) * 100) / 100}cqw`
}

/**
 * Multiplica uma medida CSS qualquer sem precisar interpretá-la.
 *
 * Quando o valor JÁ é um `calc(X * n)` que esta função emitiu, o fator novo é
 * multiplicado no `n` em vez de embrulhar tudo num calc a mais. Sem isso cada
 * troca de formato acrescentava um nível — seis idas e voltas levavam um
 * `gap` de 14 para 98 caracteres, e a string crescia sem teto (ela viaja no
 * JSONB do post salvo). O resultado renderizado é o mesmo; o que muda é não
 * acumular lixo.
 */
const CALC_ESCALADO = /^calc\((.+) \* ([\d.]+)\)$/

function scaleCss(v: string | number | undefined, f: number): string | undefined {
  if (v === undefined || v === null) return undefined
  if (typeof v === "number") return `${Math.round(v * f * 100) / 100}px`
  const arredonda = (n: number) => Math.round(n * 1000) / 1000
  const m = v.match(CALC_ESCALADO)
  if (m) {
    const combinado = arredonda(parseFloat(m[2]) * f)
    // Voltou ao tamanho original (round-trip): devolve a medida limpa.
    if (combinado === 1) return m[1]
    return `calc(${m[1]} * ${combinado})`
  }
  if (arredonda(f) === 1) return v
  return `calc(${v} * ${arredonda(f)})`
}

/** Valor em cqw dentro de "min(Xcqw, Ypx)" ou "Xcqw". */
function cqwOf(size: string | undefined, fallback: number): number {
  if (!size) return fallback
  const m = size.match(/([\d.]+)\s*cqw/i)
  return m ? parseFloat(m[1]) : fallback
}

// =============================================================================
// Estimativa de altura (fallback quando não há DOM)
// =============================================================================

/**
 * Altura aproximada de um bloco em fluxo, em px, dada a largura útil da coluna.
 * Espelha `estimateBlockHeightPct` de compose.ts (mesma régua de 0,65 char/cqw,
 * deliberadamente pessimista) — aqui em px porque a adaptação trabalha em px.
 */
function estimateHeightPx(b: FreeBlock, colWidthPx: number): number {
  switch (b.type) {
    case "text": {
      const f = cqwOf(b.font_size, 3.5) * (b.font_size_scale ?? 1) * CQW
      const lh = b.line_height ?? 1.15
      let lines = 0
      for (const seg of b.text.split("\n")) {
        lines += Math.max(
          1,
          Math.ceil((seg.length * 0.65 * f) / Math.max(colWidthPx, 10 * CQW)),
        )
      }
      return lines * f * lh
    }
    case "pill":
      return (cqwOf(b.font_size, 2.5) + 3.2) * CQW
    case "icon":
      return (cqwOf(b.size, 3.5) + 3.6) * CQW
    case "divider":
      return 8
    case "image":
    case "shape":
      return 8 * CQW
    case "card":
    case "stack": {
      // `gap` só existe no stack; no card o espaçamento vem do fluxo normal.
      const gap = cqwOf(b.type === "stack" ? b.gap : undefined, 2.5) * CQW
      const kids = b.children ?? []
      if (b.type === "stack" && b.direction === "row") {
        return Math.max(0, ...kids.map((k) => estimateHeightPx(k, colWidthPx)))
      }
      const inner = kids.reduce((acc, k) => acc + estimateHeightPx(k, colWidthPx), 0)
      return inner + Math.max(0, kids.length - 1) * gap
    }
    default:
      return 0
  }
}

// =============================================================================
// Medição no DOM (caminho preferido)
// =============================================================================

export interface MeasuredBlock {
  /** Distância do topo do canvas, em px do canvas de 1080 de largura. */
  top: number
  height: number
}
export type BlockMeasurements = Record<string, MeasuredBlock>

/**
 * Lê a altura REAL de cada camada de topo a partir do DOM do editor.
 *
 * Só funciona com o canvas em modo editável (é o modo que emite os wrappers
 * `data-drag-path`). As medidas voltam normalizadas pro canvas de 1080px, então
 * não importa em que largura o preview está na tela.
 */
export function measureSpecBlocks(root: HTMLElement | null): BlockMeasurements | undefined {
  if (!root || typeof window === "undefined") return undefined
  const canvas = root.matches?.("[data-post-canvas]")
    ? root
    : (root.querySelector("[data-post-canvas]") as HTMLElement | null)
  if (!canvas) return undefined
  const cr = canvas.getBoundingClientRect()
  if (cr.width < 1) return undefined
  const scale = CANVAS_W / cr.width
  const out: BlockMeasurements = {}
  canvas.querySelectorAll<HTMLElement>("[data-drag-path]").forEach((el) => {
    const path = el.dataset.dragPath
    // Só camadas de topo: o remap acontece na raiz, filhos de stack fluem junto.
    if (!path || path.includes(".")) return
    const r = el.getBoundingClientRect()
    if (r.height < 1) return
    out[path] = { top: (r.top - cr.top) * scale, height: r.height * scale }
  })
  return Object.keys(out).length ? out : undefined
}

// =============================================================================
// Classificação das camadas
// =============================================================================

type Role =
  /** Cobre a altura toda (fundo, coluna de foto). Vertical fica como está. */
  | "fullbleed"
  /** Colada numa borda: faixa de cor/foto. Mantém a borda, altura proporcional. */
  | "band-top"
  | "band-bottom"
  /** Conteúdo: entra na faixa que é redistribuída. */
  | "flow"
  /** Sem informação vertical utilizável — não mexe. */
  | "skip"

interface Layer {
  index: number
  role: Role
  y0: number
  h: number
  /** Âncora vertical original — footer continua footer depois da adaptação. */
  anchor: "top" | "bottom"
  hasExplicitHeight: boolean
}

function classify(
  blocks: FreeBlock[],
  srcH: number,
  measurements: BlockMeasurements | undefined,
): Layer[] {
  return blocks.map((b, index): Layer => {
    const pos = b.position ?? {}
    const top = toPx(pos.top, srcH)
    const bottom = toPx(pos.bottom, srcH)
    const declaredH = toPx(pos.height, srcH)
    const hasExplicitHeight = pos.height !== undefined && declaredH !== null

    // Fundo/coluna de altura cheia: continua de altura cheia em qualquer
    // formato sem nenhuma conta — `height:"100%"` já é a resposta certa.
    const spansAll =
      (declaredH !== null && declaredH >= srcH * 0.96) ||
      (top !== null && top <= 1 && bottom !== null && bottom <= 1)
    if (spansAll) return { index, role: "fullbleed", y0: 0, h: srcH, anchor: "top", hasExplicitHeight }

    const measured = measurements?.[String(index)]

    // Altura: a medida do DOM ganha da declarada, que ganha da estimativa.
    const h =
      measured?.height ??
      declaredH ??
      estimateHeightPx(b, toPx(pos.width, CANVAS_W) ?? CANVAS_W * 0.88)

    let y0: number | null = measured?.top ?? null
    if (y0 === null && top !== null) y0 = top
    if (y0 === null && pos.center_y) y0 = (srcH - h) / 2
    if (y0 === null && bottom !== null) y0 = srcH - bottom - h
    if (y0 === null) return { index, role: "skip", y0: 0, h, anchor: "top", hasExplicitHeight }

    // Faixa colada na borda: só estrutura (foto/forma) ganha esse tratamento.
    // Um texto encostado no topo é conteúdo e tem que respeitar a zona segura.
    const structural = b.type === "image" || b.type === "shape"
    if (structural && y0 <= 2) {
      return { index, role: "band-top", y0: 0, h, anchor: "top", hasExplicitHeight }
    }
    if (structural && srcH - (y0 + h) <= 2) {
      return { index, role: "band-bottom", y0, h, anchor: "bottom", hasExplicitHeight }
    }

    const anchor: "top" | "bottom" =
      pos.top === undefined && pos.bottom !== undefined ? "bottom" : "top"
    return { index, role: "flow", y0, h, anchor, hasExplicitHeight }
  })
}

// =============================================================================
// Escala de tamanho
// =============================================================================

/**
 * Aplica um fator de tamanho à árvore. Texto e pílula usam `font_size_scale`
 * (multiplicador que o renderizador já resolve em calc()), o resto entra em
 * calc() direto — assim nenhuma expressão CSS precisa ser interpretada e o
 * `min(Xcqw, Ypx)` original continua fazendo o trabalho dele.
 */
function scaleSizes(b: FreeBlock, f: number): FreeBlock {
  if (f === 1) return b
  switch (b.type) {
    case "text":
    case "pill": {
      const v = (b.font_size_scale ?? 1) * f
      // Encaixa no 1 quando a ida-e-volta devolve o tamanho original a menos de
      // ruído de ponto flutuante — senão a peça carregaria um 0.9998 pra sempre.
      const snapped = Math.abs(v - 1) < 0.006 ? 1 : Math.round(v * 10000) / 10000
      return { ...b, font_size_scale: snapped }
    }
    case "icon":
      return {
        ...b,
        size: scaleCss(b.size, f) ?? b.size,
        padding: scaleCss(b.padding, f),
      }
    case "card":
      return {
        ...b,
        padding: scaleCss(b.padding, f),
        children: (b.children ?? []).map((c) => scaleSizes(c, f)),
      }
    case "stack":
      return {
        ...b,
        gap: scaleCss(b.gap, f),
        padding: scaleCss(b.padding, f),
        children: (b.children ?? []).map((c) => scaleSizes(c, f)),
      }
    default:
      return b
  }
}

// =============================================================================
// Adaptação
// =============================================================================

export interface AdaptFormatResult {
  spec: FreePostSpec
  /** Fator aplicado aos tamanhos (1 = nada encolheu/cresceu). */
  sizeScale: number
  /** Fator aplicado ao espaçamento vertical entre as camadas. */
  rhythmScale: number
}

export function adaptSpecFormat(
  spec: FreePostSpec,
  from: PostFormat,
  to: PostFormat,
  measurements?: BlockMeasurements,
): AdaptFormatResult {
  const srcH = POST_FORMATS[from].height
  const dstH = POST_FORMATS[to].height
  if (from === to || srcH === dstH) {
    return { spec, sizeScale: 1, rhythmScale: 1 }
  }

  const layers = classify(spec.blocks, srcH, measurements)
  const flow = layers.filter((l) => l.role === "flow")

  const heightRatio = dstH / srcH

  // --- 1. Zona utilizável: margens mínimas do formato, aumentadas pelas
  //        faixas coladas nas bordas (o conteúdo não pode invadi-las). -------
  let minTop = POST_FORMATS[to].safeTop
  let minBottom = POST_FORMATS[to].safeBottom
  for (const l of layers) {
    if (l.role === "band-top") minTop = Math.max(minTop, l.h * heightRatio + BAND_GAP)
    if (l.role === "band-bottom") minBottom = Math.max(minBottom, l.h * heightRatio + BAND_GAP)
  }

  let rhythm = 1
  let sizeScale = 1

  if (flow.length > 0) {
    const top0 = Math.min(...flow.map((l) => l.y0))
    const bottom0 = Math.max(...flow.map((l) => l.y0 + l.h))
    const band = Math.max(1, bottom0 - top0)

    const roomForBand = Math.max(1, dstH - minTop - minBottom)

    if (dstH > srcH) {
      // --- Crescer: respirar, não esticar. -----------------------------------
      rhythm = 1 + (heightRatio - 1) * BREATHE_SHARE
      // Teto: o respiro nunca pode empurrar a peça pra fora da zona segura.
      if (band * rhythm > roomForBand) rhythm = Math.max(1, roomForBand / band)
      // Tamanho só cresce pra DESFAZER uma compressão anterior — nunca acima do
      // que o compositor escreveu (aumentar fonte não é adaptar, é redesenhar).
      // É o que faz 4:5 → 1:1 → 4:5 devolver a arte original em vez de uma cópia
      // permanentemente menor.
      sizeScale = Math.min(1 / (spec.layout_scale ?? 1), roomForBand / band)
      sizeScale = Math.max(1, sizeScale)
      // Se restaurar exige mais espaço que o respiro previa, o espaço acompanha
      // — do contrário o texto cresceria dentro de um ritmo apertado e colidiria.
      rhythm = Math.max(rhythm, sizeScale)
    } else {
      // --- Encolher: margem primeiro, corpo depois. --------------------------
      // Se a faixa já cabe depois de apertar as margens, não mexe em tamanho.
      rhythm = band <= roomForBand ? 1 : Math.max(MIN_COMPRESSION, roomForBand / band)
      // Homotetia: posição e tamanho pelo MESMO fator ⇒ colisão impossível.
      sizeScale = rhythm
    }

    // --- 2. Onde a faixa começa: o que sobra vira margem, dividido na mesma
    //        proporção das margens originais (uma peça que respirava mais em
    //        cima continua respirando mais em cima). --------------------------
    const newBand = band * rhythm
    const leftover = Math.max(0, dstH - newBand)
    const m0 = Math.max(0, top0)
    const m1 = Math.max(0, srcH - bottom0)
    const ratio = m0 + m1 > 0 ? m0 / (m0 + m1) : 0.45
    const maxTop = Math.max(0, leftover - minBottom)
    const contentTop = Math.min(
      Math.max(leftover * ratio, Math.min(minTop, maxTop)),
      maxTop,
    )

    // --- 3. Remapeia. Toda camada de conteúdo passa pela MESMA função afim,
    //        então a composição (o que está acima do quê, e a que distância
    //        relativa) sobrevive inteira. --------------------------------------
    const remapped = spec.blocks.map((b, i) => {
      const l = layers[i]
      if (l.role !== "flow") return b
      const y0 = contentTop + (l.y0 - top0) * rhythm
      const h = l.h * sizeScale
      const pos: Record<string, unknown> = { ...(b.position ?? {}) }
      // center_y vira âncora explícita: o que vale é a relação com os outros
      // blocos, não o centro geométrico de um canvas que mudou de altura.
      delete pos.center_y
      if (l.anchor === "bottom") {
        delete pos.top
        pos.bottom = cqw(Math.max(0, dstH - (y0 + h)))
      } else {
        delete pos.bottom
        pos.top = cqw(Math.max(0, y0))
      }
      if (l.hasExplicitHeight) pos.height = cqw(h)
      const scaled = scaleSizes(b, sizeScale)
      return { ...scaled, position: pos } as FreeBlock
    })

    const nextLayoutScale = (spec.layout_scale ?? 1) * sizeScale
    return {
      spec: {
        ...spec,
        layout_scale: Math.abs(nextLayoutScale - 1) < 0.006 ? 1 : nextLayoutScale,
        blocks: applyBandHeights(remapped, layers, heightRatio, dstH),
      },
      sizeScale,
      rhythmScale: rhythm,
    }
  }

  // Peça 100% estrutural (só fundo e faixas, sem camada de conteúdo): não há
  // banda pra redistribuir — as alturas proporcionais já entregam o formato.
  return {
    spec: { ...spec, blocks: applyBandHeights(spec.blocks, layers, heightRatio, dstH) },
    sizeScale,
    rhythmScale: rhythm,
  }
}

/**
 * Faixas coladas na borda escalam com o canvas, não com o conteúdo: uma barra
 * de cor que ocupava o terço superior tem que continuar ocupando o terço
 * superior — é proporção de composição, não medida de texto.
 */
function applyBandHeights(
  blocks: FreeBlock[],
  layers: Layer[],
  heightRatio: number,
  dstH: number,
): FreeBlock[] {
  return blocks.map((b, i) => {
    const l = layers[i]
    if (!l || (l.role !== "band-top" && l.role !== "band-bottom")) return b
    const h = Math.min(l.h * heightRatio, dstH)
    const pos: Record<string, unknown> = { ...(b.position ?? {}) }
    delete pos.center_y
    if (l.role === "band-top") {
      delete pos.bottom
      pos.top = 0
    } else {
      delete pos.top
      pos.bottom = 0
    }
    pos.height = cqw(h)
    return { ...b, position: pos } as FreeBlock
  })
}
