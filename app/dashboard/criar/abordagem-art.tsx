import Image from "next/image"

/**
 * Ilustração de fundo dos cards de abordagem.
 *
 * As artes foram geradas no Fal (flux/schnell) com um prompt de estilo comum —
 * objeto 3D isolado, fundo quase preto, luz de estúdio — mas com UMA COR por
 * abordagem, no espírito dos cards do Canva: é a variação cromática que dá
 * vida à grade. Ficam em `public/abordagens/<id>.webp` (2-11KB cada).
 *
 * Duas escolhas dependem de como as imagens foram geradas:
 * - `mix-blend-mode: screen` recorta o fundo sem precisar de PNG com alfa: o
 *   preto some contra o card escuro e sobra só o objeto iluminado. Se trocar
 *   por arte de fundo claro, isso inverte e vira um borrão.
 * - a máscara em degradê dissolve a borda esquerda, senão apareceria um corte
 *   reto no meio do card.
 *
 * O `glow` abaixo é a lavagem de cor por trás da arte e precisa acompanhar a
 * cor da imagem — um halo azul atrás de um avião laranja suja os dois.
 */
const GLOW: Record<string, string> = {
  viral: "255,122,47",
  educativo: "59,130,246",
  comunidade: "16,185,129",
  storytelling: "139,92,246",
  dados: "245,158,11",
  oferta: "236,72,153",
}

export function AbordagemArt({ id, selected }: { id: string; selected: boolean }) {
  const rgb = GLOW[id]
  if (!rgb) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[46%] overflow-hidden"
    >
      {/* Lavagem de cor por trás da arte — é o que dá o "card colorido" do
          Canva sem chapar o fundo escuro do dashboard. */}
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${
          selected ? "opacity-100" : "opacity-55 group-hover:opacity-85"
        }`}
        style={{
          background: `radial-gradient(120% 90% at 100% 50%, rgba(${rgb},0.26) 0%, transparent 70%)`,
        }}
      />
      {/* A máscara mora AQUI e o blend na <img> de dentro, de propósito: com
          `mask-image` e `mix-blend-mode` no mesmo elemento o Chrome deixa de
          pintar a imagem (ela só reaparece após um repaint forçado). Separar
          em dois nós resolve. */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to left, black 62%, transparent 99%)",
          WebkitMaskImage: "linear-gradient(to left, black 62%, transparent 99%)",
        }}
      >
        <Image
          src={`/abordagens/${id}.webp`}
          alt=""
          width={440}
          height={440}
          /* h-[168%] + deslocada pra direita: o objeto fica no MEIO do arquivo
             gerado, então numa faixa estreita como esta ele cairia em cima do
             fade da máscara. Ampliar e empurrar traz o objeto pra parte opaca. */
          className={`absolute -right-8 top-1/2 h-[168%] w-auto max-w-none -translate-y-1/2 transition-opacity duration-200 ${
            selected ? "opacity-100" : "opacity-90 group-hover:opacity-100"
          }`}
          style={{ mixBlendMode: "screen" }}
        />
      </div>
    </div>
  )
}
