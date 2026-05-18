"use client"

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

export function ExitDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="border-0"
        style={{
          background: "var(--onb-bg-card)",
          borderColor: "var(--onb-border-default)",
          color: "var(--onb-text-primary)",
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle style={{ color: "var(--onb-text-primary)" }}>
            Tem certeza?
          </AlertDialogTitle>
          <AlertDialogDescription
            style={{ color: "var(--onb-text-secondary)" }}
          >
            Suas alterações serão salvas como rascunho e você pode retomar
            depois.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <button className="onb-btn-outline">Continuar editando</button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <button className="onb-btn-primary" onClick={onConfirm}>
              Sair
            </button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
