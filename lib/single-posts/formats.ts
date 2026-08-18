/**
 * Formatos de canvas do post único.
 *
 * Os três formatos têm a MESMA largura (1080px) — só a altura muda. Isso não é
 * coincidência do Instagram, é o que torna a adaptação de formato barata aqui:
 * como o FreePostSpec mede tudo em `cqw` (1cqw = 1% da LARGURA), toda âncora
 * horizontal é invariante entre formatos. Adaptar = redistribuir o eixo
 * vertical, e só.
 */

export type PostFormat = "post" | "story" | "square"

export interface PostFormatDef {
  id: PostFormat
  /** Rótulo pro usuário */
  label: string
  /** Proporção, pra mostrar junto do rótulo */
  ratio: string
  width: number
  height: number
  /** Classe Tailwind de aspect-ratio usada pelo renderizador */
  aspectClass: string
  /** Largura máxima do preview na tela (story é alto, precisa caber) */
  previewMaxWidth: string
  /**
   * Margem mínima (px) que o conteúdo respeita no topo/base do canvas.
   *
   * Post e quadrado usam os 6cqw (~65px) da regra de composição do projeto.
   * Stories usa muito mais: a UI do Instagram desenha o avatar/close por cima
   * do topo e a barra de resposta por cima da base — conteúdo ali é conteúdo
   * escondido. Essa folga é justamente o "respirar" que o formato 9:16 pede.
   */
  safeTop: number
  safeBottom: number
}

const SAFE_MARGIN = Math.round((1080 / 100) * 6) // 6cqw

export const POST_FORMATS: Record<PostFormat, PostFormatDef> = {
  post: {
    id: "post",
    label: "Feed",
    ratio: "4:5",
    width: 1080,
    height: 1350,
    aspectClass: "aspect-[4/5]",
    previewMaxWidth: "440px",
    safeTop: SAFE_MARGIN,
    safeBottom: SAFE_MARGIN,
  },
  story: {
    id: "story",
    label: "Stories",
    ratio: "9:16",
    width: 1080,
    height: 1920,
    aspectClass: "aspect-[9/16]",
    previewMaxWidth: "320px",
    safeTop: 250,
    safeBottom: 320,
  },
  square: {
    id: "square",
    label: "Quadrado",
    ratio: "1:1",
    width: 1080,
    height: 1080,
    aspectClass: "aspect-square",
    previewMaxWidth: "440px",
    safeTop: SAFE_MARGIN,
    safeBottom: SAFE_MARGIN,
  },
}

export const POST_FORMAT_LIST: PostFormatDef[] = [
  POST_FORMATS.post,
  POST_FORMATS.story,
  POST_FORMATS.square,
]

/** Normaliza o que veio do banco/sessionStorage num formato válido. */
export function toPostFormat(v: unknown): PostFormat {
  return v === "story" || v === "square" || v === "post" ? v : "post"
}
