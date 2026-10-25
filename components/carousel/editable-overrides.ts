// ============================================================================
// Editor Canva-like — overrides POR ELEMENTO do slide.
//
// Como funciona (e por que não quebra nada):
//   1. Os componentes compartilhados (FitText/Pill/SmartSlideImage/Placeholder)
//      carregam `data-edit="title|badge|image"`; os <p> descritivos são
//      taggeados como "text" em runtime (mesma premissa do bodyScale: texto
//      descritivo é SEMPRE <p>). Isso cobre os 10 estilos sem tocar em nenhum
//      layout.
//   2. Cada nó ganha uma chave estável por tipo + ordem no DOM ("title-0",
//      "text-1", "badge-0"...). O override do usuário vive em slide.el[key]
//      (JSONB — salva junto do carrossel, sem migration).
//   3. applyElementOverrides roda num layout effect do SlidePreview: aplica
//      transform (mover/escalar) e cor SÓ nos nós com override. Sem override,
//      nenhum estilo é tocado — o slide gerado fica idêntico ao padrão.
//   4. A restauração é segura: guardamos o valor inline ORIGINAL (que o React
//      setou via style prop) em dataset antes de sobrescrever e devolvemos ele
//      ao remover o override — mesmo quando o React não re-escreve o style.
//
// Usado também pelo overlay de interação (editable-canvas) pra hit-test e
// posicionamento dos contornos — mesma derivação de chave nos dois lados.
//
// FORMAS DECORATIVAS ("shape"): círculos, faixas, post-its, palavras-fantasma.
// O estilo marca o nó com data-edit="shape" (helper shapeAttrs em
// styles/shared.tsx) e diz ONDE a cor pinta com data-edit-paint:
//   "bg" (padrão) = preenchimento · "text" = cor do texto/SVG currentColor ·
//   "border" = contorno. Mover/escalar somam ao giro que a forma já tinha.
// ============================================================================

export type EditableType =
  | "title"
  | "text"
  | "badge"
  | "image"
  | "meta"
  | "shape"
  | "block"

/** Onde a cor de uma forma pinta (data-edit-paint). */
export type ShapePaint = "bg" | "text" | "border"

/** Grade da colagem (2–4 fotos no espaço da foto principal). "2h" = lado a
 *  lado, "2v" = uma acima da outra, "3" = uma grande + duas pequenas, "4" = 2×2. */
export type CollageLayout = "2h" | "2v" | "3" | "4"

export interface ElementOverride {
  /** Deslocamento em px na LARGURA DE DESIGN (420) — escala junto do slide. */
  dx?: number
  dy?: number
  /** Escala visual do elemento (1 = padrão). */
  scale?: number
  /** Cor do texto (título/texto/badge) ou da forma (preenchimento,
   *  contorno ou texto, conforme data-edit-paint). */
  color?: string
  /** Oculta o elemento nativo (visibility:hidden — mantém o fluxo do layout,
   *  nada reflui). Usado pra trocar "arrasta"/marca pelo bloco do usuário. */
  hidden?: boolean
  /** Texto trocado direto no slide, em tag/rodapé que não tem campo no painel
   *  (ex.: "arrasta →"). Só vale pra nó com um único texto. */
  text?: string
  /** Cor de fundo da tag (botão direito → "Fundo da tag"). Só tag. */
  bg?: string
}

export type SlideElementOverrides = Record<string, ElementOverride>

export interface EditableNode {
  node: HTMLElement
  key: string
  type: EditableType
}

/** Rótulos humanos pros tipos (chips do overlay + sidebar). */
export const EDITABLE_TYPE_LABEL: Record<EditableType, string> = {
  title: "Título",
  text: "Texto",
  badge: "Tag",
  image: "Imagem",
  meta: "Rodapé",
  shape: "Forma",
  block: "Bloco",
}

/**
 * Transform de mover/escalar SOMADO ao transform inline que o layout já tinha
 * (ex.: post-it girado com style={{ transform: "rotate(-2deg)" }}). O original
 * é guardado em data-edit-orig-transform na primeira edição. Com giro original,
 * a origem fica a do layout (girar em volta do centro); sem, "top left".
 * Usado pelo apply abaixo e pelo arrastar ao vivo do canvas.
 */
