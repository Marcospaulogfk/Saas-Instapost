"use client"

// =====================================================================
// Formulário de candidatura ao programa de afiliados (página pública).
// Funciona deslogado. Toda validação de verdade vive na action + SQL.
// =====================================================================

import { useState, useTransition } from "react"
import { Loader2, Send } from "lucide-react"
import { candidatarAfiliado } from "@/app/actions/afiliados"

const INPUT =
  "w-full rounded-xl px-4 py-3 text-[14px] bg-surface border border-hairline text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"

function Campo({
  label,
  nome,
  obrigatorio,
  children,
}: {
  label: string
  nome: string
  obrigatorio?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block" htmlFor={nome}>
      <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted mb-1.5">
        {label}
        {obrigatorio && <span className="text-primary"> *</span>}
      </span>
      {children}
    </label>
  )
}

export function FormCandidatura({
  prefill,
  variante = "landing",
}: {
  prefill?: { name?: string; email?: string }
  /** "landing" usa tokens da página pública; "dashboard" usa o visual NovaAI. */
  variante?: "landing" | "dashboard"
}) {
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [pendente, startTransition] = useTransition()

  const input = variante === "dashboard" ? "nv-search w-full px-3 py-2.5 text-[13px]" : INPUT
  const botao =
    variante === "dashboard"
      ? "nv-btn-primary inline-flex items-center justify-center gap-2 h-11 px-6 text-[13.5px] disabled:opacity-50"
      : "inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary text-primary-foreground text-[14px] font-medium hover:opacity-90 transition disabled:opacity-50"

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pendente) return
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      const r = await candidatarAfiliado(fd)
      setMsg({ ok: r.ok, texto: r.mensagem })
      if (r.ok) form.reset()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nome" nome="name" obrigatorio>
          <input id="name" name="name" required defaultValue={prefill?.name ?? ""} className={input} placeholder="Seu nome" autoComplete="name" />
        </Campo>
        <Campo label="E-mail" nome="email" obrigatorio>
          <input id="email" name="email" type="email" required defaultValue={prefill?.email ?? ""} className={input} placeholder="voce@exemplo.com" autoComplete="email" />
        </Campo>
        <Campo label="WhatsApp" nome="whatsapp">
          <input id="whatsapp" name="whatsapp" className={input} placeholder="(11) 99999-9999" autoComplete="tel" />
        </Campo>
        <Campo label="Instagram" nome="instagram">
          <input id="instagram" name="instagram" className={input} placeholder="@seuperfil" />
        </Campo>
      </div>

      <Campo label="Por que quer ser afiliado" nome="reason" obrigatorio>
        <textarea id="reason" name="reason" required rows={3} className={input} placeholder="Quem é o seu público e por que o Nexus Content faz sentido pra ele" />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Pretende investir em anúncios?" nome="ads_plan">
          <input id="ads_plan" name="ads_plan" className={input} placeholder="Ex.: sim, uns R$300/mês em Meta Ads" />
        </Campo>
        <Campo label="Onde pretende divulgar" nome="channels">
          <input id="channels" name="channels" className={input} placeholder="Ex.: Instagram, YouTube, comunidade no WhatsApp" />
        </Campo>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button type="submit" disabled={pendente} className={botao}>
          {pendente ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar candidatura
        </button>
        {msg && (
          <p className="text-[13px]" style={{ color: msg.ok ? "#62e29a" : "#f6c35a" }} role="status">
            {msg.texto}
          </p>
        )}
      </div>
    </form>
  )
}
