"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { tokenCostForSinglePost } from "@/lib/tokens"
import type { PostBrand } from "@/lib/single-posts/types"

interface WizardProps {
  brands: PostBrand[]
  /** Saldo de tokens do usuário — alimenta o preview de custo. */
  balance: number
}

/**
 * Criação de post único — mesmo modelo do wizard de carrossel: coluna única,
 * o usuário descreve o assunto e a IA decide a composição.
 *
 * A grade de templates curados saiu daqui de propósito: o post nasce editável,
 * então escolher o layout ANTES de ver o conteúdo é decisão prematura — dá pra
 * mover bloco, trocar fonte e reescrever tudo no editor depois, de graça.
 */
export function Wizard({ brands, balance }: WizardProps) {
  const router = useRouter()
  // Teto do post único (29). O débito real pode ser menor — foto real de
  // acervo não custa imagem, e o fallback pro Flux cobra 2 em vez de 25.
  const cost = tokenCostForSinglePost()
  const insufficient = balance < cost

  const [brandId, setBrandId] = useState(brands[0]?.id ?? "")
  const activeBrand = useMemo(
    () => brands.find((b) => b.id === brandId) ?? brands[0],
    [brands, brandId],
  )
  const [briefing, setBriefing] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    !!activeBrand && briefing.trim().length >= 10 && !submitting && !insufficient

  function handleGenerate() {
    if (!canSubmit || !activeBrand) return
    setError(null)
    setSubmitting(true)
    try {
      sessionStorage.setItem(
        "syncpost_pending_post_unico",
        JSON.stringify({
          kind: "skeleton" as const,
          brand: activeBrand,
          briefing: briefing.trim(),
          autoRun: true,
          ts: Date.now(),
        }),
      )
      router.push("/dashboard/editor/post-unico")
    } catch {
      setError("Não consegui abrir o editor. Tente novamente.")
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {brands.length > 1 && (
        <div className="space-y-2">
          <Label className="text-sm text-text-secondary">Marca</Label>
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="bg-background-secondary/60 border-border-subtle h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background-tertiary border-border-medium">
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {brands.length === 1 && activeBrand && (
        <div className="rounded-lg border border-border-subtle bg-gradient-card backdrop-blur-xl px-4 py-3 text-sm">
          <span className="text-text-muted">Marca: </span>
          <span className="font-medium text-text-primary">{activeBrand.name}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm text-text-secondary">Sobre o que é o post?</Label>
        <Textarea
          value={briefing}
          onChange={(e) => setBriefing(e.target.value)}
          rows={4}
          placeholder="Ex: Vagas abertas pra instrutor de muay thai, com 3 anos de experiência… (mín 10 caracteres)"
          className="bg-background-secondary/60 border-border-subtle focus:border-brand-600/50 resize-none"
        />
        <p className="text-xs text-text-muted">
          A IA escreve a copy, escolhe a composição e monta a arte com a identidade
          da marca. Você ajusta tudo no editor depois.
        </p>
      </div>

      {/* Preview de custo no ponto da decisão, antes de gerar. */}
      <div
        className={`rounded-lg border p-3 text-[11px] ${
          insufficient
            ? "border-danger/40 bg-danger/10"
            : "border-border-subtle bg-background-secondary/40"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-text-secondary">
            Custo: <strong className="text-text-primary">até {cost} tokens</strong>
          </span>
          <span className={insufficient ? "text-danger" : "text-text-muted"}>
            Saldo: {balance}
          </span>
        </div>
        {insufficient ? (
          <p className="mt-2 text-danger">
            Saldo insuficiente.{" "}
            <Link href="/pricing" className="underline underline-offset-2">
              Fazer upgrade
            </Link>
          </p>
        ) : (
          <p className="mt-1.5 text-text-muted">
            Texto {"+"} imagem. Custa menos se a foto vier de acervo real. Editar o
            post depois é grátis e ilimitado.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger whitespace-pre-wrap">
          {error}
        </div>
      )}

      <Button
        type="button"
        onClick={handleGenerate}
        disabled={!canSubmit}
        className="w-full h-12"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Abrindo o editor...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar post
          </>
        )}
      </Button>

      {submitting && (
        <p className="text-xs text-text-muted text-center">
          ~15-40s. A copy vem primeiro, depois a imagem.
        </p>
      )}
    </div>
  )
}