export function composeEditTransform(
  node: HTMLElement,
  dx: number,
  dy: number,
  scale: number,
): { transform: string; origin: string } {
  if (node.dataset.editOrigTransform === undefined) {
    node.dataset.editOrigTransform = node.dataset.editTransformed ? "" : node.style.transform
  }
  const orig = node.dataset.editOrigTransform
  const parts: string[] = []
  if (dx || dy) parts.push(`translate(${dx}px, ${dy}px)`)
  if (orig) parts.push(orig)
  if (scale && scale !== 1) parts.push(`scale(${scale})`)
  return { transform: parts.join(" "), origin: orig ? "" : "top left" }
}

/** Propriedade CSS que a cor da forma pinta. */
function shapePaintProp(node: HTMLElement): "background" | "color" | "borderColor" {
  const paint = node.getAttribute("data-edit-paint") as ShapePaint | null
  return paint === "text" ? "color" : paint === "border" ? "borderColor" : "background"
}

/**
 * Taggeia os <p> descritivos como "text" e coleta todos os nós editáveis com
 * chave estável (tipo + ordem no DOM). Determinístico por render — os dois
 * lados (aplicação de override e overlay de seleção) enxergam as mesmas chaves.
 */
export function collectEditableNodes(root: HTMLElement): EditableNode[] {
  // <p> descritivo vira "text" (não mexe nos que já têm data-edit).
  root.querySelectorAll("p:not([data-edit])").forEach((n) => {
    n.setAttribute("data-edit", "text")
  })
  const counters: Record<string, number> = {}
  const out: EditableNode[] = []
  root.querySelectorAll<HTMLElement>("[data-edit]").forEach((node) => {
    const type = node.getAttribute("data-edit") as EditableType | null
    if (!type || !(type in EDITABLE_TYPE_LABEL)) return
    // Blocos livres têm chave ESTÁVEL (id) — apagar um do meio não
    // renumera os outros. Os nós dos layouts seguem tipo-índice.
    const stable = node.getAttribute("data-edit-key")
    if (stable) {
      out.push({ node, key: stable, type })
      return
    }
    const idx = counters[type] ?? 0
    counters[type] = idx + 1
    out.push({ node, key: `${type}-${idx}`, type })
  })
  return out
}

/**
 * Aplica os overrides nos nós do slide. Idempotente e reversível:
 *  - transform: título/texto/badge nunca têm transform inline próprio nos
 *    layouts → setar/limpar direto é seguro.
 *  - color: pode existir cor inline do layout (React style prop). Antes de
 *    sobrescrever, o valor atual é guardado em data-edit-orig-color; ao
 *    remover o override, ele é restaurado. Se o React re-escreveu a cor entre
 *    aplicações (data-edit-applied-color difere do atual), o original é
 *    recapturado — não restauramos cor velha.
 *  - imagem: NUNCA recebe transform/cor por aqui (pan/zoom da foto têm
 *    mecanismo próprio: posX/posY/zoom via ImageTransformContext).
 */
