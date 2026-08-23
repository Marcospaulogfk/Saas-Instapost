"use client"

// ============================================================================
// Painel estilo Elementor da sidebar do editor de carrossel.
//
//   [logo] [+ Elementos] [Editar] [Histórico]
//
//  - Elementos: grade de widgets (Título, Texto, Imagem, Tag, Forma, Divisor)
//    com busca. Clicar adiciona o bloco no slide atual, já selecionado.
//  - Histórico: lista de todas as edições da sessão (a pilha de undo que já
//    existia no editor, agora com rótulo). Clicar volta/avança pra aquele
//    estado.
//  - Editar: as sections normais (estilo, conteúdo, elemento, imagem, fundo).
// ============================================================================

import { useMemo, useState, type DragEvent } from "react"
import {
  ArrowLeft,
  Pencil,
  Palette,
  Settings2,
  Heading1,
  AlignLeft,
  Image as ImageIcon,
  Tag,
  Square,
  Minus,
  Plus,
  BadgeCheck,
  SlidersHorizontal,
  History,
  Search,
  type LucideIcon,
} from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { Input } from "@/components/ui/input"
import { BLOCK_LIMIT, BLOCK_TYPE_LABEL, type BlockType } from "./slide-blocks"

export type PanelMode = "editar" | "elementos" | "historico" | "bloco"
export type BlockTab = "conteudo" | "estilo" | "avancado"

/** MIME usado no drag do catálogo → slide (como o Elementor arrasta widget). */
export const BLOCK_DRAG_MIME = "application/x-nexus-block"

