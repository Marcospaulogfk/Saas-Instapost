"use client"

// =====================================================================
// Lista de candidaturas com aprovar/rejeitar (admin).
// =====================================================================

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { aprovarAfiliado, rejeitarAfiliado } from "@/app/actions/afiliados"
import type { AfiliadoRow } from "@/lib/afiliados/queries"
import { formatRelativeDate } from "@/lib/format-date"

const BADGE: Record<string, { rotulo: string; cls: string }> = {
  pending: { rotulo: "Pendente", cls: "nv-badge-progress" },
  approved: { rotulo: "Aprovado", cls: "nv-badge-done" },
  rejected: { rotulo: "Rejeitado", cls: "nv-badge-draft" },
  suspended: { rotulo: "Suspenso", cls: "nv-badge-draft" },
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  if (!valor) return null
  return (
    <p className="text-[12.5px]" style={{ color: "var(--nv-text-muted)" }}>
      <span className="uppercase tracking-wider text-[10.5px] mr-2" style={{ color: "var(--nv-text-subtle)" }}>
        {rotulo}
      </span>
      {valor}
    </p>
  )
}

function Candidatura({ a }: { a: AfiliadoRow }) {
  const [pct, setPct] = useState(String(a.commissionPct))
  const [wallet, setWallet] = useState(a.asaasWalletId ?? "")
  const [notes, setNotes] = useState(a.notes ?? "")
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [pendente, startTransition] = useTransition()
  const badge = BADGE[a.status] ?? BADGE.pending

  function aprovar() {
    startTransition(async () => {
      const r = await aprovarAfiliado(a.id, {
        commissionPct: Number(pct),
        walletId: wallet,
        notes,
      })
      setMsg({ ok: r.ok, texto: r.mensagem })
    })
  }
  function rejeitar() {
    startTransition(async () => {
      const r = await rejeitarAfiliado(a.id, notes)
      setMsg({ ok: r.ok, texto: r.mensagem })
    })
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--nv-border)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[14px] font-semibold" style={{ color: "var(--nv-text)" }}>
            {a.name}{" "}
            <span className="font-mono text-[11px] tracking-[0.12em]" style={{ color: "var(--nv-text-subtle)" }}>
              {a.code}
            </span>
          </p>
          <p className="text-[12.5px]" style={{ color: "var(--nv-text-muted)" }}>
            {a.email}
            {a.whatsapp ? ` · ${a.whatsapp}` : ""}
            {a.instagram ? ` · ${a.instagram}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`nv-badge ${badge.cls}`}>{badge.rotulo}</span>
          <span className="text-[11.5px]" style={{ color: "var(--nv-text-subtle)" }}>
            {formatRelativeDate(a.createdAt)}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <Linha rotulo="Motivo" valor={a.reason} />
        <Linha rotulo="Ads" valor={a.adsPlan} />
        <Linha rotulo="Canais" valor={a.channels} />
        <Linha rotulo="Conta" valor={a.userId ? "vinculada" : "sem conta no app (vincula pelo e-mail no login)"} />
      </div>

      <div className="grid gap-2 sm:grid-cols-[110px_1fr_1fr]">
        <label className="block">
          <span className="block text-[10.5px] uppercase tracking-wider mb-1" style={{ color: "var(--nv-text-subtle)" }}>
            Comissão %
          </span>
          <input
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            inputMode="decimal"
            className="nv-search h-9 px-3 text-[13px] w-full"
          />
        </label>
        <label className="block">
          <span className="block text-[10.5px] uppercase tracking-wider mb-1" style={{ color: "var(--nv-text-subtle)" }}>
            walletId Asaas
          </span>
          <input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="opcional"
            className="nv-search h-9 px-3 text-[13px] w-full"
          />
        </label>
        <label className="block">
          <span className="block text-[10.5px] uppercase tracking-wider mb-1" style={{ color: "var(--nv-text-subtle)" }}>
            Notas internas
          </span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="opcional"
            className="nv-search h-9 px-3 text-[13px] w-full"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={aprovar}
          disabled={pendente}
          className="nv-btn-primary inline-flex items-center gap-2 h-9 px-4 text-[12.5px] disabled:opacity-50"
        >
          {pendente && <Loader2 className="w-4 h-4 animate-spin" />}
          {a.status === "approved" ? "Salvar alterações" : "Aprovar"}
        </button>
        {a.status !== "rejected" && (
          <button
            type="button"
            onClick={rejeitar}
            disabled={pendente}
            className="nv-btn-ghost inline-flex items-center gap-2 h-9 px-4 text-[12.5px] disabled:opacity-50"
          >
            Rejeitar
          </button>
        )}
        {msg && (
          <p className="text-[12.5px]" style={{ color: msg.ok ? "#62e29a" : "#f6c35a" }}>
            {msg.texto}
          </p>
        )}
      </div>
    </div>
  )
}

export function ListaCandidaturas({
  titulo,
  itens,
  vazio,
}: {
  titulo: string
  itens: AfiliadoRow[]
  vazio: string
}) {
  return (
    <div className="nv-card nv-fade p-5">
      <h2 className="text-[15px] font-semibold mb-3.5" style={{ color: "var(--nv-text)" }}>
        {titulo} ({itens.length})
      </h2>
      {itens.length === 0 ? (
        <p className="text-[12.5px] py-2" style={{ color: "var(--nv-text-subtle)" }}>
          {vazio}
        </p>
      ) : (
        <div className="space-y-3">
          {itens.map((a) => (
            <Candidatura key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  )
}
