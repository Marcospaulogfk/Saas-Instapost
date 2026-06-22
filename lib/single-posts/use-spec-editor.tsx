"use client"

import React, { useEffect, useRef, useState } from "react"
import { FreePostRenderer } from "@/components/single-posts/free-post-renderer"
import type { FreePostSpec, FreeBlock } from "@/lib/single-posts/free-spec"

/**
 * Hook reusável de edição "Canva-like" de um FreePostSpec:
 * - canvas: FreePostRenderer editável (arrastar blocos no preview)
 * - panel: lista TEXTOS (texto / tamanho / fonte / align / cor por bloco)
 * - auto-detach: explode stacks em blocos individuais arrastáveis (stacks com
 *   bg ficam atômicos), igual ao editor de post único.
 *
 * Spec é controlado: o componente pai guarda o spec e passa onChange.
 */

const FONT_OPTIONS: Array<[string, string]> = [
  ["inter", "Inter"],
  ["inter_bold", "Inter Bold"],
  ["playfair", "Playfair"],
  ["playfair_italic", "Playfair Italic"],
  ["anton", "Anton"],
  ["bebas", "Bebas Neue"],
  ["montserrat", "Montserrat"],
  ["archivo", "Archivo Black"],
  ["grotesk", "Space Grotesk"],
  ["allura", "Allura (script)"],
]

function normalizeHex(c?: string | null): string {
  if (!c) return "#000000"
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return c
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (m) {
    const h = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")
    return `#${h(+m[1])}${h(+m[2])}${h(+m[3])}`
  }
  return "#ffffff"
}

function getBlockAtPath(blocks: FreeBlock[], path: string): FreeBlock | null {
  const seg = path.split(".").map(Number)
  let cur: FreeBlock | undefined = blocks[seg[0]]
  for (let i = 1; i < seg.length; i++) {
    if (!cur || !("children" in cur)) return null
    cur = (cur as { children: FreeBlock[] }).children[seg[i]]
  }
  return cur ?? null
}

interface EditableEntry {
  path: string
  text: string
  kind: string
}

function collectEditableTexts(blocks: FreeBlock[], prefix = ""): EditableEntry[] {
  const out: EditableEntry[] = []
  blocks.forEach((b, i) => {
    const path = prefix ? `${prefix}.${i}` : String(i)
    if (b.type === "text") out.push({ path, text: b.text, kind: "text" })
    else if (b.type === "pill") out.push({ path, text: b.text, kind: "pill" })
    else if (b.type === "card" || b.type === "stack")
      out.push(...collectEditableTexts(b.children, path))
  })
  return out
}

function updateSpecText(blocks: FreeBlock[], path: string, newText: string): FreeBlock[] {
  const [head, ...rest] = path.split(".").map(Number)
  return blocks.map((b, i) => {
    if (i !== head) return b
    if (rest.length === 0) {
      if (b.type === "text") return { ...b, text: newText }
      if (b.type === "pill") return { ...b, text: newText }
      return b
    }
    if (b.type === "card" || b.type === "stack")
      return { ...b, children: updateSpecText(b.children, rest.join("."), newText) }
    return b
  })
}

function updateSpecBlockPatch(
  blocks: FreeBlock[],
  path: string,
  patch: Record<string, unknown>,
): FreeBlock[] {
  const [head, ...rest] = path.split(".").map(Number)
  return blocks.map((b, i) => {
    if (i !== head) return b
    if (rest.length === 0) return { ...b, ...patch } as FreeBlock
    if (b.type === "card" || b.type === "stack")
      return { ...b, children: updateSpecBlockPatch(b.children, rest.join("."), patch) }
    return b
  })
}

