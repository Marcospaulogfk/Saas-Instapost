import Link from "next/link"
import { Plus } from "lucide-react"

interface NovaHeroProps {
  greeting: string
  name: string
}

export function NovaHero({ greeting, name }: NovaHeroProps) {
  return (
    <section className="nv-hero nv-fade p-7 md:p-8">
      <div className="relative z-10 max-w-2xl">
        <p className="text-[14px] mb-1.5" style={{ color: "var(--nv-text-muted)" }}>
          {greeting}, {name}.
        </p>
        <h1
          className="text-[28px] md:text-[34px] font-bold leading-[1.1] tracking-tight mb-2"
          style={{ color: "var(--nv-text)" }}
        >
          Vamos criar algo incrível hoje.
        </h1>
        <p className="text-[14px] mb-6" style={{ color: "var(--nv-text-muted)" }}>
          Gere conteúdo de alta qualidade pra Instagram com o poder da IA.
        </p>

        <Link
          href="/dashboard/criar"
          className="nv-btn-primary inline-flex items-center gap-2 h-11 px-6 text-[14px]"
        >
          <Plus className="w-4 h-4" />
          Criar conteúdo
        </Link>
      </div>

      {/* Ilustração IA */}
      <HeroArt />
    </section>
  )
}

function HeroArt() {
  return (
    <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 z-0 pointer-events-none">
      <div className="relative w-[280px] h-[230px]">
        {/* Glow pulsante atrás do post */}
        <div
          className="nv-hero-glow absolute"
          style={{
            inset: "10% 8% 10% 30%",
            background:
              "radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(139,92,246,0.14) 45%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />
        <svg width="280" height="230" viewBox="0 0 280 230" fill="none" aria-hidden className="relative">
          <defs>
            <linearGradient id="nvImg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="55%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="nvAvatar" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="nvStack" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <filter id="nvSoft" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Pilha do carrossel (slides atrás) */}
          <g className="nv-hero-back">
            <rect x="70" y="66" width="128" height="150" rx="16" fill="url(#nvStack)" opacity="0.35" transform="rotate(-9 134 141)" />
            <rect x="82" y="58" width="130" height="152" rx="16" fill="url(#nvStack)" opacity="0.6" transform="rotate(-4.5 147 134)" />
          </g>

          {/* Post da frente (mockup do que o app gera) */}
          <g className="nv-hero-front" filter="url(#nvSoft)">
            <rect x="96" y="40" width="134" height="166" rx="16" fill="#f6f4fb" />

            {/* Header: avatar + handle */}
            <circle cx="118" cy="62" r="9" fill="url(#nvAvatar)" />
            <rect x="134" y="56" width="52" height="6" rx="3" fill="#cfc9dc" />
            <rect x="134" y="66" width="34" height="5" rx="2.5" fill="#e2dded" />

            {/* Imagem gerada */}
            <rect x="108" y="82" width="110" height="66" rx="9" fill="url(#nvImg)" />

            {/* Legenda */}
            <rect x="108" y="158" width="110" height="6" rx="3" fill="#d3cde0" />
            <rect x="108" y="170" width="88" height="6" rx="3" fill="#e2dded" />
            <rect x="108" y="182" width="66" height="6" rx="3" fill="#e2dded" />

            {/* Pontinhos do carrossel */}
            <rect x="108" y="196" width="14" height="4" rx="2" fill="#7c3aed" />
            <circle cx="132" cy="198" r="2" fill="#c9c3d8" />
            <circle cx="140" cy="198" r="2" fill="#c9c3d8" />
          </g>
        </svg>
      </div>
    </div>
  )
}
