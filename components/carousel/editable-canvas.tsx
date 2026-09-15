"use client"

// ============================================================================
// EditableSlideCanvas — camada de interação Canva-like sobre o slide ATIVO.
//
// O slide renderiza normal (SlidePreview escalado, igual ao filmstrip); por
// cima entra um OVERLAY transparente que faz hover/seleção/drag/resize por
// hit-test nos nós [data-edit] do DOM real. O overlay é irmão do slide — nunca
// entra no export (o export usa o render oculto do editor, sem overlay).
//
// Regras de segurança ("nada pode quebrar"):
//  - Drag de texto/título/tag tem CLAMP: o elemento nunca sai do slide.
//  - Durante o drag os estilos são aplicados DIRETO no DOM (fluído, 60fps) e
//    só commitam no soltar → 1 entrada única no histórico (undo limpo).
//  - Drag na imagem NÃO move a caixa — faz PAN da foto (posX/posY), o layout
//    fica intacto. Zoom pela roda do mouse. Duplo clique troca a foto.
//  - Sem interação, o overlay é invisível e o slide é idêntico ao gerado.
// ============================================================================

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type ComponentType,
  type CSSProperties,
} from "react"
import {
  SlidePreview,
  type CarouselChrome,
  type PreviewSlide,
  type EditorialStyle,
} from "./slide-preview"
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Crop,
  ImageIcon,
  ImagePlus,
  Move,
  Paintbrush,
  Palette,
  Pencil,
  RotateCcw,
  Trash2,
  BringToFront,
  SendToBack,
  EyeOff,
  Layers,
} from "lucide-react"
import {
  collectEditableNodes,
  singleTextNode,
  EDITABLE_TYPE_LABEL,
  type EditableType,
  type ElementOverride,
} from "./editable-overrides"
import {
  BLOCK_MIN_SIZE,
  BLOCK_TYPE_LABEL,
  type BlockType,
  type SlideBlock,
} from "./slide-blocks"
import { BLOCK_DRAG_MIME } from "./block-panel"
import type { HighlightStyle } from "./editorial-shared"

const REF_W = 420
const SNAP_PX = 6 // tolerância do snap (px do container)

/** Degradês prontos pro marca-texto (barrinha de destaque do título). `bg`
 *  já é o `linear-gradient(...)` completo — highlightBg (editorial-shared)
 *  usa direto, sem misturar com branco (isso só acontece pra cor sólida). */
const HIGHLIGHT_GRADIENTS: { name: string; bg: string }[] = [
  { name: "Azul → Violeta", bg: "linear-gradient(100deg, #1668E3 0%, #7C3AED 100%)" },
  { name: "Laranja → Rosa", bg: "linear-gradient(100deg, #F97316 0%, #EC4899 100%)" },
  { name: "Verde → Azul", bg: "linear-gradient(100deg, #22C55E 0%, #1668E3 100%)" },
]
const MIN_SCALE = 0.5
const MAX_SCALE = 1.8

export type SelectionType = EditableType | "background"

export interface EditorSelection {
  key: string // "title-0", "text-1", "image-0"… ou "background"
  type: SelectionType
}

/** Ações do menu de botão direito — implementadas pelo editor (sidebar). */
export type MenuAction =
  | "edit-text"
  | "color"
  | "copy-style"
  | "paste-style"
  | "reset"
  | "image-replace"
  | "image-adjust"
  | "image-reset"
  | "image-remove"
  | "palette"
  | "bg-color"
  | "bg-default"
  | "slide-duplicate"
  | "slide-delete"
  // blocos livres (estilo Elementor)
  | "block-duplicate"
  | "block-front"
  | "block-back"
  | "block-delete"
  | "block-apply-all"
  // oculta o elemento nativo do layout (ElementOverride.hidden)
  | "hide"
  // mesma coisa, no elemento equivalente de TODOS os slides
  | "hide-all"

type AlignH = "left" | "center" | "right"
type AlignV = "top" | "middle" | "bottom"

interface Box {
  key: string
  type: EditableType
  x: number
  y: number
  w: number
  h: number
}

export interface EditableSlideCanvasProps {
  slide: PreviewSlide
  total: number
  template: "editorial" | "cinematic" | "hybrid"
  colors: string[]
  style: EditorialStyle
  handle: string
  brandName: string
  handleInitials?: string
  chrome: CarouselChrome
  format: "feed" | "stories"
  width: number
  fontClass: string
  titleWeight?: number
  titleScale?: number
  bodyWeight?: number
  bodyScale?: number
  /** Seleção atual (controlada pelo editor — abre a section certa na sidebar). */
  selection: EditorSelection | null
  onSelect: (sel: EditorSelection | null) => void
  /** Commit de override de elemento (1x por gesto — histórico limpo). */
  onOverride: (key: string, patch: ElementOverride) => void
  /** Commit do pan da foto (posX/posY 0–100). */
  onImagePan: (posX: number, posY: number) => void
  /** Commit do zoom da foto (100–250). */
  onImageZoom: (zoom: number) => void
  /** Arquivo solto/escolhido direto no slide → troca a imagem. */
  onImageFile: (file: File) => void
  /** Duplo clique na imagem → abrir o file picker. */
  onImagePick: () => void
  /** Duplo clique em texto → focar o campo correspondente na sidebar. */
  onTextEdit: (sel: EditorSelection) => void
  /** Ação escolhida no menu de botão direito. */
  onMenuAction: (action: MenuAction, sel: EditorSelection) => void
  /** Há estilo copiado (habilita "Colar estilo"). */
  hasStyleClipboard: boolean
  /** Commit de mover/redimensionar um bloco livre (1x por gesto). */
  onBlockPatch: (id: string, patch: Partial<SlideBlock>) => void
  /** Widget do catálogo solto no slide → cria o bloco naquele ponto (design px). */
  onBlockDrop: (type: BlockType, x: number, y: number) => void
  /** Digitação direto no slide → mesmo campo da sidebar (sincronizados). */
  onTextChange: (field: InlineField, value: string) => void
  /** Botão direito → "Inserir imagem…" no ponto clicado (design px). */
  onImageInsert: (x: number, y: number) => void
  /** Botão direito → copiar a imagem (do slide ou bloco) pro slide `target`. */
  onImageCopyTo: (sel: EditorSelection, target: number) => void
  /** Botão direito num slide AINDA não selecionado: ponto clicado (fração 0–1
   *  do slide). O canvas monta e já abre o menu ali. */
  openMenuAt?: { fx: number; fy: number } | null
  /** Menu pendente (openMenuAt) foi aberto → o editor limpa o pedido. */
  onMenuOpened?: () => void
  /** Patch direto no slide atual (barrinha de destaque do título). */
  onSlidePatch?: (patch: Partial<PreviewSlide>) => void
}

/** Campos de texto editáveis direto no canvas. "handle" é o @ da marca (vale
 *  pro carrossel inteiro, não mora no slide). */
export type InlineField = "title" | "subtitle" | "body" | "cta_badge" | "handle"
type SlideTextField = Exclude<InlineField, "handle">
const INLINE_FIELDS: SlideTextField[] = ["title", "subtitle", "body", "cta_badge"]
/** Texto que os layouts mostram na tag quando cta_badge está vazio. */
const DEFAULT_TAG_TEXTS = ["editorial", "conteúdo"]
const normText = (s: string) =>
  s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim().toLowerCase()

/** Prioridade de hit-test: menor número ganha (badge por cima da imagem etc). */
const HIT_PRIORITY: Record<EditableType, number> = {
  block: -1,
  badge: 0,
  meta: 0,
  text: 1,
  title: 2,
  image: 3,
}

