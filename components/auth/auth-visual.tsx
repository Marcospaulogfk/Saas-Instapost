import { Check, Sparkles, TrendingUp } from "lucide-react"
import { Logo } from "@/components/brand/logo"

interface AuthVisualProps {
  /** Chamada do canto inferior. Quebre com <br /> — são 2 linhas por design. */
  tagline: React.ReactNode
}

/**
 * Painel decorativo das telas de auth (/login e /cadastro).
 *
 * É puramente ilustrativo: `aria-hidden`, sem foco, sem link. Some abaixo de
 * 1024px pelo CSS, então nada aqui pode ser informação que o mobile precise.
 * Os números são fictícios de vitrine — não ligar em dado real.
 */
export function AuthVisual({ tagline }: AuthVisualProps) {
  return (
    <div className="nx-auth-visual" aria-hidden="true">
      <div className="nx-auth-card">
        <div className="nx-auth-card-bg" />
        <div className="nx-auth-blob nx-auth-blob-1" />
        <div className="nx-auth-blob nx-auth-blob-2" />
        <div className="nx-auth-blob nx-auth-blob-3" />
        <div className="nx-auth-card-shade" />

        {/* Marca aprendida */}
        <div className="nx-auth-float nx-auth-float-marca">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[rgb(22_104_227/0.12)] ring-1 ring-[rgb(22_104_227/0.3)]">
              <Logo size={16} showWordmark={false} />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[#f2f5fa]">Marca aprendida</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[#b4bccc]">
                <span className="nx-auth-dot" />
                Tom de voz · paleta · fontes
              </div>
            </div>
          </div>
        </div>

        {/* Carrossel sendo montado */}
        <div className="nx-auth-float nx-auth-float-slides">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-[11.5px]">
            <span className="grid h-4 w-4 place-items-center rounded bg-[rgb(18_165_245/0.2)]">
              <Sparkles size={9} className="text-[#12A5F5]" />
            </span>
            <span className="flex-1 font-medium text-[#f2f5fa]">Carrossel · 8 slides</span>
            <span className="text-[10.5px] text-[#98a1b4]">agora</span>
          </div>
          <div className="nx-auth-slides mt-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className={`nx-auth-slide${i > 5 ? " pendente" : ""}`}
                style={{ animationDelay: `${1.5 + i * 0.12}s` }}
              />
            ))}
          </div>
          <div className="nx-auth-typing mt-2.5">
            <span />
            <span />
            <span />
          </div>
        </div>

        {/* Métrica */}
        <div className="nx-auth-float nx-auth-float-metric">
          <div className="flex items-center gap-1.5 text-[11.5px] text-[#b4bccc]">
            <TrendingUp size={13} className="text-[#12A5F5]" />
            Posts publicados
          </div>
          <div className="mt-1.5 font-mono text-[26px] font-semibold leading-none text-[#f2f5fa]">
            +18
            <span className="ml-1.5 font-sans text-[11px] font-medium text-[#98a1b4]">
              na semana
            </span>
          </div>
          <div className="nx-auth-spark mt-3 flex h-7 items-end gap-[3px]">
            {[38, 52, 44, 66, 58, 78, 70, 100].map((h, i) => (
              <span key={i} style={{ height: `${h}%`, animationDelay: `${1.2 + i * 0.06}s` }} />
            ))}
          </div>
        </div>

        {/* Etapas da engine */}
        <div className="nx-auth-float nx-auth-float-etapas">
          <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#12A5F5]">
            <Sparkles size={13} />
            Engine rodando
          </div>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-[#f2f5fa]">
            <span className="nx-auth-step-dot done">
              <Check size={10} strokeWidth={3.5} />
            </span>
            Roteiro escrito
          </div>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-[#f2f5fa]">
            <span className="nx-auth-step-dot active" />
            Design no seu estilo
          </div>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-[#98a1b4]">
            <span className="nx-auth-step-dot" />
            Imagem gerada
          </div>
        </div>

        <div className="nx-auth-tagline">
          <div className="nx-auth-tagline-eyebrow">Nexus Content</div>
          <h2 className="nx-auth-tagline-text">{tagline}</h2>
        </div>
      </div>
    </div>
  )
}

/** Ícone do Google (mesmo lockup nas duas telas de auth). */
export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}
