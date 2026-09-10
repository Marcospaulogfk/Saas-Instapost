"use client"

import Link from "next/link"
import { Gift } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TEXTO_REGRA_TESTE, UNIDADES_TESTE, type EstadoTeste } from "@/lib/teste-gratis-regra"

/**
 * Chip do topo pra conta na regra nova do teste grátis (R4-3, 10/09/2026).
 *
 * O chip de uso normal mostrava "0/45 0%" e "0 de 45 créditos usados neste
 * mês" pra essa conta: o grátis antigo, que ela não tem. Aqui a mesma pílula
 * fala a regra que vale pra ela e quanto já foi usado.
 */
function resumo(e: EstadoTeste): string {
  if (e.esgotado) return "Seu teste grátis já foi usado."
  if (e.carrosseis === 0 && e.posts === 0) return "Nada usado ainda."
  return `Você já criou ${e.posts} post${e.posts === 1 ? "" : "s"} único${e.posts === 1 ? "" : "s"}; ainda cabe${e.restante === 1 ? "" : "m"} ${e.restante}.`
}

export function TesteGratisChip({ estado }: { estado: EstadoTeste }) {
  const usado = UNIDADES_TESTE - estado.restante
  const cor = estado.esgotado ? "#f87171" : "var(--nv-brand)"
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={TEXTO_REGRA_TESTE}
          className="nv-pill flex items-center gap-2 px-3 py-1.5"
        >
          <Gift className="h-3.5 w-3.5" style={{ color: cor }} />
          {/* Sem fração (rodada 6): "3/3" depois de 1 carrossel era lido como
              "3 de 3 posts". A pílula diz o estado; o detalhe fica no balão. */}
          <span className="text-[11px] font-medium" style={{ color: "var(--nv-text)" }}>
            {estado.esgotado ? "Teste grátis usado" : "Teste grátis"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Teste grátis</p>
        <p className="mt-1.5 text-sm text-text-primary">1 carrossel de até 5 slides ou 3 posts únicos.</p>
        <p className="mt-1 text-xs text-text-secondary">{resumo(estado)}</p>
        <Link
          href="/pricing"
          className="mt-3 inline-flex h-8 items-center rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700"
        >
          Ver planos
        </Link>
      </PopoverContent>
    </Popover>
  )
}