export function EditableSlideCanvas(props: EditableSlideCanvasProps) {
  const {
    slide,
    width,
    format,
    selection,
    onSelect,
    onOverride,
    onImagePan,
    onImageZoom,
    onImageFile,
    onImagePick,
    onTextEdit,
    onMenuAction,
    hasStyleClipboard,
    onBlockPatch,
    onBlockDrop,
    onTextChange,
    onImageInsert,
    onImageCopyTo,
  } = props
  const blockOf = (key: string) => slide.blocks?.find((b) => b.id === key)
  /** Rótulo do chip: blocos mostram o tipo real ("Bloco · Título"). */
  const chipLabel = (key: string, type: EditableType) =>
    type === "block"
      ? `Bloco · ${BLOCK_TYPE_LABEL[blockOf(key)?.type ?? "text"]}`
      : EDITABLE_TYPE_LABEL[type]

  const scale = width / REF_W
  const height = width * (format === "stories" ? 16 / 9 : 5 / 4)

  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  const [hover, setHover] = useState<Box | null>(null)
  const [selBox, setSelBox] = useState<Box | null>(null)
  // Guias de snap: posição em px do container (null = sem guia).
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null })
  const [dropActive, setDropActive] = useState<false | "file" | "block">(false)
  const [menu, setMenu] = useState<{
    x: number
    y: number
    /** ponto clicado (px do container) — "Inserir imagem" nasce ali. */
    px: number
    py: number
    sel: EditorSelection
  } | null>(null)
  // Edição de texto direto no slide: textarea espelhando a tipografia do nó
  // (o nó original fica invisível enquanto digita).
  const [editing, setEditing] = useState<{
    key: string
    /** null = tag/rodapé sem campo → edita slide.el[key].text */
    field: InlineField | null
    /** texto que o nó mostrava ao abrir (placeholder / valor inicial do override) */
    placeholder: string
    node: HTMLElement
    x: number
    y: number
    w: number
    h: number
    style: CSSProperties
  } | null>(null)
  const editRef = useRef<HTMLTextAreaElement>(null)
  // Trecho selecionado no textarea do título (abre a barrinha de destaque).
  const [titleSel, setTitleSel] = useState("")
  useLayoutEffect(() => {
    const ta = editRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${ta.scrollHeight}px`
  })

  // ── Geometria ──────────────────────────────────────────────────────────
  const getBoxes = useCallback((): Box[] => {
    const root = innerRef.current
    const container = containerRef.current
    if (!root || !container) return []
    const cRect = container.getBoundingClientRect()
    return collectEditableNodes(root)
      .filter(({ node }) => !node.dataset.editHidden)
      .map(({ node, key, type }) => {
        const r = node.getBoundingClientRect()
        return {
          key,
          type,
          x: r.left - cRect.left,
          y: r.top - cRect.top,
          w: r.width,
          h: r.height,
        }
      })
      .filter((b) => b.w >= 4 && b.h >= 4)
  }, [])

  const hitTest = useCallback(
    (px: number, py: number): Box | null => {
      const candidates = getBoxes().filter(
        (b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h,
      )
      if (!candidates.length) return null
      candidates.sort(
        (a, b) =>
          HIT_PRIORITY[a.type] - HIT_PRIORITY[b.type] || a.w * a.h - b.w * b.h,
      )
      return candidates[0]
    },
    [getBoxes],
  )

  // Recalcula o contorno da seleção após cada render (slide/estilo mudam) —
  // rAF extra pega imagens/fontes que assentam depois do commit.
  useLayoutEffect(() => {
    if (!selection || selection.type === "background") {
      setSelBox(null)
      return
    }
    const update = () => {
      const found = getBoxes().find((b) => b.key === selection.key) ?? null
      setSelBox(found)
    }
    update()
    const raf = requestAnimationFrame(update)
    const t = window.setTimeout(update, 350)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t)
    }
  }, [selection, slide, props.style, props.format, width, getBoxes])

  // ── Drag (elemento OU pan da foto OU handle de escala) ─────────────────
  const dragRef = useRef<{
    mode: "element" | "pan" | "scale" | "block" | "block-resize"
    key: string
    type: EditableType
    node: HTMLElement
    startX: number
    startY: number
    // element:
    startDx: number // design px
    startDy: number
    baseLeft: number // px do container, SEM o translate atual
    baseTop: number
    baseW: number
    baseH: number
    startScale: number
    // pan:
    startPosX: number
    startPosY: number
    imgW: number
    imgH: number
    moved: boolean
    /** o elemento já estava selecionado → clique sem arrastar abre a edição */
    wasSelected?: boolean
  } | null>(null)

  const zoomCommitRef = useRef<number | null>(null)
  const zoomValueRef = useRef<number>(100)

  function findNode(key: string): HTMLElement | null {
    const root = innerRef.current
    if (!root) return null
    return collectEditableNodes(root).find((n) => n.key === key)?.node ?? null
  }

  /** Qual campo do slide o nó mostra (texto do DOM × campos). null = sem campo. */
  function resolveField(node: HTMLElement): InlineField | null {
    const dom = normText(node.textContent ?? "")
    if (!dom) return null
    // Tag/rodapé: @ da marca, ou a tag padrão ("Editorial") de cta_badge vazio.
    if (node.dataset.edit === "badge" || node.dataset.edit === "meta") {
      if (props.handle && normText(props.handle) === dom) return "handle"
      if (!slide.cta_badge?.trim() && DEFAULT_TAG_TEXTS.includes(dom)) return "cta_badge"
    }
    const val = (f: SlideTextField) => {
      const v = slide[f]
      return typeof v === "string" ? v : ""
    }
    const exact = INLINE_FIELDS.find((f) => val(f) && normText(val(f)) === dom)
    if (exact) return exact
    // nó com prefixo decorativo ("IDEIA 01 …"): o campo inteiro está contido nele
    let best: SlideTextField | null = null
    for (const f of INLINE_FIELDS) {
      const v = normText(val(f))
      if (v.length >= 3 && dom.includes(v) && (!best || v.length > normText(val(best)).length)) best = f
    }
    return best
  }

  /** Abre a edição inline. false = elemento sem campo (cai no painel lateral).
   *  Tag/rodapé sem campo (ex.: "arrasta →") edita via override de texto
   *  (field null → slide.el[key].text). */
  function startInlineEdit(key: string, type: SelectionType): boolean {
    if (type !== "title" && type !== "text" && type !== "badge" && type !== "meta") return false
    const node = findNode(key)
    const container = containerRef.current
    if (!node || !container) return false
    const field = resolveField(node)
    const textOnly = (type === "badge" || type === "meta") && !!singleTextNode(node)
    if (!field && !textOnly) return false
    const cs = getComputedStyle(node)
    const r = node.getBoundingClientRect()
    const c = container.getBoundingClientRect()
    // escala efetiva do nó na tela (canvas × escala do override)
    const k = r.width / Math.max(node.offsetWidth, 1)
    const px = (v: string) => `${(parseFloat(v) || 0) * k}px`
    if (editing && editing.node !== node && !editing.node.dataset.editHidden) {
      editing.node.style.visibility = ""
    }
    setEditing({
      key,
      field,
      placeholder: node.textContent ?? "",
      node,
      x: r.left - c.left,
      y: r.top - c.top,
      w: r.width,
      h: r.height,
      style: {
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight as CSSProperties["fontWeight"],
        fontStyle: cs.fontStyle,
        fontSize: px(cs.fontSize),
        lineHeight: cs.lineHeight === "normal" ? "normal" : px(cs.lineHeight),
        letterSpacing: cs.letterSpacing === "normal" ? "normal" : px(cs.letterSpacing),
        textTransform: cs.textTransform as CSSProperties["textTransform"],
        textAlign: cs.textAlign as CSSProperties["textAlign"],
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        borderRadius: px(cs.borderTopLeftRadius),
        padding: `${px(cs.paddingTop)} ${px(cs.paddingRight)} ${px(cs.paddingBottom)} ${px(cs.paddingLeft)}`,
      },
    })
    node.style.visibility = "hidden"
    setMenu(null)
    setHover(null)
    return true
  }

  function stopInlineEdit() {
    if (!editing) return
    if (!editing.node.dataset.editHidden) editing.node.style.visibility = ""
    setEditing(null)
    setTitleSel("")
  }

  // Mantém o nó ORIGINAL escondido enquanto edita — sem dep array, roda a
  // cada render (mesmo idioma do applyElementOverrides no SlidePreview).
  // Necessário porque o nó pode ser DESMONTADO/REMONTADO em cada tecla: a tag
  // do handle troca entre <Pill> e <span/> conforme handleVisivel(slide.handle)
  // fica vazio/preenchido durante a digitação (R4-10), e a referência antiga
  // em `editing.node` passa a apontar pra um nó fora da árvore — o REACT monta
  // um <Pill> novo, 100% visível, "atrás" do textarea (o bug da tag duplicada
  // e mais apagada por baixo da edição). Re-resolvendo pela `key` a cada
  // render, o nó ATUAL (ainda que seja outro objeto) sempre fica escondido.
  useLayoutEffect(() => {
    if (!editing) return
    const node = findNode(editing.key)
    if (!node) return
    const prevVisibility = node.style.visibility
    node.style.visibility = "hidden"
    return () => {
      if (!node.dataset.editHidden) node.style.visibility = prevVisibility
    }
  })

  /** Barrinha do título: cor / marca-texto no trecho selecionado, reaproveitando
   *  highlight_words (null = tira o destaque do trecho). Fecha a digitação pra
   *  mostrar o resultado na hora. */
  function applyHighlight(patch: HighlightStyle | null) {
    const phrase = titleSel.replace(/\*\*/g, "").replace(/\s+/g, " ").trim()
    if (!phrase || !props.onSlidePatch) return
    const k = phrase.toLowerCase()
    const words = (slide.highlight_words ?? []).filter((w) => w.toLowerCase() !== k)
    const styles = { ...(slide.highlight_styles ?? {}) }
    if (patch) {
      styles[k] = { ...styles[k], ...patch }
      words.push(phrase)
    } else {
      delete styles[k]
    }
    props.onSlidePatch({
      highlight_words: words,
      highlight_styles: Object.keys(styles).length ? styles : undefined,
    })
    stopInlineEdit()
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    // clique fora do texto em edição fecha a edição (o preventDefault abaixo
    // impediria o blur natural do textarea)
    if (editing) stopInlineEdit()
    if (e.button !== 0) return
    const container = containerRef.current
    if (!container) return
    const cRect = container.getBoundingClientRect()
    const px = e.clientX - cRect.left
    const py = e.clientY - cRect.top

    // Handle de escala da seleção atual?
    if (selBox && selection && selection.type !== "background" && selection.type !== "image") {
      const hx = selBox.x + selBox.w
      const hy = selBox.y + selBox.h
      if (Math.abs(px - hx) <= 10 && Math.abs(py - hy) <= 10) {
        const node = findNode(selection.key)
        if (node && selection.type === "block") {
          const b = blockOf(selection.key)
          if (!b) return
          dragRef.current = {
            mode: "block-resize",
            key: selection.key,
            type: "block",
            node,
            startX: e.clientX,
            startY: e.clientY,
            startDx: b.x,
            startDy: b.y,
            baseLeft: selBox.x,
            baseTop: selBox.y,
            baseW: b.w,
            baseH: b.h,
            startScale: 1,
            startPosX: 0,
            startPosY: 0,
            imgW: 0,
            imgH: 0,
            moved: false,
          }
          container.setPointerCapture(e.pointerId)
          e.preventDefault()
          return
        }
        if (node) {
          const o = slide.el?.[selection.key]
          dragRef.current = {
            mode: "scale",
            key: selection.key,
            type: selection.type,
            node,
            startX: e.clientX,
            startY: e.clientY,
            startDx: o?.dx ?? 0,
            startDy: o?.dy ?? 0,
            baseLeft: selBox.x,
            baseTop: selBox.y,
            baseW: selBox.w,
            baseH: selBox.h,
            startScale: o?.scale ?? 1,
            startPosX: 0,
            startPosY: 0,
            imgW: 0,
            imgH: 0,
            moved: false,
          }
          container.setPointerCapture(e.pointerId)
          e.preventDefault()
          return
        }
      }
    }

    const hit = hitTest(px, py)
    if (!hit) {
      onSelect({ key: "background", type: "background" })
      return
    }
    onSelect({ key: hit.key, type: hit.type })
    const node = findNode(hit.key)
    if (!node) return

    if (hit.type === "block") {
      const b = blockOf(hit.key)
      if (!b) return
      dragRef.current = {
        mode: "block",
        key: hit.key,
        type: "block",
        node,
        startX: e.clientX,
        startY: e.clientY,
        startDx: b.x,
        startDy: b.y,
        baseLeft: hit.x,
        baseTop: hit.y,
        baseW: hit.w,
        baseH: hit.h,
        startScale: 1,
        startPosX: 0,
        startPosY: 0,
        imgW: 0,
        imgH: 0,
        moved: false,
      }
    } else if (hit.type === "image") {
      // Pan da foto (só quando há foto com object-cover)
      if (!slide.image.url) return
      dragRef.current = {
        mode: "pan",
        key: hit.key,
        type: hit.type,
        node,
        startX: e.clientX,
        startY: e.clientY,
        startDx: 0,
        startDy: 0,
        baseLeft: hit.x,
        baseTop: hit.y,
        baseW: hit.w,
        baseH: hit.h,
        startScale: 1,
        startPosX: slide.image.posX ?? 50,
        startPosY: slide.image.posY ?? 20,
        imgW: hit.w,
        imgH: hit.h,
        moved: false,
      }
    } else {
      const o = slide.el?.[hit.key]
      const curDx = (o?.dx ?? 0) * scale
      const curDy = (o?.dy ?? 0) * scale
      dragRef.current = {
        mode: "element",
        key: hit.key,
        type: hit.type,
        node,
        startX: e.clientX,
        startY: e.clientY,
        startDx: o?.dx ?? 0,
        startDy: o?.dy ?? 0,
        baseLeft: hit.x - curDx,
        baseTop: hit.y - curDy,
        baseW: hit.w,
        baseH: hit.h,
        startScale: o?.scale ?? 1,
        startPosX: 0,
        startPosY: 0,
        imgW: 0,
        imgH: 0,
        moved: false,
      }
    }
    if (dragRef.current) dragRef.current.wasSelected = selection?.key === hit.key
    container.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const container = containerRef.current
    if (!container) return
    const cRect = container.getBoundingClientRect()
    const d = dragRef.current

    if (!d) {
      // hover puro
      const box = hitTest(e.clientX - cRect.left, e.clientY - cRect.top)
      setHover(box)
      return
    }

    const dxPx = e.clientX - d.startX
    const dyPx = e.clientY - d.startY
    if (!d.moved && Math.abs(dxPx) < 3 && Math.abs(dyPx) < 3) return
    d.moved = true

    if (d.mode === "block") {
      // bloco livre: move left/top (design px) com clamp no slide + snap
      let nx = d.startDx * scale + dxPx
      let ny = d.startDy * scale + dyPx
      nx = Math.max(0, Math.min(width - d.baseW, nx))
      ny = Math.max(0, Math.min(height - d.baseH, ny))
      // Snap: centro do slide + bordas/centros dos OUTROS elementos (blocos e
      // nativos) — alinhamento entre blocos, como no Canva/Elementor.
      const others = getBoxes().filter((b) => b.key !== d.key)
      const xs = [width / 2, ...others.flatMap((b) => [b.x, b.x + b.w / 2, b.x + b.w])]
      const ys = [height / 2, ...others.flatMap((b) => [b.y, b.y + b.h / 2, b.y + b.h])]
      let gv: number | null = null
      let gh: number | null = null
      for (const gx of xs) {
        for (const [off, mine] of [[0, nx], [d.baseW / 2, nx + d.baseW / 2], [d.baseW, nx + d.baseW]]) {
          if (Math.abs(mine - gx) < SNAP_PX) {
            nx = gx - off
            gv = gx
            break
          }
        }
        if (gv != null) break
      }
      for (const gy of ys) {
        for (const [off, mine] of [[0, ny], [d.baseH / 2, ny + d.baseH / 2], [d.baseH, ny + d.baseH]]) {
          if (Math.abs(mine - gy) < SNAP_PX) {
            ny = gy - off
            gh = gy
            break
          }
        }
        if (gh != null) break
      }
      nx = Math.max(0, Math.min(width - d.baseW, nx))
      ny = Math.max(0, Math.min(height - d.baseH, ny))
      setGuides({ v: gv, h: gh })
      const bx = Math.round(nx / scale)
      const by = Math.round(ny / scale)
      d.node.style.left = `${bx}px`
      d.node.style.top = `${by}px`
      ;(d as { liveX?: number }).liveX = bx
      ;(d as { liveY?: number }).liveY = by
      setSelBox({ key: d.key, type: d.type, x: nx, y: ny, w: d.baseW, h: d.baseH })
      return
    }
    if (d.mode === "block-resize") {
      // redimensiona a CAIXA (w/h reais) — Shift mantém a proporção
      let nw = d.baseW + dxPx / scale
      let nh = d.baseH + dyPx / scale
      if (e.shiftKey) nh = nw * (d.baseH / d.baseW)
      const maxW = width / scale - d.startDx
      const maxH = height / scale - d.startDy
      nw = Math.round(Math.max(BLOCK_MIN_SIZE, Math.min(maxW, nw)))
      nh = Math.round(Math.max(BLOCK_MIN_SIZE, Math.min(maxH, nh)))
      d.node.style.width = `${nw}px`
      d.node.style.height = `${nh}px`
      ;(d as { liveW?: number }).liveW = nw
      ;(d as { liveH?: number }).liveH = nh
      setSelBox({
        key: d.key,
        type: d.type,
        x: d.baseLeft,
        y: d.baseTop,
        w: nw * scale,
        h: nh * scale,
      })
      return
    }

    if (d.mode === "element") {
      // clamp: o retângulo BASE + translate nunca sai do slide
      let nx = d.startDx * scale + dxPx
      let ny = d.startDy * scale + dyPx
      nx = Math.max(-d.baseLeft, Math.min(width - (d.baseLeft + d.baseW), nx))
      ny = Math.max(-d.baseTop, Math.min(height - (d.baseTop + d.baseH), ny))

      // snap: centro do slide + posição original
      const cx = d.baseLeft + nx + d.baseW / 2
      const cy = d.baseTop + ny + d.baseH / 2
      let v = false
      let h = false
      if (Math.abs(cx - width / 2) < SNAP_PX) {
        nx = width / 2 - d.baseW / 2 - d.baseLeft
        v = true
      }
      if (Math.abs(cy - height / 2) < SNAP_PX) {
        ny = height / 2 - d.baseH / 2 - d.baseTop
        h = true
      }
      if (Math.abs(nx) < SNAP_PX && Math.abs(ny) < SNAP_PX && !v && !h) {
        nx = 0
        ny = 0
      }
      setGuides({ v: v ? width / 2 : null, h: h ? height / 2 : null })

      // aplica direto no DOM (fluido) — commit só no soltar
      const designDx = nx / scale
      const designDy = ny / scale
      const parts: string[] = []
      if (designDx || designDy) parts.push(`translate(${designDx}px, ${designDy}px)`)
      if (d.startScale !== 1) parts.push(`scale(${d.startScale})`)
      d.node.style.transform = parts.join(" ")
      d.node.style.transformOrigin = "top left"
      setSelBox({
        key: d.key,
        type: d.type,
        x: d.baseLeft + nx,
        y: d.baseTop + ny,
        w: d.baseW,
        h: d.baseH,
      })
    } else if (d.mode === "scale") {
      const ratio = (d.baseW + dxPx) / d.baseW
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, d.startScale * ratio))
      const parts: string[] = []
      if (d.startDx || d.startDy)
        parts.push(`translate(${d.startDx}px, ${d.startDy}px)`)
      if (next !== 1) parts.push(`scale(${next})`)
      d.node.style.transform = parts.join(" ")
      d.node.style.transformOrigin = "top left"
      // guarda o valor corrente pra commitar no soltar
      ;(d as { liveScale?: number }).liveScale = next
      setSelBox({
        key: d.key,
        type: d.type,
        x: d.baseLeft,
        y: d.baseTop,
        w: d.baseW * (next / (d.startScale || 1)),
        h: d.baseH * (next / (d.startScale || 1)),
      })
    } else if (d.mode === "pan") {
      // arrastar a foto = deslocar o recorte (invertido, como no Canva)
      const zoom = (slide.image.zoom ?? 100) / 100
      const fx = (dxPx / Math.max(d.imgW, 1)) * 100 * (1 / zoom)
      const fy = (dyPx / Math.max(d.imgH, 1)) * 100 * (1 / zoom)
      const nx = Math.max(0, Math.min(100, d.startPosX - fx))
      const ny = Math.max(0, Math.min(100, d.startPosY - fy))
      if (d.node instanceof HTMLImageElement) {
        d.node.style.objectPosition = `${nx}% ${ny}%`
      }
      ;(d as { livePosX?: number }).livePosX = nx
      ;(d as { livePosY?: number }).livePosY = ny
    }
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const container = containerRef.current
    const d = dragRef.current
    dragRef.current = null
    setGuides({ v: null, h: null })
    if (container?.hasPointerCapture(e.pointerId)) {
      container.releasePointerCapture(e.pointerId)
    }
    if (!d) return
    if (!d.moved) {
      // 2º clique (sem arrastar) num texto já selecionado → digita no slide
      if (d.mode === "element" && d.wasSelected) startInlineEdit(d.key, d.type)
      return
    }

    if (d.mode === "block") {
      const lx = (d as { liveX?: number }).liveX
      const ly = (d as { liveY?: number }).liveY
      if (lx != null && ly != null) onBlockPatch(d.key, { x: lx, y: ly })
      return
    }
    if (d.mode === "block-resize") {
      const lw = (d as { liveW?: number }).liveW
      const lh = (d as { liveH?: number }).liveH
      if (lw != null && lh != null) onBlockPatch(d.key, { w: lw, h: lh })
      return
    }

    if (d.mode === "element") {
      // lê o transform aplicado no DOM e commita (1 entrada de histórico)
      const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(
        d.node.style.transform || "",
      )
      const dx = m ? Math.round(parseFloat(m[1]) * 10) / 10 : 0
      const dy = m ? Math.round(parseFloat(m[2]) * 10) / 10 : 0
      onOverride(d.key, { dx: dx || undefined, dy: dy || undefined })
    } else if (d.mode === "scale") {
      const live = (d as { liveScale?: number }).liveScale
      if (live != null) {
        const rounded = Math.round(live * 100) / 100
        onOverride(d.key, { scale: rounded === 1 ? undefined : rounded })
      }
    } else if (d.mode === "pan") {
      const px = (d as { livePosX?: number }).livePosX
      const py = (d as { livePosY?: number }).livePosY
      if (px != null && py != null) {
        onImagePan(Math.round(px), Math.round(py))
      }
    }
  }

  // ── Botão direito → menu de contexto (esqueleto Canva) ─────────────────
  function onContextMenu(e: ReactMouseEvent<HTMLDivElement>) {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const cRect = container.getBoundingClientRect()
    openMenu(e.clientX - cRect.left, e.clientY - cRect.top)
  }

  // Botão direito veio de um slide que ainda não estava selecionado: abre o
  // menu no ponto clicado assim que o canvas monta. O rAF espera o editor
  // limpar a seleção da troca de slide (senão ela apagaria a nova).
  const openMenuRef = useRef(openMenu)
  openMenuRef.current = openMenu
  const { openMenuAt, onMenuOpened } = props
  useEffect(() => {
    if (!openMenuAt) return
    const id = requestAnimationFrame(() => {
      openMenuRef.current(openMenuAt.fx * width, openMenuAt.fy * height)
      onMenuOpened?.()
    })
    return () => cancelAnimationFrame(id)
  }, [openMenuAt, onMenuOpened, width, height])

  function openMenu(px: number, py: number) {
    const hit = hitTest(px, py)
    const sel: EditorSelection = hit
      ? { key: hit.key, type: hit.type }
      : { key: "background", type: "background" }
    onSelect(sel)
    // clampa pro menu não vazar do canvas (overflow-hidden)
    const MENU_W = 224
    const MENU_H = sel.type === "background" ? 210 : sel.type === "block" ? 420 : sel.type === "image" ? 300 : sel.type === "badge" ? 460 : 340
    setMenu({
      x: Math.max(4, Math.min(px, width - MENU_W - 4)),
      y: Math.max(4, Math.min(py, height - MENU_H - 4)),
      px,
      py,
      sel,
    })
  }

  function menuAct(action: MenuAction) {
    if (!menu) return
    if (action === "edit-text" && startInlineEdit(menu.sel.key, menu.sel.type)) return
    onMenuAction(action, menu.sel)
    setMenu(null)
  }

  /** "Inserir imagem…": bloco de imagem no ponto clicado + file picker. */
  function insertImage() {
    if (!menu) return
    onImageInsert(menu.px / scale, menu.py / scale)
    setMenu(null)
  }

  function copyImageTo(target: number) {
    if (!menu) return
    onImageCopyTo(menu.sel, target)
    setMenu(null)
  }

  /** Alinha o elemento selecionado ao slide (flush, como o Canva). */
  function alignElement(sel: EditorSelection, h?: AlignH, v?: AlignV) {
    if (sel.type === "background" || sel.type === "image") return
    const box = getBoxes().find((b) => b.key === sel.key)
    const node = findNode(sel.key)
    if (!box || !node) return
    if (sel.type === "block") {
      const b = blockOf(sel.key)
      if (!b) return
      const W = width / scale
      const H = height / scale
      const patch: Partial<SlideBlock> = {}
      if (h === "left") patch.x = 8
      if (h === "center") patch.x = Math.round((W - b.w) / 2)
      if (h === "right") patch.x = Math.round(W - b.w - 8)
      if (v === "top") patch.y = 8
      if (v === "middle") patch.y = Math.round((H - b.h) / 2)
      if (v === "bottom") patch.y = Math.round(H - b.h - 8)
      onBlockPatch(sel.key, patch)
      setMenu(null)
      return
    }
    const o = slide.el?.[sel.key]
    const curDx = (o?.dx ?? 0) * scale
    const curDy = (o?.dy ?? 0) * scale
    const baseLeft = box.x - curDx
    const baseTop = box.y - curDy
    let dxPx = curDx
    let dyPx = curDy
    if (h === "left") dxPx = -baseLeft + 8
    if (h === "center") dxPx = (width - box.w) / 2 - baseLeft
    if (h === "right") dxPx = width - box.w - baseLeft - 8
    if (v === "top") dyPx = -baseTop + 8
    if (v === "middle") dyPx = (height - box.h) / 2 - baseTop
    if (v === "bottom") dyPx = height - box.h - baseTop - 8
    const dx = Math.round((dxPx / scale) * 10) / 10
    const dy = Math.round((dyPx / scale) * 10) / 10
    onOverride(sel.key, { dx: dx || undefined, dy: dy || undefined })
    setMenu(null)
  }

  function onDoubleClick(e: ReactMouseEvent<HTMLDivElement>) {
    const container = containerRef.current
    if (!container) return
    const cRect = container.getBoundingClientRect()
    const hit = hitTest(e.clientX - cRect.left, e.clientY - cRect.top)
    if (!hit) return
    if (hit.type === "image") {
      onImagePick()
    } else if (hit.type === "block") {
      const b = blockOf(hit.key)
      if (b?.type === "image") onMenuAction("image-replace", { key: hit.key, type: "block" })
      else onTextEdit({ key: hit.key, type: hit.type })
    } else if (editing?.key !== hit.key && !startInlineEdit(hit.key, hit.type)) {
      onTextEdit({ key: hit.key, type: hit.type })
    }
  }

  // Zoom da foto pela roda do mouse (imagem selecionada, ou Ctrl+roda em cima
  // da foto) — commit com debounce. Listener NATIVO não-passivo: o onWheel do
  // React é passivo, o preventDefault era ignorado e o Ctrl+roda dava zoom na
  // página em vez de na foto.
  function onWheel(e: WheelEvent) {
    if (!slide.image.url) return
    let key = selection?.type === "image" ? selection.key : null
    if (!key && e.ctrlKey) {
      const container = containerRef.current
      if (!container) return
      const cRect = container.getBoundingClientRect()
      const px = e.clientX - cRect.left
      const py = e.clientY - cRect.top
      const img = getBoxes().find(
        (b) => b.type === "image" && px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h,
      )
      if (!img) return
      key = img.key
      onSelect({ key: img.key, type: "image" })
    }
    if (!key) return
    e.preventDefault()
    const cur = zoomCommitRef.current != null ? zoomValueRef.current : (slide.image.zoom ?? 100)
    const next = Math.max(100, Math.min(250, cur + (e.deltaY < 0 ? 5 : -5)))
    zoomValueRef.current = next
    const node = findNode(key)
    if (node instanceof HTMLImageElement) {
      node.style.transform = next !== 100 ? `scale(${next / 100})` : ""
      node.style.transformOrigin = "center"
    }
    if (zoomCommitRef.current) window.clearTimeout(zoomCommitRef.current)
    zoomCommitRef.current = window.setTimeout(() => {
      zoomCommitRef.current = null
      onImageZoom(zoomValueRef.current)
    }, 350)
  }
  const wheelRef = useRef(onWheel)
  wheelRef.current = onWheel
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const fn = (e: WheelEvent) => wheelRef.current(e)
    el.addEventListener("wheel", fn, { passive: false })
    return () => el.removeEventListener("wheel", fn)
  }, [])

  // Drag-and-drop de arquivo de imagem direto no slide.
  function onDragOver(e: ReactDragEvent<HTMLDivElement>) {
    if (e.dataTransfer.types.includes(BLOCK_DRAG_MIME)) {
      e.preventDefault()
      e.dataTransfer.dropEffect = "copy"
      setDropActive("block")
    } else if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault()
      setDropActive("file")
    }
  }
  function onDrop(e: ReactDragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDropActive(false)
    const blockType = e.dataTransfer.getData(BLOCK_DRAG_MIME) as BlockType | ""
    if (blockType) {
      const container = containerRef.current
      if (!container) return
      const cRect = container.getBoundingClientRect()
      // ponto solto → px de design (o bloco nasce centralizado nele)
      onBlockDrop(blockType, (e.clientX - cRect.left) / scale, (e.clientY - cRect.top) / scale)
      return
    }
    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.type.startsWith("image/"),
    )
    if (file) onImageFile(file)
  }

  // Teclado: Esc desseleciona/fecha menu · setas = nudge 1px (Shift = 10px) ·
  // Ctrl+Alt+C/V = copiar/colar estilo (padrão Canva).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenu(null)
        onSelect(null)
        return
      }
      // não intercepta digitação em campos da sidebar
      const ae = document.activeElement as HTMLElement | null
      if (
        ae &&
        (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable)
      )
        return
      if (!selection || selection.type === "background") return

      if (e.ctrlKey && e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault()
        onMenuAction("copy-style", selection)
        return
      }
      if (e.ctrlKey && e.altKey && (e.key === "v" || e.key === "V")) {
        e.preventDefault()
        onMenuAction("paste-style", selection)
        return
      }

      if (selection.type === "block") {
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault()
          onMenuAction("block-delete", selection)
          return
        }
        if (!e.key.startsWith("Arrow")) return
        e.preventDefault()
        const b = blockOf(selection.key)
        if (!b) return
        const step = e.shiftKey ? 10 : 1
        let { x, y } = b
        if (e.key === "ArrowLeft") x -= step
        if (e.key === "ArrowRight") x += step
        if (e.key === "ArrowUp") y -= step
        if (e.key === "ArrowDown") y += step
        x = Math.max(0, Math.min(width / scale - b.w, x))
        y = Math.max(0, Math.min(height / scale - b.h, y))
        onBlockPatch(selection.key, { x: Math.round(x), y: Math.round(y) })
        return
      }

      if (selection.type === "image") return
      if (!e.key.startsWith("Arrow")) return
      e.preventDefault()
      const box = getBoxes().find((b) => b.key === selection.key)
      if (!box) return
      const o = slide.el?.[selection.key]
      const curDx = (o?.dx ?? 0) * scale
      const curDy = (o?.dy ?? 0) * scale
      const baseLeft = box.x - curDx
      const baseTop = box.y - curDy
      const step = (e.shiftKey ? 10 : 1) * scale
      let nx = curDx
      let ny = curDy
      if (e.key === "ArrowLeft") nx -= step
      if (e.key === "ArrowRight") nx += step
      if (e.key === "ArrowUp") ny -= step
      if (e.key === "ArrowDown") ny += step
      nx = Math.max(-baseLeft, Math.min(width - (baseLeft + box.w), nx))
      ny = Math.max(-baseTop, Math.min(height - (baseTop + box.h), ny))
      const dx = Math.round((nx / scale) * 10) / 10
      const dy = Math.round((ny / scale) * 10) / 10
      onOverride(selection.key, { dx: dx || undefined, dy: dy || undefined })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onSelect, selection, slide.el, slide.blocks, scale, width, height, getBoxes, onMenuAction, onOverride, onBlockPatch])

  const cursor = dragRef.current
    ? dragRef.current.mode === "pan"
      ? "grabbing"
      : "move"
    : hover
      ? hover.type === "image"
        ? "grab"
        : "move"
      : "default"

  const showHover = hover && (!selection || hover.key !== selection.key)

  /** Amostras de cor dos menus/barrinhas: cores da marca + preto + branco. */
  const swatches = Array.from(
    new Set([...props.colors.slice(0, 4), "#0A0A0F", "#FFFFFF"].map((c) => c.toUpperCase())),
  )

  return (
    <div
      ref={containerRef}
      style={{ width, height, cursor }}
      className="relative overflow-hidden rounded-xl bg-black ring-2 ring-brand-500 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)] select-none"
      onPointerDown={(e) => {
        if (menu) setMenu(null)
        onPointerDown(e)
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => setHover(null)}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onDragOver={onDragOver}
      onDragLeave={() => setDropActive(false)}
      onDrop={onDrop}
    >
      {/* Slide real (escalado) */}
      <div
        ref={innerRef}
        style={{ width: REF_W, transformOrigin: "top left", transform: `scale(${scale})` }}
        className="pointer-events-none"
      >
        <SlidePreview
          slide={slide}
          totalSlides={props.total}
          template={props.template}
          brandColors={props.colors}
          fontClass={props.fontClass}
          editorialStyle={props.style}
          handle={props.handle}
          handleInitials={props.handleInitials}
          {...props.chrome}
          brandLabel={props.brandName}
          showDevBadges={false}
          format={format}
          titleWeight={props.titleWeight}
          titleScale={props.titleScale}
          bodyWeight={props.bodyWeight}
          bodyScale={props.bodyScale}
        />
      </div>

      {/* ── Overlay (chrome do editor — NUNCA vai pro export) ── */}

      {/* Guias de snap */}
      {guides.v != null && (
        <div className="pointer-events-none absolute inset-y-0 z-30 w-px bg-cyan-400/90" style={{ left: guides.v }} />
      )}
      {guides.h != null && (
        <div className="pointer-events-none absolute inset-x-0 z-30 h-px bg-cyan-400/90" style={{ top: guides.h }} />
      )}

      {/* Hover */}
      {showHover && (
        <div
          className="pointer-events-none absolute z-20 rounded-[3px] border border-dashed border-brand-400"
          style={{ left: hover.x - 2, top: hover.y - 2, width: hover.w + 4, height: hover.h + 4 }}
        >
          <span className="absolute -top-5 left-0 rounded bg-brand-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            {chipLabel(hover.key, hover.type)}
          </span>
        </div>
      )}

      {/* Seleção */}
      {selBox && selection && selection.type !== "background" && (
        <div
          className="pointer-events-none absolute z-20 rounded-[3px] border-2 border-brand-500"
          style={{ left: selBox.x - 2, top: selBox.y - 2, width: selBox.w + 4, height: selBox.h + 4 }}
        >
          <span className="absolute -top-5 left-0 rounded bg-brand-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            {chipLabel(selection.key, selection.type as EditableType)}
          </span>
          {selection.type !== "image" && (
            <span className="absolute -bottom-[7px] -right-[7px] h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-600 shadow" />
          )}
          {selection.type === "block" && (
            <div
              className="pointer-events-auto absolute -top-[26px] left-1/2 -translate-x-1/2 flex items-center rounded-md bg-brand-600 text-white shadow overflow-hidden"
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                title="Duplicar"
                onClick={() => onMenuAction("block-duplicate", selection)}
                className="h-6 w-6 flex items-center justify-center hover:bg-white/15"
              >
                <CopyPlus className="h-3 w-3" />
              </button>
              <span className="h-6 w-6 flex items-center justify-center opacity-80 cursor-move" title="Arraste o bloco pra mover">
                <Move className="h-3 w-3" />
              </span>
              <button
                type="button"
                title="Excluir (Del)"
                onClick={() => onMenuAction("block-delete", selection)}
                className="h-6 w-6 flex items-center justify-center hover:bg-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
          {selection.type === "image" && slide.image.url && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-0.5 text-[9px] text-white">
              arraste · role p/ zoom · 2× clique troca
            </span>
          )}
        </div>
      )}

      {/* Seleção de fundo */}
      {selection?.type === "background" && (
        <div className="pointer-events-none absolute inset-0.5 z-20 rounded-lg border-2 border-brand-500">
          <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            Fundo
          </span>
        </div>
      )}

      {/* Edição de texto direto no slide (sincroniza com o campo da sidebar) */}
      {editing && (
        <textarea
          ref={editRef}
          autoFocus
          spellCheck={false}
          rows={1}
          value={
            editing.field === "handle"
              ? props.handle
              : editing.field
                ? ((slide[editing.field] as string | undefined) ?? "")
                : (slide.el?.[editing.key]?.text ?? editing.placeholder)
          }
          placeholder={editing.placeholder}
          onChange={(e) =>
            editing.field
              ? onTextChange(editing.field, e.target.value)
              : onOverride(editing.key, { text: e.target.value })
          }
          onFocus={(e) => {
            const len = e.currentTarget.value.length
            e.currentTarget.setSelectionRange(len, len)
          }}
          onBlur={stopInlineEdit}
          onSelect={(e) => {
            if (editing.field !== "title") return
            const t = e.currentTarget
            setTitleSel(t.value.slice(t.selectionStart, t.selectionEnd))
          }}
          onKeyDown={(e) => {
            const done =
              e.key === "Escape" ||
              (e.key === "Enter" && (e.ctrlKey || e.metaKey)) ||
              (e.key === "Enter" && !e.shiftKey && editing.field !== "body")
            if (done) {
              e.preventDefault()
              e.stopPropagation()
              e.currentTarget.blur()
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.stopPropagation()}
          className="absolute z-40 m-0 resize-none overflow-hidden border-0 outline outline-2 outline-offset-2 outline-brand-500 select-text"
          style={{
            left: editing.x,
            top: editing.y,
            width: editing.w,
            minHeight: editing.h,
            cursor: "text",
            ...editing.style,
          }}
        />
      )}

      {/* Barrinha de destaque do título — aparece com palavras selecionadas.
          mousedown.preventDefault mantém o foco no textarea (não fecha a edição). */}
      {editing?.field === "title" && titleSel.trim() && props.onSlidePatch && (
        <div
          className="absolute z-50 flex max-w-[calc(100%-8px)] flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-[#15151b] px-2 py-1.5"
          style={{
            left: Math.max(4, Math.min(editing.x, width - 340)),
            top: editing.y < 48 ? editing.y + editing.h + 8 : editing.y - 40,
          }}
          onMouseDown={(e) => e.preventDefault()}
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <span className="mr-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40">Cor</span>
          {swatches.map((c) => (
            <button
              key={`c-${c}`}
              type="button"
              title={`Cor ${c}`}
              onClick={() => applyHighlight({ color: c })}
              className="h-4 w-4 rounded-full border border-white/20 transition-colors hover:border-white/60"
              style={{ backgroundColor: c }}
            />
          ))}
          <span className="mx-1 h-4 w-px bg-white/10" />
          <span className="mr-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40">Fundo</span>
          {swatches.map((c) => (
            <button
              key={`b-${c}`}
              type="button"
              title={`Marca-texto ${c}`}
              onClick={() => applyHighlight({ bg: c })}
              className="h-4 w-4 rounded-sm border border-white/20 transition-colors hover:border-white/60"
              style={{ backgroundColor: c }}
            />
          ))}
          <span className="mx-1 h-4 w-px bg-white/10" />
          <span className="mr-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40">Degradê</span>
          {HIGHLIGHT_GRADIENTS.map((g) => (
            <button
              key={g.bg}
              type="button"
              title={`Marca-texto ${g.name}`}
              onClick={() => applyHighlight({ bg: g.bg })}
              className="h-4 w-4 rounded-sm border border-white/20 transition-colors hover:border-white/60"
              style={{ backgroundImage: g.bg }}
            />
          ))}
          <span className="mx-1 h-4 w-px bg-white/10" />
          <button
            type="button"
            title="Tirar destaque"
            onClick={() => applyHighlight(null)}
            className="flex h-5 w-5 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Drop de arquivo */}
      {dropActive && (
        <div
          className={`pointer-events-none absolute inset-0 z-40 flex items-center justify-center ${
            dropActive === "block"
              ? "bg-brand-600/10 border-2 border-dashed border-brand-400 rounded-xl"
              : "bg-brand-600/25 backdrop-blur-[1px]"
          }`}
        >
          <span className="rounded-lg bg-black/75 px-3 py-1.5 text-[12px] font-medium text-white">
            {dropActive === "block" ? "Solte o elemento aqui" : "Solte pra trocar a imagem"}
          </span>
        </div>
      )}

      {/* ── Menu de contexto (botão direito) — esqueleto Canva:
             ação principal → arranjo → propriedades ── */}
      {menu && (
        <div
          className="absolute z-50 w-[224px] rounded-lg border border-white/10 bg-[#15151b] py-1 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.8)]"
          style={{ left: menu.x, top: menu.y }}
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {menu.sel.type === "background" ? (
            <>
              <MenuItem icon={Paintbrush} label="Cor do fundo…" onClick={() => menuAct("bg-color")} />
              <MenuItem
                icon={RotateCcw}
                label="Fundo padrão do estilo"
                onClick={() => menuAct("bg-default")}
                disabled={!slide.bg}
              />
              <MenuSep />
              <MenuItem icon={ImagePlus} label="Inserir imagem…" onClick={insertImage} />
              <MenuSep />
              <MenuItem icon={CopyPlus} label="Duplicar slide" onClick={() => menuAct("slide-duplicate")} />
              <MenuItem
                icon={Trash2}
                label="Excluir slide"
                onClick={() => menuAct("slide-delete")}
                disabled={props.total <= 1}
                danger
              />
            </>
          ) : menu.sel.type === "block" ? (
            <>
              {(() => {
                const b = blockOf(menu.sel.key)
                const isImg = b?.type === "image"
                const isText = b?.type === "heading" || b?.type === "text" || b?.type === "pill"
                return (
                  <>
                    {isImg && (
                      <MenuItem
                        icon={ImageIcon}
                        label={b?.url ? "Trocar imagem…" : "Adicionar imagem…"}
                        shortcut="2×"
                        onClick={() => menuAct("image-replace")}
                      />
                    )}
                    {isText && (
                      <MenuItem icon={Pencil} label="Editar texto…" shortcut="2×" onClick={() => menuAct("edit-text")} />
                    )}
                    <MenuItem icon={Paintbrush} label="Propriedades…" onClick={() => menuAct("color")} />
                    {isImg && b?.url && (
                      <>
                        <MenuSep />
                        <CopyToSlideRow total={props.total} current={slide.order_index} onPick={copyImageTo} />
                      </>
                    )}
                  </>
                )
              })()}
              <MenuSep />
              <div className="px-3 pb-1 pt-1.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
                  <Move className="h-3 w-3" /> Alinhar ao slide
                </div>
                <div className="flex items-center gap-1">
                  {(
                    [
                      [AlignStartVertical, "Esquerda", "left", undefined],
                      [AlignCenterVertical, "Centro", "center", undefined],
                      [AlignEndVertical, "Direita", "right", undefined],
                      [AlignStartHorizontal, "Topo", undefined, "top"],
                      [AlignCenterHorizontal, "Meio", undefined, "middle"],
                      [AlignEndHorizontal, "Fundo", undefined, "bottom"],
                    ] as Array<[typeof Move, string, AlignH | undefined, AlignV | undefined]>
                  ).map(([Icon, tip, h, v]) => (
                    <button
                      key={tip}
                      type="button"
                      title={tip}
                      onClick={() => alignElement(menu.sel, h, v)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              </div>
              <MenuSep />
              <MenuItem icon={CopyPlus} label="Duplicar bloco" onClick={() => menuAct("block-duplicate")} />
              <MenuItem icon={BringToFront} label="Trazer pra frente" onClick={() => menuAct("block-front")} />
              <MenuItem icon={SendToBack} label="Enviar pra trás" onClick={() => menuAct("block-back")} />
              <MenuItem icon={Layers} label="Aplicar em todos os slides" onClick={() => menuAct("block-apply-all")} />
              <MenuSep />
              <MenuItem icon={Trash2} label="Excluir bloco" shortcut="Del" onClick={() => menuAct("block-delete")} danger />
            </>
          ) : menu.sel.type === "image" ? (
            <>
              <MenuItem
                icon={ImageIcon}
                label={slide.image.url ? "Trocar imagem…" : "Adicionar imagem…"}
                shortcut="2×"
                onClick={() => menuAct("image-replace")}
              />
              {slide.image.url && (
                <>
                  <MenuItem icon={ImagePlus} label="Inserir outra imagem…" onClick={insertImage} />
                  <MenuItem icon={Crop} label="Ajustar enquadramento…" onClick={() => menuAct("image-adjust")} />
                  <MenuItem
                    icon={RotateCcw}
                    label="Restaurar enquadramento"
                    onClick={() => menuAct("image-reset")}
                    disabled={
                      slide.image.posX == null &&
                      slide.image.posY == null &&
                      slide.image.zoom == null
                    }
                  />
                  <MenuItem icon={Palette} label="Extrair paleta da imagem" onClick={() => menuAct("palette")} />
                  <MenuSep />
                  <CopyToSlideRow total={props.total} current={slide.order_index} onPick={copyImageTo} />
                  <MenuSep />
                  <MenuItem icon={Trash2} label="Remover imagem" onClick={() => menuAct("image-remove")} danger />
                </>
              )}
            </>
          ) : (
            <>
              <MenuItem icon={Pencil} label="Editar texto…" shortcut="2×" onClick={() => menuAct("edit-text")} />
              <MenuItem icon={Paintbrush} label="Cor e tamanho…" onClick={() => menuAct("color")} />
              {menu.sel.type === "badge" && (
                <>
                  <MenuSep />
                  <ColorSwatchRow
                    label="Fundo da tag"
                    value={slide.el?.[menu.sel.key]?.bg}
                    colors={swatches}
                    onPick={(c) => onOverride(menu.sel.key, { bg: c })}
                  />
                  <ColorSwatchRow
                    label="Texto da tag"
                    value={slide.el?.[menu.sel.key]?.color}
                    colors={swatches}
                    onPick={(c) => onOverride(menu.sel.key, { color: c })}
                  />
                </>
              )}
              <MenuItem icon={ImagePlus} label="Inserir imagem…" onClick={insertImage} />
              <MenuSep />
              <div className="px-3 pb-1 pt-1.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
                  <Move className="h-3 w-3" /> Alinhar ao slide
                </div>
                <div className="flex items-center gap-1">
                  {(
                    [
                      [AlignStartVertical, "Esquerda", "left", undefined],
                      [AlignCenterVertical, "Centro", "center", undefined],
                      [AlignEndVertical, "Direita", "right", undefined],
                      [AlignStartHorizontal, "Topo", undefined, "top"],
                      [AlignCenterHorizontal, "Meio", undefined, "middle"],
                      [AlignEndHorizontal, "Fundo", undefined, "bottom"],
                    ] as Array<[typeof Move, string, AlignH | undefined, AlignV | undefined]>
                  ).map(([Icon, tip, h, v]) => (
                    <button
                      key={tip}
                      type="button"
                      title={tip}
                      onClick={() => alignElement(menu.sel, h, v)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              </div>
              <MenuSep />
              <MenuItem icon={Copy} label="Copiar estilo" shortcut="Ctrl+Alt+C" onClick={() => menuAct("copy-style")} />
              <MenuItem
                icon={ClipboardPaste}
                label="Colar estilo"
                shortcut="Ctrl+Alt+V"
                onClick={() => menuAct("paste-style")}
                disabled={!hasStyleClipboard}
              />
              <MenuSep />
              <MenuItem icon={EyeOff} label="Ocultar elemento" onClick={() => menuAct("hide")} />
              <MenuItem icon={EyeOff} label="Ocultar em todos os slides" onClick={() => menuAct("hide-all")} />
              <MenuItem
                icon={RotateCcw}
                label="Restaurar padrão"
                onClick={() => menuAct("reset")}
                disabled={!slide.el?.[menu.sel.key]}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Peças do menu de contexto ─────────────────────────────────────────────

/** Linha de amostras de cor (+ cor livre + voltar ao padrão). */
function ColorSwatchRow({
  label,
  value,
  colors,
  onPick,
}: {
  label: string
  value?: string
  colors: string[]
  onPick: (color: string | undefined) => void
}) {
  return (
    <div className="px-3 pb-1 pt-1.5">
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-white/40">{label}</div>
      <div className="flex flex-wrap items-center gap-1">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onPick(c)}
            className={`h-6 w-6 rounded-md border transition-colors ${
              value?.toUpperCase() === c ? "border-brand-500" : "border-white/15 hover:border-white/40"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <label
          title="Outra cor"
          className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-white/15 text-white/60 transition-colors hover:border-white/40"
        >
          <Palette className="h-3 w-3" />
          <input
            type="color"
            value={value && /^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff"}
            onChange={(e) => onPick(e.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <button
          type="button"
          title="Cor padrão"
          onClick={() => onPick(undefined)}
          disabled={!value}
          className="flex h-6 w-6 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
function MenuItem({
  icon: Icon,
  label,
  shortcut,
  onClick,
  disabled,
  danger,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  shortcut?: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12px] transition-colors disabled:cursor-default disabled:opacity-35 ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-white/85 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0 opacity-80" />
      <span className="flex-1 truncate">{label}</span>
      {shortcut && (
        <span className="flex-shrink-0 text-[10px] tabular-nums text-white/35">{shortcut}</span>
      )}
    </button>
  )
}

function MenuSep() {
  return <div className="mx-2 my-1 h-px bg-white/10" />
}

/** Linha "Copiar imagem para o slide": um botão por slide (menos o atual). */
function CopyToSlideRow({
  total,
  current,
  onPick,
}: {
  total: number
  current: number
  onPick: (target: number) => void
}) {
  if (total <= 1) return null
  return (
    <div className="px-3 pb-1 pt-1.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
        <CopyPlus className="h-3 w-3" /> Copiar imagem para o slide
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {Array.from({ length: total }).map((_, i) =>
          i === current ? null : (
            <button
              key={i}
              type="button"
              title={`Slide ${i + 1}`}
              onClick={() => onPick(i)}
              className="flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-[11px] tabular-nums text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {i + 1}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
