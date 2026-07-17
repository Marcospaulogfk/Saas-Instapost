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
// ============================================================================

export type EditableType = "title" | "text" | "badge" | "image"

export interface ElementOverride {
  /** Deslocamento em px na LARGURA DE DESIGN (420) — escala junto do slide. */
  dx?: number
  dy?: number
  /** Escala visual do elemento (1 = padrão). */
  scale?: number
  /** Cor do texto (título/texto/badge). */
  color?: string
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
    const o = overrides?.[key]

    // ── transform (mover/escalar) — não se aplica à imagem ──
    if (type !== "image") {
      const parts: string[] = []
      if (o?.dx || o?.dy) parts.push(`translate(${o.dx ?? 0}px, ${o.dy ?? 0}px)`)
      if (o?.scale && o.scale !== 1) parts.push(`scale(${o.scale})`)
      if (parts.length) {
        node.style.transform = parts.join(" ")
        node.style.transformOrigin = "top left"
        node.dataset.editTransformed = "1"
      } else if (node.dataset.editTransformed) {
        node.style.transform = ""
        node.style.transformOrigin = ""
        delete node.dataset.editTransformed
      }
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
  }
}
