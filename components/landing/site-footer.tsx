"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Instagram, Linkedin, Mail, Youtube } from "lucide-react"

/*
 * Rodapé em dois cards (referência: footer do Kresna) adaptado à marca:
 * card escuro com gradiente da logo à esquerda, card claro com navegação à
 * direita, selo flutuante escrito à mão e a marca d'água gigante embaixo.
 */

const NAVEGACAO = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Recursos", href: "#recursos" },
  { label: "Planos", href: "#planos" },
  { label: "Dúvidas", href: "#faq" },
]

const EMPRESA = [
  { label: "Entrar", href: "/login" },
  { label: "Criar conta", href: "/cadastro" },
  { label: "Termos de uso", href: "/termos" },
  { label: "Privacidade", href: "/privacidade" },
]

/* TODO: trocar pelos perfis reais quando existirem. */
const SOCIAIS = [
  { Icon: Instagram, label: "Instagram", href: "#" },
  { Icon: Linkedin, label: "LinkedIn", href: "#" },
  { Icon: Youtube, label: "YouTube", href: "#" },
  { Icon: Mail, label: "E-mail", href: "#" },
]

/** Marca d'água: o viewBox é recalculado pelo bbox real do texto. */
function Watermark() {
  const svgRef = useRef<SVGSVGElement>(null)
  const textRef = useRef<SVGTextElement>(null)

  useEffect(() => {
    const ajustar = () => {
      const svg = svgRef.current
      const text = textRef.current
      if (!svg || !text) return
      try {
        const b = text.getBBox()
        if (b.width && b.height) {
          svg.setAttribute("viewBox", `${b.x} ${b.y} ${b.width} ${b.height}`)
        }
      } catch {
        /* getBBox falha se o nó ainda não tem layout — a próxima chamada resolve */
      }
    }

    document.fonts?.ready.then(ajustar).catch(() => ajustar())
    ajustar()
    window.addEventListener("resize", ajustar)
    return () => window.removeEventListener("resize", ajustar)
  }, [])

  return (
    <div
      className="pointer-events-none relative z-0 mx-auto -mt-10 max-w-[1150px] select-none leading-[0] md:-mt-16"
      aria-hidden
    >
      <svg
        ref={svgRef}
        viewBox="62 95 876 175"
        preserveAspectRatio="xMidYMid meet"
        className="block h-auto w-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          ref={textRef}
          x="500"
          y="240"
          textAnchor="middle"
          fontSize="320"
          className="lp-display"
          fill="rgba(255,255,255,0.05)"
        >
          Nexus Content
        </text>
      </svg>
    </div>
  )
}

