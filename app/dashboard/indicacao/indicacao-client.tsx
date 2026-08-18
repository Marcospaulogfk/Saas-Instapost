"use client"

// =====================================================================
// Partes interativas de /dashboard/indicacao.
// A página em si é server component; só o que precisa de clipboard e de
// estado local mora aqui.
// =====================================================================

import { useState, useTransition } from "react"
import { Check, Copy, Link2, Loader2, Send } from "lucide-react"
import { aplicarCodigoConvite } from "@/app/actions/indicacao"
import {
  REFERRAL_TOKENS,
  codigoTemFormatoValido,
  normalizarCodigo,
} from "@/lib/indicacao/config"

/* ---------------- Copiar ---------------- */

function useCopiar() {
  const [copiado, setCopiado] = useState(false)
  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      // Fallback pra contexto sem permissão de clipboard (http, iframe).
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

export function BotaoCopiar({
  texto,
  rotulo = "Copiar",
  className = "",
}: {
  texto: string
  rotulo?: string
  className?: string
}) {
  const { copiado, copiar } = useCopiar()
  return (
    <button
      type="button"
      onClick={() => void copiar(texto)}
      className={`nv-btn-ghost inline-flex items-center gap-2 h-9 px-3 text-[12.5px] ${className}`}
    >
      {copiado ? (
        <Check className="w-4 h-4" style={{ color: "#62e29a" }} />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      {copiado ? "Copiado" : rotulo}
    </button>
  )
}

/* ---------------- Código + link ---------------- */

export function CartaoLink({ codigo, link }: { codigo: string; link: string }) {
  return (
    <div className="nv-card nv-fade p-5">
      <h2
        className="text-[15px] font-semibold mb-3.5"
        style={{ color: "var(--nv-text)" }}
      >
        Seu convite
      </h2>

      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--nv-border)",
          }}
        >
          <p
            className="text-[10.5px] uppercase tracking-wider mb-1"
            style={{ color: "var(--nv-text-subtle)" }}
          >
            Código
          </p>
          <div className="flex items-center gap-3">
            <span
              className="text-[19px] font-bold tracking-[0.16em] tabular-nums"
              style={{ color: "var(--nv-text)" }}
            >
              {codigo}
            </span>
            <BotaoCopiar texto={codigo} rotulo="Copiar" />
          </div>
        </div>

        <div
          className="rounded-xl px-4 py-3 min-w-0"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--nv-border)",
          }}
        >
          <p
            className="text-[10.5px] uppercase tracking-wider mb-1"
            style={{ color: "var(--nv-text-subtle)" }}
          >
            Link de indicação
          </p>
          <div className="flex items-center gap-3 min-w-0">
            <Link2
              className="w-4 h-4 shrink-0"
              style={{ color: "var(--nv-text-subtle)" }}
            />
            <span
              className="text-[13px] truncate flex-1 min-w-0"
              style={{ color: "var(--nv-text-muted)" }}
            >
              {link}
            </span>
            <BotaoCopiar texto={link} rotulo="Copiar link" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Playbook de divulgação ---------------- */

type Peca = { canal: string; contexto: string; texto: string }

function pecas(link: string): Peca[] {
  const t = REFERRAL_TOKENS
  return [
    {
      canal: "WhatsApp",
      contexto: "Mensagem direta pra quem já reclamou de criar post",
      texto:
        `Lembra que você falou que perde a manhã inteira montando post pro Instagram? ` +
        `Eu uso o Nexus Content: escrevo o briefing e sai a arte + a legenda pronta pra postar.\n\n` +
        `Se entrar pelo meu link você começa com ${t.indicado} tokens extras (dá um carrossel completo a mais no primeiro mês):\n${link}`,
    },
    {
      canal: "Stories",
      contexto: "Print do editor + caixinha de link",
      texto:
        `Isso aqui saiu de UM briefing de 3 linhas.\n\n` +
        `Ferramenta: Nexus Content. Quem entrar pelo meu link ganha ${t.indicado} tokens extras.\n${link}`,
    },
    {
      canal: "LinkedIn",
      contexto: "Post curto, tom de bastidor",
      texto:
        `Cortei o tempo de produção de conteúdo do meu Instagram de umas 3 horas por semana pra menos de 20 minutos.\n\n` +
        `Não foi disciplina, foi ferramenta: escrevo o briefing, a IA compõe a arte e a legenda, e eu só ajusto o que não ficou com a minha cara.\n\n` +
        `Deixo o link de quem quiser testar — quem entra por ele começa com ${t.indicado} tokens extras: ${link}`,
    },
    {
      canal: "E-mail",
      contexto: "Pra base de clientes ou lista de newsletter",
      texto:
        `Assunto: a ferramenta que resolveu meu Instagram\n\n` +
        `Oi! Passando pra indicar o que destravou a minha rotina de conteúdo: o Nexus Content gera o post (arte + legenda) a partir de um briefing curto, no visual da sua marca.\n\n` +
        `Se você entrar por este link, ganha ${t.indicado} tokens extras assim que assinar:\n${link}\n\n` +
        `Qualquer dúvida é só responder este e-mail.`,
    },
  ]
}

