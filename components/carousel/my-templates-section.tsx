"use client"

// ============================================================================
// "Meus modelos" (Lote 6): slide avulso ou carrossel inteiro que o usuário
// salvou a partir do editor (carousel-editor.tsx → "Salvar como modelo").
// Lista, renomeia e apaga — tudo client-side chamando as server actions de
// app/actions/carousel-templates.ts direto (sem rota própria).
// ============================================================================

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, LayoutTemplate, Loader2, Pencil, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  listCarouselTemplates,
  renameCarouselTemplate,
  deleteCarouselTemplate,
  type CarouselTemplateItem,
} from "@/app/actions/carousel-templates"

const KIND_LABEL: Record<CarouselTemplateItem["kind"], string> = {
  slide: "Slide",
  carousel: "Carrossel",
}

function TemplateCard({
  item,
  onRenamed,
  onDeleted,
}: {
  item: CarouselTemplateItem
  onRenamed: (id: string, name: string) => void
  onDeleted: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [busy, setBusy] = useState(false)

  async function saveRename() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === item.name) {
      setName(item.name)
      setEditing(false)
      return
    }
    setBusy(true)
    const res = await renameCarouselTemplate(item.id, trimmed)
    setBusy(false)
    if (res.ok) {
      onRenamed(item.id, trimmed)
      setEditing(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    const res = await deleteCarouselTemplate(item.id)
    setBusy(false)
    if (res.ok) onDeleted(item.id)
  }

  return (
    <div className="rounded-xl border border-hairline bg-surface-2 overflow-hidden flex flex-col">
      <div className="aspect-[4/5] bg-background flex items-center justify-center">
        {item.preview_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.preview_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <LayoutTemplate className="w-8 h-8 text-text-muted" />
        )}
      </div>
      <div className="p-3 space-y-2">
        <span className="inline-block text-[10px] font-medium uppercase tracking-wide text-text-muted">
          {KIND_LABEL[item.kind]}
        </span>
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveRename()
                if (e.key === "Escape") {
                  setName(item.name)
                  setEditing(false)
                }
              }}
              className="h-7 text-xs"
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => void saveRename()}
              disabled={busy}
              className="p-1 text-text-muted hover:text-text-primary"
              aria-label="Salvar nome"
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setName(item.name)
                setEditing(false)
              }}
              disabled={busy}
              className="p-1 text-text-muted hover:text-text-primary"
              aria-label="Cancelar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <h3 className="font-medium text-text-primary text-sm truncate" title={item.name}>
              {item.name}
            </h3>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="p-1 text-text-muted hover:text-text-primary"
                aria-label="Renomear"
                title="Renomear"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="p-1 text-text-muted hover:text-destructive"
                    aria-label="Apagar"
                    title="Apagar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-background-tertiary border-border-medium">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apagar &quot;{item.name}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação é permanente. O modelo não pode ser recuperado depois.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault()
                        void handleDelete()
                      }}
                      disabled={busy}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {busy ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Apagar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
        {item.kind === "carousel" && (
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link href={`/dashboard/carrossel?templateId=${item.id}`}>Usar como base</Link>
          </Button>
        )}
        {item.kind === "slide" && (
          <p className="text-[11px] text-text-muted">
            Disponível em &quot;+ adicionar slide&quot; no editor.
          </p>
        )}
      </div>
    </div>
  )
}

export function MyTemplatesSection() {
  const [items, setItems] = useState<CarouselTemplateItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listCarouselTemplates().then((res) => {
      if (cancelled) return
      if (!res.ok) {
        setError(res.error)
        return
      }
      setItems(res.items)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Tabela ainda não aplicada / erro: não derruba a página, só não mostra a seção.
  if (error) {
    return (
      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-text-primary">Meus modelos</h2>
        <p className="text-sm text-text-muted">{error}</p>
      </section>
    )
  }

  if (items === null) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-text-primary">Meus modelos</h2>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando…
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Meus modelos</h2>
        <p className="text-sm text-text-muted">
          Slides e carrosséis que você salvou como modelo próprio no editor.
        </p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline p-8 text-center">
          <p className="text-text-muted text-sm">
            Nenhum modelo salvo ainda. No editor, use &quot;Salvar como modelo&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <TemplateCard
              key={item.id}
              item={item}
              onRenamed={(id, name) =>
                setItems((prev) => prev?.map((it) => (it.id === id ? { ...it, name } : it)) ?? prev)
              }
              onDeleted={(id) => setItems((prev) => prev?.filter((it) => it.id !== id) ?? prev)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
