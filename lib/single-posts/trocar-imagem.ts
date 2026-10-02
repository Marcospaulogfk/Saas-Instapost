/**
 * Trocar imagem de um post único pelo celular.
 *
 * O painel de edição só listava textos: dava pra ADICIONAR uma imagem, mas não
 * trocar a que já estava no post. Aqui ficam as peças puras (sem tela) pra
 * achar as imagens do spec e trocar a URL de uma delas.
 */
import type { FreeBlock, FreePostSpec } from "./free-spec";

export interface ImagemDoPost {
  /** "fundo" = foto de fundo do post; senão, caminho do bloco ("2" ou "3.1"). */
  alvo: "fundo" | string;
  url: string;
  rotulo: string;
}

/** Lista a foto de fundo (se houver) e todos os blocos de imagem, inclusive dentro de card/stack. */
export function listarImagens(spec: FreePostSpec): ImagemDoPost[] {
  const out: ImagemDoPost[] = [];
  if (spec.background.kind === "photo" && spec.background.photo_url) {
    out.push({
      alvo: "fundo",
      url: spec.background.photo_url,
      rotulo: "Foto de fundo",
    });
  }
  let n = 0;
  const percorre = (blocks: FreeBlock[], prefixo: string) => {
    blocks.forEach((b, i) => {
      const caminho = prefixo ? `${prefixo}.${i}` : String(i);
      if (b.type === "image") {
        n += 1;
        out.push({ alvo: caminho, url: b.url, rotulo: `Imagem ${n}` });
      } else if (b.type === "card" || b.type === "stack") {
        percorre(b.children, caminho);
      }
    });
  };
  percorre(spec.blocks, "");
  return out;
}

function trocaNoBloco(
  blocks: FreeBlock[],
  caminho: string,
  url: string,
): FreeBlock[] {
  const [cabeca, ...resto] = caminho.split(".").map(Number);
  return blocks.map((b, i) => {
    if (i !== cabeca) return b;
    if (resto.length === 0) return b.type === "image" ? { ...b, url } : b;
    if (b.type === "card" || b.type === "stack") {
      return { ...b, children: trocaNoBloco(b.children, resto.join("."), url) };
    }
    return b;
  });
}

/** Devolve um spec novo com a imagem do `alvo` trocada. Não muda o original. */
export function trocarImagem(
  spec: FreePostSpec,
  alvo: "fundo" | string,
  url: string,
): FreePostSpec {
  if (alvo === "fundo") {
    return {
      ...spec,
      background: { ...spec.background, kind: "photo", photo_url: url },
    };
  }
  return { ...spec, blocks: trocaNoBloco(spec.blocks, alvo, url) };
}