export function useSpecEditor(
  spec: FreePostSpec | null,
  onChange: (s: FreePostSpec) => void,
  opts: { format?: "post" | "story" } = {},
) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const lastDetachedRef = useRef<FreePostSpec | null>(null)

  // ── handlers ──────────────────────────────────────────────────────────────
  function patchBlock(path: string, patch: Record<string, unknown>) {
    if (!spec) return
    onChange({ ...spec, blocks: updateSpecBlockPatch(spec.blocks, path, patch) })
  }
  function editText(path: string, text: string) {
    if (!spec) return
    onChange({ ...spec, blocks: updateSpecText(spec.blocks, path, text) })
  }
  function positionChange(
    path: string,
    position: { left: string; top: string; width: string },
  ) {
    patchBlock(path, { position })
  }
  function deleteBlock(path: string) {
    if (!spec) return
    const seg = path.split(".").map(Number)
    if (seg.length === 1) {
      onChange({ ...spec, blocks: spec.blocks.filter((_, i) => i !== seg[0]) })
      setSelectedPath(null)
      return
    }
    function removeFromTree(blocks: FreeBlock[], depth: number): FreeBlock[] {
      const idx = seg[depth]
      return blocks.map((b, i) => {
        if (i !== idx) return b
        if (b.type === "card" || b.type === "stack") {
          if (depth === seg.length - 2)
            return {
              ...b,
              children: b.children.filter((_, j) => j !== seg[seg.length - 1]),
            } as FreeBlock
          return { ...b, children: removeFromTree(b.children, depth + 1) }
        }
        return b
      })
    }
    onChange({ ...spec, blocks: removeFromTree(spec.blocks, 0) })
    setSelectedPath(null)
  }
  function detachBlock(path: string) {
    if (!spec || !path.includes(".")) return
    const containerEl = containerRef.current?.querySelector(
      ".relative.aspect-\\[4\\/5\\], .relative.aspect-\\[9\\/16\\]",
    ) as HTMLElement | null
    const flowEl = containerRef.current?.querySelector(
      `[data-flow-path="${path}"]`,
    ) as HTMLElement | null
    if (!containerEl || !flowEl) return
    const cR = containerEl.getBoundingClientRect()
    const fR = flowEl.getBoundingClientRect()
    const seg = path.split(".").map(Number)
    const ref: { block: FreeBlock | null } = { block: null }
    function removeFromTree(blocks: FreeBlock[], depth: number): FreeBlock[] {
      const idx = seg[depth]
      return blocks.map((b, i) => {
        if (i !== idx) return b
        if (b.type === "card" || b.type === "stack") {
          if (depth === seg.length - 2) {
            const child = b.children[seg[seg.length - 1]]
            if (child) {
              ref.block = child
              return {
                ...b,
                children: b.children.filter((_, j) => j !== seg[seg.length - 1]),
              } as FreeBlock
            }
            return b
          }
          return { ...b, children: removeFromTree(b.children, depth + 1) }
        }
        return b
      })
    }
    const newBlocks = removeFromTree(spec.blocks, 0)
    if (!ref.block) return
    const detached: FreeBlock = {
      ...ref.block,
      position: {
        left: `${(((fR.left - cR.left) / cR.width) * 100).toFixed(1)}cqw`,
        top: `${(((fR.top - cR.top) / cR.width) * 100).toFixed(1)}cqw`,
        width: `${((fR.width / cR.width) * 100).toFixed(1)}cqw`,
      },
      z: (ref.block.z ?? 5) + 1,
    }
    onChange({ ...spec, blocks: [...newBlocks, detached] })
    setSelectedPath(String(newBlocks.length))
  }

  // ── auto-detach: explode stacks (sem bg) em blocos individuais ─────────────
  function detachAll(s: FreePostSpec) {
    const containerEl = containerRef.current?.querySelector(
      ".relative.aspect-\\[4\\/5\\], .relative.aspect-\\[9\\/16\\]",
    ) as HTMLElement | null
    if (!containerEl) return
    const cR = containerEl.getBoundingClientRect()
    const detached: FreeBlock[] = []
    function walk(blocks: FreeBlock[], prefix: string): FreeBlock[] {
      return blocks.flatMap((b, i) => {
        const path = prefix ? `${prefix}.${i}` : String(i)
        if (b.type === "stack" || b.type === "card") {
          // card e stack com bg ficam atômicos
          if (b.type === "card" || (b.type === "stack" && b.bg)) return [b]
          for (let j = 0; j < b.children.length; j++) {
            const childPath = `${path}.${j}`
            const flowEl = containerRef.current?.querySelector(
              `[data-flow-path="${childPath}"]`,
            ) as HTMLElement | null
            if (!flowEl) continue
            const r = flowEl.getBoundingClientRect()
            detached.push({
              ...b.children[j],
              position: {
                left: `${(((r.left - cR.left) / cR.width) * 100).toFixed(1)}cqw`,
                top: `${(((r.top - cR.top) / cR.width) * 100).toFixed(1)}cqw`,
                width: `${((r.width / cR.width) * 100).toFixed(1)}cqw`,
              },
              z: (b.children[j].z ?? 5) + 1,
            } as FreeBlock)
          }
          return [] as FreeBlock[]
        }
        return [b]
      })
    }
    const remaining = walk(s.blocks, "")
    if (detached.length === 0) return
    onChange({ ...s, blocks: [...remaining, ...detached] })
  }

  useEffect(() => {
    if (!spec) return
    if (lastDetachedRef.current === spec) return
    const hasGroups = spec.blocks.some((b) => b.type === "stack" && !b.bg)
    lastDetachedRef.current = spec
    if (!hasGroups) return
    const t = setTimeout(() => detachAll(spec), 120)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec])

  // ── canvas ─────────────────────────────────────────────────────────────────
  const canvas = spec ? (
    <div ref={containerRef} onClick={() => setSelectedPath(null)}>
      <FreePostRenderer
        spec={spec}
        format={opts.format === "story" ? "story" : "post"}
        editable
        onPositionChange={positionChange}
        selectedPath={selectedPath}
        onSelectBlock={setSelectedPath}
      />
    </div>
  ) : null

  // ── panel ────────────────────────────────────────────────────────────────
  const panel = spec ? (
    <SpecPanel
      spec={spec}
      selectedPath={selectedPath}
      onEditText={editText}
      onPatch={patchBlock}
      onDetach={detachBlock}
      onDelete={deleteBlock}
      onSelect={setSelectedPath}
    />
  ) : null

  return { canvas, panel, containerRef, selectedPath, setSelectedPath }
}

