"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Briefcase, Check, GraduationCap, Sparkles, Users } from "lucide-react"
import { salvarObjetivoUso } from "@/app/actions/onboarding"
import type { ObjetivoUso } from "@/lib/onboarding/objetivo"

const OPCOES: { id: ObjetivoUso; label: string; desc: string; icon: typeof Briefcase }[] = [
  {
    id: "negocio",
    label: "No meu negócio",
    desc: "Divulgo minha própria empresa ou produto.",
    icon: Briefcase,
  },
  {
    id: "criador",
    label: "Sou criador de conteúdo",
    desc: "Produzo pra minha própria audiência.",
    icon: Sparkles,
  },
  {
    id: "clientes",
    label: "Para clientes (agência/freela)",
    desc: "Crio posts pra marcas que eu atendo.",
    icon: Users,
  },
  {
    id: "estudo",
    label: "Estudo/curiosidade",
    desc: "Quero testar e aprender por enquanto.",
    icon: GraduationCap,
  },
]

/**
 * Etapa "como você vai usar o Nexus?" estilo Canva — pós-cadastro, skippable.
 * `next` já vem resolvido (query string incluída se houver) por quem montou
 * o link (app/actions/auth.ts `comOnboarding`, app/auth/callback/route.ts).
 */
export function ObjetivoClient({ next }: { next: string }) {
  const router = useRouter()
  const [selecionado, setSelecionado] = useState<ObjetivoUso | null>(null)
  const [pending, startTransition] = useTransition()

  function seguir() {
    router.push(next)
    router.refresh()
  }

  function escolher(id: ObjetivoUso) {
    if (pending) return
    setSelecionado(id)
    startTransition(async () => {
      await salvarObjetivoUso(id)
      seguir()
    })
  }

  return (
    <div className="nx-auth-inner nx-auth-fade-up" style={{ maxWidth: 440 }}>
      <h1 className="nx-auth-title" style={{ fontSize: 28 }}>
        Como você vai usar o Nexus?
      </h1>
      <p className="nx-auth-sub">Ajuda a mostrar o que importa pra você primeiro. Pode pular se quiser.</p>

      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {OPCOES.map((op) => {
          const Icone = op.icon
          const ativo = selecionado === op.id
          return (
            <button
              key={op.id}
              type="button"
              onClick={() => escolher(op.id)}
              disabled={pending}
              className="nx-onb-card"
              data-active={ativo}
            >
              <span className="nx-onb-card-icon">
                <Icone size={17} />
              </span>
              <span className="nx-onb-card-label">{op.label}</span>
              <span className="nx-onb-card-desc">{op.desc}</span>
              {ativo && (
                <span className="nx-onb-card-check">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={seguir}
        disabled={pending}
        className="nx-auth-troca mt-7 block w-full text-center"
      >
        Pular por agora
      </button>
    </div>
  )
}