export function Playbook({ link }: { link: string }) {
  const lista = pecas(link)
  return (
    <div className="nv-card nv-fade p-5">
      <div className="flex items-center justify-between mb-1">
        <h2
          className="text-[15px] font-semibold"
          style={{ color: "var(--nv-text)" }}
        >
          Como divulgar
        </h2>
        <Send className="w-4 h-4" style={{ color: "var(--nv-text-subtle)" }} />
      </div>
      <p className="text-[12.5px] mb-4" style={{ color: "var(--nv-text-muted)" }}>
        Textos prontos com o seu link já embutido. Copie, ajuste o que quiser e
        publique.
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        {lista.map((p) => (
          <div
            key={p.canal}
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--nv-border)",
            }}
          >
            <div>
              <p
                className="text-[13px] font-semibold"
                style={{ color: "var(--nv-text)" }}
              >
                {p.canal}
              </p>
              <p
                className="text-[11px]"
                style={{ color: "var(--nv-text-subtle)" }}
              >
                {p.contexto}
              </p>
            </div>
            <p
              className="text-[12.5px] whitespace-pre-line flex-1"
              style={{ color: "var(--nv-text-muted)" }}
            >
              {p.texto}
            </p>
            <BotaoCopiar
              texto={p.texto}
              rotulo="Copiar texto"
              className="self-start"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Aplicar um convite recebido ---------------- */

/**
 * Só aparece pra quem AINDA não está vinculado a ninguém. Cobre dois casos
 * reais: quem cadastrou antes de o link existir e quem se cadastrou sem o
 * `?ref=` (digitou o e-mail direto na landing). Todas as guardas de fraude
 * estão no SQL — aqui é só o campo.
 */
export function FormConvite() {
  const [codigo, setCodigo] = useState("")
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [pendente, startTransition] = useTransition()

  const valido = codigoTemFormatoValido(codigo)

  function enviar() {
    if (!valido || pendente) return
    startTransition(async () => {
      const r = await aplicarCodigoConvite(codigo)
      setMsg({ ok: r.ok, texto: r.mensagem })
      if (r.ok) setCodigo("")
    })
  }

  return (
    <div className="nv-card nv-fade p-5">
      <h2
        className="text-[15px] font-semibold mb-1"
        style={{ color: "var(--nv-text)" }}
      >
        Recebi um convite
      </h2>
      <p className="text-[12.5px] mb-3.5" style={{ color: "var(--nv-text-muted)" }}>
        Tem o código de quem te indicou? Aplique antes da primeira assinatura e
        ganhe {REFERRAL_TOKENS.indicado} tokens extras junto com ela.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={codigo}
          onChange={(e) => setCodigo(normalizarCodigo(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") enviar()
          }}
          maxLength={8}
          placeholder="ABCD2345"
          aria-label="Código de convite"
          className="nv-search h-10 px-3 text-[13px] tracking-[0.14em] w-[170px]"
        />
        <button
          type="button"
          onClick={enviar}
          disabled={!valido || pendente}
          className="nv-btn-primary inline-flex items-center justify-center gap-2 h-10 px-4 text-[13px] disabled:opacity-50"
        >
          {pendente && <Loader2 className="w-4 h-4 animate-spin" />}
          Aplicar convite
        </button>
      </div>

      {msg && (
        <p
          className="text-[12.5px] mt-3"
          style={{ color: msg.ok ? "#62e29a" : "#f6c35a" }}
        >
          {msg.texto}
        </p>
      )}
    </div>
  )
}
