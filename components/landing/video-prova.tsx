"use client"

import { useRef, useState } from "react"
import { Play } from "lucide-react"

/*
 * Player de depoimento em vídeo. Nada carrega antes do clique: até lá é só o
 * poster + o botão. Se o arquivo não estiver no /public ainda, o onError troca
 * o player por um aviso discreto em vez de deixar um retângulo preto quebrado.
 */

type Props = {
  src: string
  poster: string
  /** Legenda curta embaixo do player. */
  legenda?: string
  className?: string
}

export function VideoProva({ src, poster, legenda, className = "" }: Props) {
  const [tocando, setTocando] = useState(false)
  const [falhou, setFalhou] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)

  return (
    <figure className={`m-0 ${className}`}>
      <div className="lp-card relative overflow-hidden rounded-2xl border border-hairline bg-surface">
        <div className="relative aspect-video">
          {tocando && !falhou ? (
            <video
              ref={ref}
              src={src}
              poster={poster}
              controls
              autoPlay
              playsInline
              onError={() => setFalhou(true)}
              className="absolute inset-0 h-full w-full bg-black object-cover"
            />
          ) : (
            <button
              type="button"
              onClick={() => setTocando(true)}
              disabled={falhou}
              className="group absolute inset-0 h-full w-full"
              aria-label="Reproduzir depoimento em vídeo"
            >
              <img
                src={poster}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-85"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />

              {falhou ? (
                <span className="absolute inset-0 grid place-items-center px-6 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
                  Vídeo indisponível no momento
                </span>
              ) : (
                <>
                  <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-white shadow-[0_0_34px_rgba(22,104,227,0.5)] transition-transform duration-300 group-hover:scale-110">
                    <Play className="ml-0.5 h-6 w-6 fill-current" />
                  </span>
                  <span className="lp-ring-pulse absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {legenda && (
        <figcaption className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          {legenda}
        </figcaption>
      )}
    </figure>
  )
}
