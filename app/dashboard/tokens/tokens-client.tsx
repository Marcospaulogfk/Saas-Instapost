"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { cancelarAssinatura } from "@/app/actions/billing"

/** Botão "Cancelar assinatura" com confirmação em duas etapas. */
export function BotaoCancelar({ renovaEm }: { renovaEm: string | null }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, start] = useTransition()

  function cancelar() {
    setErro(null)
    start(async () => {
      const r = await cancelarAssinatura()
      if (!r.ok) {
        setErro(
          r.erro === "sem_assinatura"
            ? "Não encontramos uma assinatura ativa nesta conta."
            : "Não deu pra cancelar agora. Tente de novo em instantes.",
        )
        return
      }
      setConfirmando(false)
      router.refresh()
    })
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="nv-btn-ghost h-9 rounded-lg px-3 text-[12.5px]"
      >
        Cancelar assinatura
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 text-[12.5px]">
      <p style={{ color: "var(--nv-text-muted)" }}>
        Seu acesso e seus tokens do plano continuam até{" "}
        {renovaEm ? new Date(renovaEm).toLocaleDateString("pt-BR") : "o fim do ciclo"}. Bônus de
        indicação e tokens avulsos não vencem. Confirmar?
      </p>
      {erro && <p style={{ color: "#f87171" }}>{erro}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={cancelar}
          disabled={pendente}
          className="h-9 rounded-lg px-3 font-semibold"
          style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}
        >
          {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sim, cancelar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={pendente}
          className="nv-btn-ghost h-9 rounded-lg px-3"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}

/** Filtro de mês do extrato (navega com ?mes=AAAA-MM). */
export function FiltroMes({ atual, opcoes }: { atual: string | null; opcoes: string[] }) {
  const router = useRouter()
  return (
    <select
      value={atual ?? ""}
      onChange={(e) => {
        const v = e.target.value
        router.push(v ? `/dashboard/tokens?mes=${v}` : "/dashboard/tokens")
      }}
      className="h-8 rounded-lg border px-2 text-[12px]"
      style={{
        background: "var(--nv-card-2)",
        borderColor: "var(--nv-border)",
        color: "var(--nv-text)",
      }}
    >
      <option value="">Últimas 100</option>
      {opcoes.map((m) => {
        const [y, mm] = m.split("-")
        const nome = new Date(Number(y), Number(mm) - 1, 1).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        })
        return (
          <option key={m} value={m}>
            {nome}
          </option>
        )
      })}
    </select>
  )
}

export function LinkPlanos({ children, href = "/pricing" }: { children: React.ReactNode; href?: string }) {
  return (
    <Link href={href} className="nv-btn-primary inline-flex h-9 items-center rounded-lg px-3 text-[12.5px] font-semibold">
      {children}
    </Link>
  )
}