export function applyElementOverrides(
  root: HTMLElement,
  overrides: SlideElementOverrides | undefined,
) {
  const nodes = collectEditableNodes(root)
  for (const { node, key, type } of nodes) {
    // Bloco livre: posição/cor vivem no próprio bloco (slide.blocks), nunca em el.
    if (type === "block") continue
    const o = overrides?.[key]

    // ── transform (mover/escalar) — não se aplica à imagem ──
    if (type !== "image") {
      const moved = !!(o?.dx || o?.dy || (o?.scale && o.scale !== 1))
      if (moved) {
        const t = composeEditTransform(node, o?.dx ?? 0, o?.dy ?? 0, o?.scale ?? 1)
        node.style.transform = t.transform
        node.style.transformOrigin = t.origin
        node.dataset.editTransformed = "1"
      } else if (node.dataset.editTransformed) {
        // Devolve o transform do layout (giro do post-it etc.), não "".
        node.style.transform = node.dataset.editOrigTransform ?? ""
        node.style.transformOrigin = ""
        delete node.dataset.editTransformed
        delete node.dataset.editOrigTransform
      }
    }

    // ── ocultar (qualquer tipo, inclusive imagem) ──
    if (o?.hidden) {
      node.style.visibility = "hidden"
      node.dataset.editHidden = "1"
    } else if (node.dataset.editHidden) {
      node.style.visibility = ""
      delete node.dataset.editHidden
    }

    // ── cor da forma: pinta preenchimento, contorno ou texto (data-edit-paint).
    //    Mesmo esquema de guardar/restaurar o valor inline original.
    if (type === "shape") {
      const prop = shapePaintProp(node)
      if (o?.color) {
        if (
          node.dataset.editAppliedPaint === undefined ||
          node.style[prop] !== node.dataset.editAppliedPaint
        ) {
          node.dataset.editOrigPaint = node.style[prop]
        }
        node.style[prop] = o.color
        node.dataset.editAppliedPaint = node.style[prop]
      } else if (node.dataset.editAppliedPaint !== undefined) {
        node.style[prop] = node.dataset.editOrigPaint ?? ""
        delete node.dataset.editAppliedPaint
        delete node.dataset.editOrigPaint
      }
      continue
    }

    // ── cor (título/texto/badge) ──
    if (type !== "image") {
      if (o?.color) {
        // React re-escreveu a cor desde a última aplicação? Recaptura o original.
        if (
          node.dataset.editAppliedColor &&
          node.style.color !== node.dataset.editAppliedColor
        ) {
          node.dataset.editOrigColor = node.style.color
        } else if (node.dataset.editAppliedColor === undefined) {
          node.dataset.editOrigColor = node.style.color
        }
        node.style.color = o.color
        node.dataset.editAppliedColor = o.color
      } else if (node.dataset.editAppliedColor !== undefined) {
        node.style.color = node.dataset.editOrigColor ?? ""
        delete node.dataset.editAppliedColor
        delete node.dataset.editOrigColor
      }
    }

    // ── fundo (só tag) — mesmo esquema de restauração da cor. O valor aplicado
    //    é guardado já normalizado pelo navegador (hex → rgb) pra comparar certo.
    if (type === "badge") {
      if (o?.bg) {
        if (
          node.dataset.editAppliedBg === undefined ||
          node.style.backgroundColor !== node.dataset.editAppliedBg
        ) {
          node.dataset.editOrigBg = node.style.backgroundColor
        }
        node.style.backgroundColor = o.bg
        node.dataset.editAppliedBg = node.style.backgroundColor
      } else if (node.dataset.editAppliedBg !== undefined) {
        node.style.backgroundColor = node.dataset.editOrigBg ?? ""
        delete node.dataset.editAppliedBg
        delete node.dataset.editOrigBg
      }
    }

    // ── texto (tag/rodapé sem campo) — troca o nodeValue do ÚNICO nó de texto,
    //    sem remover nós que o React controla. Mesmo esquema de restauração da cor.
    if (type === "badge" || type === "meta") {
      const tn = singleTextNode(node)
      if (tn && o?.text != null) {
        if (
          node.dataset.editAppliedText === undefined ||
          tn.nodeValue !== node.dataset.editAppliedText
        ) {
          node.dataset.editOrigText = tn.nodeValue ?? ""
        }
        tn.nodeValue = o.text
        node.dataset.editAppliedText = o.text
      } else if (tn && node.dataset.editAppliedText !== undefined) {
        tn.nodeValue = node.dataset.editOrigText ?? ""
        delete node.dataset.editAppliedText
        delete node.dataset.editOrigText
      }
    }
  }
}

/** O nó tem exatamente um filho, e ele é texto? (tag "arrasta →", "@marca"…) */
export function singleTextNode(node: HTMLElement): Text | null {
  return node.childNodes.length === 1 && node.firstChild?.nodeType === Node.TEXT_NODE
    ? (node.firstChild as Text)
    : null
}