// ── Barra de ícones do topo ─────────────────────────────────────────────
export function PanelTopBar({
  mode,
  onMode,
  historyCount,
}: {
  mode: PanelMode
  onMode: (m: PanelMode) => void
  historyCount: number
}) {
  const items: Array<{ id: PanelMode; icon: LucideIcon; label: string; badge?: number }> = [
    { id: "elementos", icon: Plus, label: "Adicionar elemento" },
    { id: "editar", icon: SlidersHorizontal, label: "Editar" },
    { id: "historico", icon: History, label: "Histórico", badge: historyCount },
  ]
  return (
    <div className="flex items-center gap-1 px-1 pb-3">
      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 mr-1">
        <Logo size={20} variant="content" />
      </div>
      {items.map(({ id, icon: Icon, label, badge }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={mode === id}
          onClick={() => onMode(id)}
          className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            mode === id
              ? "bg-white/15 text-white"
              : "text-white/60 hover:text-white hover:bg-white/[0.07]"
          }`}
        >
          <Icon className="w-[18px] h-[18px]" />
          {badge != null && badge > 1 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-[9px] font-semibold text-white flex items-center justify-center">
              {badge - 1 > 99 ? "99+" : badge - 1}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Grade de elementos ──────────────────────────────────────────────────
const CATALOG: Array<{
  group: string
  items: Array<{ type: BlockType; icon: LucideIcon; hint: string }>
}> = [
  {
    group: "Básico",
    items: [
      { type: "heading", icon: Heading1, hint: "Título livre, fonte do carrossel" },
      { type: "text", icon: AlignLeft, hint: "Parágrafo curto de apoio" },
      { type: "image", icon: ImageIcon, hint: "Foto, logo ou print" },
      { type: "pill", icon: Tag, hint: "Etiqueta arredondada" },
      { type: "brand", icon: BadgeCheck, hint: "Avatar + nome + @handle da marca" },
    ],
  },
  {
    group: "Forma",
    items: [
      { type: "shape", icon: Square, hint: "Retângulo ou círculo" },
      { type: "divider", icon: Minus, hint: "Linha de separação" },
    ],
  },
]

export function ElementsPanel({
  count,
  onAdd,
}: {
  /** Quantos blocos o slide atual já tem (limite por slide). */
  count: number
  onAdd: (type: BlockType) => void
}) {
  const [q, setQ] = useState("")
  const full = count >= BLOCK_LIMIT
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return CATALOG
    return CATALOG.map((g) => ({
      ...g,
      items: g.items.filter(
        (it) =>
          BLOCK_TYPE_LABEL[it.type].toLowerCase().includes(needle) ||
          it.hint.toLowerCase().includes(needle),
      ),
    })).filter((g) => g.items.length)
  }, [q])

  return (
    <div className="space-y-4">
      <div className="text-center text-[15px] font-semibold text-white pt-1">Elementos</div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar elemento..."
          className="h-10 pl-9 bg-white/[0.04] border-white/10"
        />
      </div>
      {full && (
        <p className="text-[11px] text-amber-300/90">
          Limite de {BLOCK_LIMIT} blocos neste slide. Exclua um pra adicionar outro.
        </p>
      )}
      {groups.length === 0 && (
        <p className="text-xs text-text-muted">Nenhum elemento com esse nome.</p>
      )}
      {groups.map((g) => (
        <div key={g.group} className="space-y-2">
          <div className="text-[12px] font-semibold text-white/80">{g.group}</div>
          <div className="grid grid-cols-2 gap-2">
            {g.items.map(({ type, icon: Icon, hint }) => (
              <button
                key={type}
                type="button"
                title={`${hint} — clique ou arraste pro slide`}
                disabled={full}
                draggable={!full}
                onDragStart={(e: DragEvent<HTMLButtonElement>) => {
                  e.dataTransfer.setData(BLOCK_DRAG_MIME, type)
                  e.dataTransfer.effectAllowed = "copy"
                }}
                onClick={() => onAdd(type)}
                className="group cursor-grab active:cursor-grabbing rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex flex-col items-center justify-center gap-2 py-5"
              >
                <Icon className="w-7 h-7 text-white/70 group-hover:text-white" strokeWidth={1.5} />
                <span className="text-[12px] text-white/80">{BLOCK_TYPE_LABEL[type]}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[10px] text-text-muted">
        Arraste o elemento pra dentro do slide (ou clique pra colocar no centro).
        Ao soltar, as configurações dele abrem aqui.
      </p>
    </div>
  )
}

// ── Histórico ───────────────────────────────────────────────────────────
export interface HistoryEntry {
  label: string
  /** Índice na pilha (0 = estado inicial). */
  index: number
}

export function HistoryPanel({
  entries,
  current,
  onJump,
}: {
  entries: HistoryEntry[]
  current: number
  onJump: (index: number) => void
}) {
  // Mais recente no topo (como o Elementor).
  const list = [...entries].reverse()
  return (
    <div className="space-y-3">
      <div className="text-center text-[15px] font-semibold text-white pt-1">Histórico</div>
      <p className="text-[11px] text-text-muted px-1">
        Clique numa ação pra voltar o carrossel àquele momento. Ctrl+Z / Ctrl+Y também
        funcionam.
      </p>
      <ol className="rounded-xl border border-white/10 overflow-hidden divide-y divide-white/[0.06]">
        {list.map((e) => {
          const active = e.index === current
          const future = e.index > current
          return (
            <li key={e.index}>
              <button
                type="button"
                onClick={() => onJump(e.index)}
                className={`w-full text-left px-3.5 py-2.5 text-[12px] flex items-center gap-2.5 transition-colors ${
                  active
                    ? "bg-brand-600/20 text-white"
                    : future
                      ? "text-white/35 hover:bg-white/[0.04]"
                      : "text-white/75 hover:bg-white/[0.05]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    active ? "bg-brand-400" : future ? "bg-white/15" : "bg-white/40"
                  }`}
                />
                <span className="flex-1 truncate">{e.label}</span>
                {active && (
                  <span className="text-[9px] uppercase tracking-wide text-brand-300">
                    atual
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// ── Painel "Editar <tipo>" (abre ao soltar/selecionar um bloco) ─────────
export function BlockEditorShell({
  title,
  tab,
  onTab,
  onBack,
  children,
}: {
  title: string
  tab: BlockTab
  onTab: (t: BlockTab) => void
  onBack: () => void
  children: React.ReactNode
}) {
  const tabs: Array<{ id: BlockTab; icon: LucideIcon; label: string }> = [
    { id: "conteudo", icon: Pencil, label: "Conteúdo" },
    { id: "estilo", icon: Palette, label: "Estilo" },
    { id: "avancado", icon: Settings2, label: "Avançado" },
  ]
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          title="Voltar"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.07]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center text-[15px] font-semibold text-white pr-8">{title}</div>
      </div>
      <div className="grid grid-cols-3 rounded-xl border border-white/10 overflow-hidden">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
              tab === id
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
      <div className="pt-1">{children}</div>
    </div>
  )
}
