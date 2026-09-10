import Link from "next/link"
import { Home, LayoutDashboard } from "lucide-react"
import { Logo } from "@/components/brand/logo"

/**
 * Página 404 global. Cobre qualquer rota inexistente do app inteiro (dentro
 * e fora do dashboard) — por isso segue os tokens flat do DESIGN.md em vez do
 * namespace `nx-auth-*` (aquele é exceção só de login/cadastro/landing).
 * Sem glow, sem gradiente, fundo `--canvas` (nunca #000 puro).
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0910] px-6 py-16 text-center text-[#f7f8f8]">
      <Link href="/" className="inline-flex items-center">
        <Logo size={28} />
      </Link>

      <div className="mt-12 flex flex-col items-center">
        <span className="font-mono text-[12px] font-medium tracking-[0.05em] text-[#8a8f98]">
          ● erro 404
        </span>

        <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.02em] text-[#f7f8f8]">
          Essa página não existe
        </h1>

        <p className="mt-3 max-w-[360px] text-[14px] leading-[1.6] text-[#c9ced7]">
          O endereço que você tentou abrir não existe ou foi movido. Volte pro
          início ou siga direto pro seu painel.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[rgba(255,255,255,0.07)] px-5 text-[14px] font-medium text-[#c9ced7] transition-colors hover:border-[rgba(255,255,255,0.15)] hover:text-[#f7f8f8]"
          >
            <Home size={16} />
            Ir para o início
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1668E3] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#0E52BC]"
          >
            <LayoutDashboard size={16} />
            Ir para o painel
          </Link>
        </div>
      </div>
    </div>
  )
}
