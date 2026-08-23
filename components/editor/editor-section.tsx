"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"

/**
 * Seção colapsável (accordion) das sidebars de editor.
 *
 * Nasceu dentro do editor de carrossel; virou componente compartilhado quando o
 * editor de post único passou a usar o MESMO shell (sidebar preta com logo +
 * seções). Antes as duas telas tinham cara diferente pro mesmo tipo de trabalho.
 *
 * Aceita modo CONTROLADO (open/onToggle) — usado pela seleção no canvas pra
 * abrir a seção certa automaticamente — com fallback pro estado interno.
 */
export function EditorSection({
  icon: Icon,
  title,
  defaultOpen = false,
  open: openProp,
  onToggle,
  id,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  defaultOpen?: boolean
  open?: boolean
  onToggle?: () => void
  id?: string
  children: React.ReactNode
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const open = openProp ?? internalOpen
  const setOpen = (fn: (v: boolean) => boolean) =>
    onToggle ? onToggle() : setInternalOpen(fn)
  return (
    <div
      id={id}
      className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-white/[0.04] transition-colors"
      >
        <Icon className="w-4 h-4 text-brand-400 flex-shrink-0" />
        <span className="text-[13px] font-medium text-text-primary flex-1 truncate">
          {title}
        </span>
        <ChevronRight
          className={`w-4 h-4 text-text-muted transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-border-subtle">
          {children}
        </div>
      )}
    </div>
  )
}
