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
  type WheelEvent as ReactWheelEvent,
  type ComponentType,
} from "react"
import {
  SlidePreview,
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
  Move,
  Paintbrush,
  Palette,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react"
import {
  collectEditableNodes,
  EDITABLE_TYPE_LABEL,
  type EditableType,
  type ElementOverride,
} from "./editable-overrides"

const REF_W = 420
const SNAP_PX = 6 // tolerância do snap (px do container)
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
}

/** Prioridade de hit-test: menor número ganha (badge por cima da imagem etc). */
const HIT_PRIORITY: Record<EditableType, number> = {
  badge: 0,
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
  } = props

  const scale = width / REF_W
  const height = width * (format === "stories" ? 16 / 9 : 5 / 4)

  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  const [hover, setHover] = useState<Box | null>(null)
  const [selBox, setSelBox] = useState<Box | null>(null)
  const [guides, setGuides] = useState<{ v: boolean; h: boolean }>({ v: false, h: false })
  const [dropActive, setDropActive] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number; sel: EditorSelection } | null>(null)

  // ── Geometria ──────────────────────────────────────────────────────────
  const getBoxes = useCallback((): Box[] => {
    const root = innerRef.current
    const container = containerRef.current
    if (!root || !container) return []
    const cRect = container.getBoundingClientRect()
    return collectEditableNodes(root)
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
    mode: "element" | "pan" | "scale"
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
  } | null>(null)

  const zoomCommitRef = useRef<number | null>(null)
  const zoomValueRef = useRef<number>(100)

  function findNode(key: string): HTMLElement | null {
    const root = innerRef.current
    if (!root) return null
    return collectEditableNodes(root).find((n) => n.key === key)?.node ?? null
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
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

    if (hit.type === "image") {
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
      setGuides({ v, h })

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
    setGuides({ v: false, h: false })
    if (container?.hasPointerCapture(e.pointerId)) {
      container.releasePointerCapture(e.pointerId)
    }
    if (!d || !d.moved) return

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
    const px = e.clientX - cRect.left
    const py = e.clientY - cRect.top
    const hit = hitTest(px, py)
    const sel: EditorSelection = hit
      ? { key: hit.key, type: hit.type }
      : { key: "background", type: "background" }
    onSelect(sel)
    // clampa pro menu não vazar do canvas (overflow-hidden)
    const MENU_W = 224
    const MENU_H = sel.type === "background" ? 190 : 280
    setMenu({
      x: Math.max(4, Math.min(px, width - MENU_W - 4)),
      y: Math.max(4, Math.min(py, height - MENU_H - 4)),
      sel,
    })
  }

  function menuAct(action: MenuAction) {
    if (!menu) return
    onMenuAction(action, menu.sel)
    setMenu(null)
  }

  /** Alinha o elemento selecionado ao slide (flush, como o Canva). */
  function alignElement(sel: EditorSelection, h?: AlignH, v?: AlignV) {
    if (sel.type === "background" || sel.type === "image") return
    const box = getBoxes().find((b) => b.key === sel.key)
    const node = findNode(sel.key)
    if (!box || !node) return
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
    } else {
      onTextEdit({ key: hit.key, type: hit.type })
    }
  }

  // Zoom da foto pela roda do mouse (imagem selecionada) — commit com debounce.
  function onWheel(e: ReactWheelEvent<HTMLDivElement>) {
    if (!selection || selection.type !== "image" || !slide.image.url) return
    e.preventDefault()
    const cur = zoomCommitRef.current != null ? zoomValueRef.current : (slide.image.zoom ?? 100)
    const next = Math.max(100, Math.min(250, cur + (e.deltaY < 0 ? 5 : -5)))
    zoomValueRef.current = next
    const node = findNode(selection.key)
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

  // Drag-and-drop de arquivo de imagem direto no slide.
  function onDragOver(e: ReactDragEvent<HTMLDivElement>) {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault()
      setDropActive(true)
    }
  }
  function onDrop(e: ReactDragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDropActive(false)
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
  }, [onSelect, selection, slide.el, scale, width, height, getBoxes, onMenuAction, onOverride])

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
      onWheel={onWheel}
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
      {guides.v && (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-px bg-cyan-400/90" />
      )}
      {guides.h && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 h-px bg-cyan-400/90" />
      )}

      {/* Hover */}
      {showHover && (
        <div
          className="pointer-events-none absolute z-20 rounded-[3px] border border-dashed border-brand-400"
          style={{ left: hover.x - 2, top: hover.y - 2, width: hover.w + 4, height: hover.h + 4 }}
        >
          <span className="absolute -top-5 left-0 rounded bg-brand-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            {EDITABLE_TYPE_LABEL[hover.type]}
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
            {EDITABLE_TYPE_LABEL[selection.type as EditableType]}
          </span>
          {selection.type !== "image" && (
            <span className="absolute -bottom-[7px] -right-[7px] h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-600 shadow" />
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

      {/* Drop de arquivo */}
      {dropActive && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-brand-600/25 backdrop-blur-[1px]">
          <span className="rounded-lg bg-black/75 px-3 py-1.5 text-[12px] font-medium text-white">
            Solte pra trocar a imagem
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
              <MenuItem icon={CopyPlus} label="Duplicar slide" onClick={() => menuAct("slide-duplicate")} />
              <MenuItem
                icon={Trash2}
                label="Excluir slide"
                onClick={() => menuAct("slide-delete")}
                disabled={props.total <= 1}
                danger
              />
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
                  <MenuItem icon={Trash2} label="Remover imagem" onClick={() => menuAct("image-remove")} danger />
                </>
              )}
            </>
          ) : (
            <>
              <MenuItem icon={Pencil} label="Editar texto…" shortcut="2×" onClick={() => menuAct("edit-text")} />
              <MenuItem icon={Paintbrush} label="Cor e tamanho…" onClick={() => menuAct("color")} />
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
