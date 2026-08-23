"use client"

// =====================================================================
// Partes interativas de /dashboard/afiliados: copiar link e salvar a
// carteira Asaas. A página em si é server component.
// =====================================================================

import { useState, useTransition } from "react"
import { Check, Copy, Link2, Loader2, Wallet } from "lucide-react"
import { salvarCarteiraAfiliado } from "@/app/actions/afiliados"

function useCopiar() {
  const [copiado, setCopiado] = useState(false)
  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = texto
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }
  return { copiado, copiar }
}

export function BotaoCopiar({ texto, rotulo = "Copiar" }: { texto: string; rotulo?: string }) {
  const { copiado, copiar } = useCopiar()
  return (
    <button
      type="button"
      onClick={() => void copiar(texto)}
      className="nv-btn-ghost inline-flex items-center gap-2 h-9 px-3 text-[12.5px]"
    >
      {copiado ? <Check className="w-4 h-4" style={{ color: "#62e29a" }} /> : <Copy className="w-4 h-4" />}
      {copiado ? "Copiado" : rotulo}
    </button>
  )
}

export function CartaoLinkAfiliado({ codigo, link }: { codigo: string; link: string }) {
  return (
    <div className="nv-card nv-fade p-5">
      <h2 className="text-[15px] font-semibold mb-3.5" style={{ color: "var(--nv-text)" }}>
        Seu link de afiliado
      </h2>
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--nv-border)" }}
        >
          <p className="text-[10.5px] uppercase tracking-wider mb-1" style={{ color: "var(--nv-text-subtle)" }}>
            Código
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[19px] font-bold tracking-[0.16em] tabular-nums" style={{ color: "var(--nv-text)" }}>
              {codigo}
            </span>
            <BotaoCopiar texto={codigo} />
          </div>
        </div>
        <div
          className="rounded-xl px-4 py-3 min-w-0"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--nv-border)" }}
        >
          <p className="text-[10.5px] uppercase tracking-wider mb-1" style={{ color: "var(--nv-text-subtle)" }}>
            Link
          </p>
          <div className="flex items-center gap-3 min-w-0">
            <Link2 className="w-4 h-4 shrink-0" style={{ color: "var(--nv-text-subtle)" }} />
            <span className="text-[13px] truncate flex-1 min-w-0" style={{ color: "var(--nv-text-muted)" }}>
              {link}
            </span>
            <BotaoCopiar texto={link} rotulo="Copiar link" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function FormCarteira({ walletAtual }: { walletAtual: string | null }) {
  const [wallet, setWallet] = useState(walletAtual ?? "")
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [pendente, startTransition] = useTransition()

  function salvar() {
    if (pendente) return
    startTransition(async () => {
      const r = await salvarCarteiraAfiliado(wallet)
      setMsg({ ok: r.ok, texto: r.mensagem })
    })
  }

  return (
    <div className="nv-card nv-fade p-5">
      <div className="flex items-center gap-2 mb-1">
        <Wallet className="w-4 h-4" style={{ color: "var(--nv-text-subtle)" }} />
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--nv-text)" }}>
          Carteira Asaas (walletId)
        </h2>
      </div>
      <p className="text-[12.5px] mb-3.5" style={{ color: "var(--nv-text-muted)" }}>
        Com o walletId da sua conta Asaas, a comissão sai por split automático
        em cada cobrança. Sem ele, o valor acumula como &quot;a pagar&quot; e a
        gente acerta por Pix. Encontre o walletId em Asaas, Minha conta,
        Integrações.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") salvar()
          }}
          placeholder="00000000-0000-0000-0000-000000000000"
          aria-label="walletId do Asaas"
          className="nv-search h-10 px-3 text-[13px] w-full sm:w-[360px]"
        />
        <button
          type="button"
          onClick={salvar}
          disabled={pendente}
          className="nv-btn-primary inline-flex items-center justify-center gap-2 h-10 px-4 text-[13px] disabled:opacity-50"
        >
          {pendente && <Loader2 className="w-4 h-4 animate-spin" />}
          Salvar
        </button>
      </div>
      {msg && (
        <p className="text-[12.5px] mt-3" style={{ color: msg.ok ? "#62e29a" : "#f6c35a" }}>
          {msg.texto}
        </p>
      )}
    </div>
  )
}
