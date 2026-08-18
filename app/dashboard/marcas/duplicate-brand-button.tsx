"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { duplicateBrand } from "@/app/actions/brands"

interface Props {
  brandId: string
  brandName: string
  /** `false` quando o plano já estourou o teto de marcas. */
  canCreate: boolean
  /** Mensagem pronta do limite (vem de lib/brands/limits). */
  limitMessage: string
}

/**
 * Botão "Duplicar" do card da marca.
 *
 * Quando o plano estourou o teto, NÃO chama o servidor: abre direto o aviso
 * com o caminho do upgrade. O usuário descobre o limite no pico de intenção
 * (clicou pra duplicar), não depois de um erro. O servidor revalida do mesmo
 * jeito — esta checagem é conveniência de UX.
 */
export function DuplicateBrandButton({
  brandId,
  brandName,
  canCreate,
  limitMessage,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dialog, setDialog] = useState<{
    title: string
    message: string
    upgrade: boolean
  } | null>(null)

  function handleClick() {
    if (!canCreate) {
      setDialog({
        title: "Limite de marcas do seu plano",
        message: limitMessage,
        upgrade: true,
      })
      return
    }

    startTransition(async () => {
      const result = await duplicateBrand(brandId)
      if (!result.ok) {
        setDialog({
          title: result.limitReached
            ? "Limite de marcas do seu plano"
            : "Nao foi possivel duplicar",
          message: result.error,
          upgrade: Boolean(result.limitReached),
        })
        return
      }
      router.refresh()
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleClick}
        disabled={pending}
        aria-label={`Duplicar a marca ${brandName}`}
        className="h-8 gap-1.5 bg-background/85 backdrop-blur border border-border text-xs"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
        Duplicar
      </Button>

      <AlertDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialog?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            {dialog?.upgrade && (
              <AlertDialogAction asChild>
                <Link href="/pricing">Ver planos</Link>
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