function SpecPanel({
  spec,
  selectedPath,
  onEditText,
  onPatch,
  onDetach,
  onDelete,
  onSelect,
}: {
  spec: FreePostSpec
  selectedPath: string | null
  onEditText: (path: string, text: string) => void
  onPatch: (path: string, patch: Record<string, unknown>) => void
  onDetach: (path: string) => void
  onDelete: (path: string) => void
  onSelect: (path: string | null) => void
}) {
  const items = collectEditableTexts(spec.blocks)
  let textIdx = 0
  let pillIdx = 0
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-text-muted">
        Clique e arraste qualquer bloco no preview pra mover. Edite texto, fonte,
        tamanho e cor aqui.
      </p>
      {items.map((entry) => {
        const label = entry.kind === "text" ? `Texto ${++textIdx}` : `Pill ${++pillIdx}`
        const block = getBlockAtPath(spec.blocks, entry.path)
        const scale =
          (block && (block.type === "text" || block.type === "pill")
            ? block.font_size_scale
            : undefined) ?? 1
        const align = block && block.type === "text" ? (block.text_align ?? "left") : null
        const fontVal =
          block && (block.type === "text" || block.type === "pill")
            ? (block.font ?? "")
            : null
        const textColor = block && block.type === "text" ? block.color : null
        const inGroup = entry.path.includes(".")
        const isSel = selectedPath === entry.path
        return (
          <div
            key={entry.path}
            onClick={() => onSelect(entry.path)}
            className={`space-y-1.5 p-2 rounded-md border bg-background-secondary/40 ${
              isSel ? "border-brand-500" : "border-border-subtle"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-text-muted">
                {label}
                {inGroup && <span className="ml-1">(em grupo)</span>}
              </span>
              <div className="flex items-center gap-1">
                {inGroup && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDetach(entry.path)
                    }}
                    className="text-[9px] text-brand-400 px-1.5 py-0.5 rounded border border-brand-700"
                  >
                    ✂ Soltar
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(entry.path)
                  }}
                  className="text-[10px] text-red-400 px-1.5 py-0.5 rounded border border-red-900"
                >
                  🗑
                </button>
              </div>
            </div>
            <textarea
              value={entry.text}
              onChange={(e) => onEditText(entry.path, e.target.value)}
              rows={Math.min(4, Math.ceil(entry.text.length / 40) + 1)}
              className="w-full text-xs rounded-md bg-background-secondary border border-border px-2 py-1.5 text-text-primary resize-none"
            />
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-text-muted w-10 shrink-0">tamanho</span>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={scale}
                onChange={(e) =>
                  onPatch(entry.path, { font_size_scale: parseFloat(e.target.value) })
                }
                className="flex-1 h-1 accent-brand-500"
              />
              <span className="text-[9px] text-text-muted w-8 text-right tabular-nums">
                {scale.toFixed(2)}x
              </span>
            </div>
            {fontVal !== null && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-text-muted w-10 shrink-0">fonte</span>
                <select
                  value={fontVal}
                  onChange={(e) => onPatch(entry.path, { font: e.target.value })}
                  className="flex-1 h-7 rounded-md bg-background-secondary border border-border px-2 text-[11px] text-text-primary"
                  style={{ colorScheme: "dark" }}
                >
                  {FONT_OPTIONS.map(([val, lbl]) => (
                    <option key={val} value={val}>
                      {lbl}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {align !== null && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-text-muted w-10 shrink-0">align</span>
                <div className="flex flex-1 gap-1">
                  {(["left", "center", "right"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => onPatch(entry.path, { text_align: a })}
                      className={`flex-1 h-6 text-[10px] rounded border ${
                        align === a
                          ? "border-brand-500 bg-brand-500/20 text-brand-200"
                          : "border-border text-text-muted"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {textColor !== null && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-text-muted w-10 shrink-0">cor</span>
                <input
                  type="color"
                  value={normalizeHex(textColor)}
                  onChange={(e) => onPatch(entry.path, { color: e.target.value })}
                  className="w-7 h-6 rounded border border-border bg-transparent cursor-pointer"
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
