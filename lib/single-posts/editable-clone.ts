import type { FreeBlock } from "./free-spec"

type CssSize = string | number | undefined

/**
 * Tamanho do bloco CLONADO dentro do wrapper do modo editável.
 *
 * O wrapper já recebe position.width/height do spec; o clone herdava o próprio
 * width — que, vindo de positionToStyle, é o MESMO valor. Em `cqw` as duas
 * camadas resolvem contra o canvas (container query) e o resultado coincide,
 * mas em `%` o filho resolve contra o wrapper e a largura aplica DUAS vezes:
 * 34% vira 34% de 34% = 11,6% do canvas, texto espremido, layout desmontado
 * (é o que quebrava os specs do buildSpecFromLayout). Quando o filho repete o
 * valor do wrapper, a única tradução correta é "100%" — idêntico em cqw/px,
 * conserta o %. Valores próprios do bloco (fit-content do ícone, thickness do
 * divider, fallback quando o spec não deu width) passam intactos.
 */
export function editableCloneSize(
  type: FreeBlock["type"],
  position: FreeBlock["position"] | undefined,
  inner: { width?: CssSize; height?: CssSize },
): { width: CssSize; height: CssSize } {
  // Imagem/shape preenchem o wrapper (o wrapper já tem o tamanho certo).
  // Sem isso, height em % vira % do wrapper e a imagem encolhe pra um cantinho.
  if (type === "image" || type === "shape") return { width: "100%", height: "100%" }
  const p = position ?? {}
  return {
    width:
      p.width !== undefined && inner.width === p.width
        ? "100%"
        : (inner.width ?? "auto"),
    height:
      p.height !== undefined && inner.height === p.height ? "100%" : inner.height,
  }
}
