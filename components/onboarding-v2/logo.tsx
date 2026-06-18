import Image from "next/image"

// Proporção da logo horizontal oficial (aparada): 1181 x 263.
const LOGO_RATIO = 1181 / 263

/**
 * Logo oficial Syncpost — usa a arte horizontal da identidade visual
 * (public/syncpost-horizontal-branca-trim.png, versão branca pra fundo escuro).
 * `size` controla a ALTURA em px; a largura segue a proporção real.
 */
export function SyncPostLogo({ size = 30 }: { size?: number }) {
  const height = size
  const width = Math.round(size * LOGO_RATIO)
  return (
    <Image
      src="/syncpost-horizontal-branca-trim.png"
      alt="Syncpost"
      width={width}
      height={height}
      priority
      style={{ width, height, objectFit: "contain" }}
    />
  )
}