export function SiteFooter() {
  const router = useRouter()
  const [email, setEmail] = useState("")

  /* Leva o e-mail digitado pro cadastro em vez de sumir com ele. */
  const irParaCadastro = () => {
    const destino = email.trim()
      ? `/cadastro?email=${encodeURIComponent(email.trim())}`
      : "/cadastro"
    router.push(destino)
  }

  return (
    <footer className="bg-black px-6 py-12 md:py-16">
      <div className="mx-auto grid max-w-[1150px] items-stretch gap-4 md:grid-cols-[350px_1fr]">
        {/* ── Card marca ─────────────────────────────────────── */}
        <div className="lp-noise relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[28px] p-8 text-white shadow-[0_12px_40px_rgba(22,104,227,0.28)]">
          {/* Fundo: gradiente da logo. Pra usar vídeo, troque esta div por um
              <video autoPlay muted loop playsInline> apontando pra /public. */}
          <div
            className="absolute inset-0"
            style={{ backgroundImage: "var(--logo-gradient)" }}
          />
          <div className="lp-halo absolute inset-0 opacity-60" />

          <div className="relative z-[1] flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] border-white/85 bg-white/15 text-base font-bold tracking-[-0.02em]">
              N
            </span>
            <span className="lp-display text-[22px] tracking-[-0.02em]">Nexus Content</span>
          </div>

          <div className="relative z-[1] mb-7 mt-auto">
            <p className="text-[19px] leading-[1.45]">
              Conteúdo que a sua marca assina,
              <br />
              <span className="text-white/65">gerado por IA.</span>
            </p>
          </div>

          <div className="relative z-[1] flex items-center justify-between gap-3">
            <span className="lp-hand text-[17px] tracking-[0.3px] text-white/90">
              Vamos conversar!
            </span>
            <div className="flex gap-[7px]">
              {SOCIAIS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#0e1014] shadow-[0_6px_18px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.2)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-black hover:shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
                >
                  <Icon className="h-[15px] w-[15px] text-white" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Card navegação ─────────────────────────────────── */}
        <div className="relative flex flex-col justify-between rounded-[28px] border border-white/[0.07] bg-[#0B0B0C] p-6 md:p-10">
          {/* Selo flutuante */}
          <div className="absolute -top-7 right-3 z-10 flex flex-col items-start gap-1.5 md:-top-9 md:right-10">
            <div
              className="flex h-[72px] w-[72px] -rotate-[10deg] items-center justify-center rounded-[22px] md:h-24 md:w-24"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #5BA3FB 0%, #1E5DD7 55%, #1448BE 100%)",
                boxShadow:
                  "inset 3px 3px 8px rgba(255,255,255,0.35), inset -3px -3px 12px rgba(0,0,0,0.18), 8px 14px 28px rgba(20,72,200,0.35)",
              }}
            >
              <span className="lp-display rotate-[10deg] text-[32px] leading-none text-white [text-shadow:0_3px_6px_rgba(0,0,0,0.25)] md:text-[42px]">
                N
              </span>
            </div>
            <div className="mt-1 flex -rotate-[4deg] items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] text-[#9ca3af]" aria-hidden>
                <g
                  stroke="currentColor"
                  fill="none"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 20 C 6 14, 10 9, 18 5" />
                  <path d="M18 5 L 12 5" />
                  <path d="M18 5 L 18 11" />
                </g>
              </svg>
              <span className="lp-hand whitespace-nowrap text-[20px] text-[#9ca3af]">
                Testa de graça?
              </span>
            </div>
          </div>

          {/* Colunas — no mobile o card é estreito e o selo desce sobre ele,
              então o conteúdo começa mais abaixo. */}
          <div className="flex gap-10 pt-20 md:gap-[72px] md:pt-2">
            {[
              { titulo: "Navegação", itens: NAVEGACAO },
              { titulo: "Empresa", itens: EMPRESA },
            ].map((col) => (
              <div key={col.titulo}>
                <div className="lp-hand mb-4 text-2xl italic text-white/45">{col.titulo}</div>
                {col.itens.map((l) => (
                  <Link
                    key={l.href + l.label}
                    href={l.href}
                    className="mb-3.5 block text-sm font-semibold text-white/90 transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Base */}
          <div className="mt-10 flex flex-col items-start justify-between gap-6 md:mt-12 md:flex-row md:items-end">
            <p className="text-[12.5px] font-medium text-white/40">
              © 2026 Nexus Content. Todos os direitos reservados.
            </p>

            <div className="flex w-full flex-col gap-3.5 md:w-auto">
              <h4 className="text-[15px] leading-[1.45] text-white/55">
                A IA não espera.
                <strong className="block text-[19px] font-bold text-white">
                  Comece com 1 carrossel grátis.
                </strong>
              </h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  irParaCadastro()
                }}
                className="flex w-full rounded-xl border border-white/10 bg-white/[0.04] p-[5px] md:w-[330px]"
              >
                <label htmlFor="footer-email" className="sr-only">
                  Seu e-mail
                </label>
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu melhor e-mail"
                  className="min-w-0 flex-1 border-0 bg-transparent px-3.5 py-2.5 text-[13.5px] text-white outline-none placeholder:text-white/35"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-[13.5px] font-semibold text-black transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-white/90"
                >
                  Criar conta
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Watermark />
    </footer>
  )
}
