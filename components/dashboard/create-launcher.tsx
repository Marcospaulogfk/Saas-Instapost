import Link from "next/link"
import { Sparkles, Image as ImageIcon, LayoutTemplate, ArrowRight } from "lucide-react"

/**
 * Lançador de criação — cards separados (sem divisórias tipo caderno).
 * Cada formato é um card próprio; hover revela a borda-acento.
 */
const OPTIONS = [
  {
    href: "/dashboard/criar/ia",
    icon: Sparkles,
    name: "Carrossel com IA",
    desc: "Roteiro, imagens e design gerados pra você",
  },
  {
    href: "/dashboard/criar/post-unico",
    icon: ImageIcon,
    name: "Post único",
    desc: "Uma arte pronta em segundos",
  },
  {
    href: "/dashboard/criar/editorial",
    icon: LayoutTemplate,
    name: "Carrossel editorial",
    desc: "Templates curados — você edita cada slide",
  },
]

export function CreateLauncher() {
  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.16em] text-text-muted">
          Criar
        </h2>
        <Link
          href="/dashboard/criar"
          className="text-[11px] text-text-muted hover:text-text-primary transition-colors"
        >
          Ver tudo
        </Link>
      </div>

      <div className="space-y-2.5">
        {OPTIONS.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="group card-black card-black-hover flex items-center gap-4 px-5 py-4"
          >
            <span className="w-10 h-10 rounded-xl bg-brand-600/12 text-brand-300 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-brand-600/20">
              <o.icon className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[14px] font-medium text-text-primary leading-tight">
                {o.name}
              </span>
              <span className="block text-[12.5px] text-text-muted truncate mt-0.5">
                {o.desc}
              </span>
            </span>
            <ArrowRight className="w-[18px] h-[18px] text-text-subtle group-hover:text-brand-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  )
}
