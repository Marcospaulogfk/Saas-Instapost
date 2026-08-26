// =====================================================================
// lib/calendario/arte.ts
// A regra de "esta peça tem arte que dá pra publicar?".
//
// Esta é a pergunta que só o Nexus sabe responder, e é a que o CRM mostra no
// card ANTES do dia chegar. Ela NÃO é um booleano, e isso foi medido, não
// suposto: em 26/08/2026 havia 6 posts com URL pública que passariam em
// qualquer checagem (HTTP 200, image/png, bucket nosso, não expira) e que são
// MINIATURAS de 540x675. A Meta aceita 540 — o mínimo dela é 320 — publica sem
// erro nenhum e o post sai com metade da resolução no perfil do cliente.
//
// Um booleano diria "true" justamente nessas 6, que é onde mais dói. Daí os
// três estados.
// =====================================================================

import { POST_FORMATS, type PostFormat } from "@/lib/single-posts/formats"

export type EstadoArte = "sem_arte" | "so_miniatura" | "publicavel"

export interface Arte {
  estado: EstadoArte
  /** Legível, pro card e pro histórico. Null só quando não há nada a dizer. */
  motivo: string | null
  artifactType: "single_post" | "carousel" | null
  artifactId: string | null
  thumbUrl: string | null
  /** URLs no tamanho final, NA ORDEM. Vazio quando estado != 'publicavel'. */
  imagens: string[]
}

/** O que a regra precisa saber de uma peça, venha ela de qual tabela vier. */
export interface PecaBruta {
  tipo: "single_post" | "carousel"
  id: string
  publishImageUrls: string[] | null
  publishPreparedAt: string | null
  thumbUrl: string | null
  /** Última alteração da peça: se for depois do preparo, a arte está velha. */
  updatedAt: string | null
}

/**
 * Folga entre `publish_prepared_at` e `updated_at` antes de chamar a arte de
 * desatualizada.
 *
 * Não é firula: `single_posts` tem trigger BEFORE UPDATE que carimba
 * `updated_at = now()` (migration 0008). O MESMO write que grava
 * `publish_prepared_at` dispara o trigger, e o carimbo do banco cai alguns
 * milissegundos DEPOIS do timestamp que o servidor gerou antes da ida ao
 * banco. Sem a folga, toda peça recém-preparada nasceria com o aviso "foi
 * editada depois de preparada" — um alerta que aparece sempre é um alerta que
 * ninguém lê.
 */
export const MARGEM_PREPARO_MS = 60_000

export const ARTE_VAZIA: Arte = {
  estado: "sem_arte",
  motivo: "nenhuma arte foi gerada pra esta pauta ainda",
  artifactType: null,
  artifactId: null,
  thumbUrl: null,
  imagens: [],
}

/**
 * URL que a Meta consegue buscar E que continua existindo daqui a uma semana.
 *
 * O segundo requisito é o que exclui o bitmap do Fal: ele responde 200 hoje e
 * vence sozinho. Numa publicação manual isso é um erro na cara do usuário; num
 * agendamento é o post que não sai às 23h, sem ninguém por perto. Só passa
 * arquivo do nosso Storage público.
 */
export function urlPublicavel(url: string, baseSupabase?: string): boolean {
  const base = (baseSupabase ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "")
  if (!url || !base) return false
  return url.startsWith(`${base}/storage/v1/object/public/`)
}

/** Largura mínima aceitável: abaixo disso é miniatura, não arte. */
export function larguraMinima(format: PostFormat = "post"): number {
  return POST_FORMATS[format]?.width ?? POST_FORMATS.post.width
}

/**
 * Decide o estado de UMA peça. `thumbUrl` entra só pra distinguir
 * "não tem nada" de "tem, mas é a miniatura" — dois problemas que se resolvem
 * de formas diferentes (um pede gerar, o outro pede reexportar).
 */
export function avaliarArte(peca: PecaBruta | null, baseSupabase?: string): Arte {
  if (!peca) return ARTE_VAZIA

  const base = {
    artifactType: peca.tipo,
    artifactId: peca.id,
    thumbUrl: peca.thumbUrl,
  }

  const urls = (peca.publishImageUrls ?? []).filter(Boolean)
  const nossas = urls.filter((u) => urlPublicavel(u, baseSupabase))

  if (urls.length > 0 && nossas.length === 0) {
    return {
      ...base,
      estado: "sem_arte",
      motivo:
        "a arte preparada aponta pra uma URL que não é nossa e pode expirar antes do dia agendado: reexporte pelo editor",
      imagens: [],
    }
  }

  if (nossas.length > 0) {
    // Preparada e depois editada: publica o que foi preparado, não o que está
    // na tela. Avisa em vez de bloquear — bloquear aqui seria decidir pelo dono.
    const desatualizada =
      peca.publishPreparedAt &&
      peca.updatedAt &&
      new Date(peca.updatedAt).getTime() - new Date(peca.publishPreparedAt).getTime() >
        MARGEM_PREPARO_MS
    return {
      ...base,
      estado: "publicavel",
      motivo: desatualizada
        ? "a peça foi editada depois de preparada: o que vai ao ar é a versão preparada"
        : null,
      imagens: nossas,
    }
  }

  if (peca.thumbUrl) {
    return {
      ...base,
      estado: "so_miniatura",
      motivo:
        "esta peça só tem a miniatura da biblioteca (540px). Publicar assim sai com metade da resolução: abra no editor e prepare pra agendar",
      imagens: [],
    }
  }

  return {
    ...base,
    estado: "sem_arte",
    motivo: "a arte existe mas não tem imagem exportada: abra no editor e prepare pra agendar",
    imagens: [],
  }
}

/** Só peça `publicavel` pode ser agendada. Usado pelo PATCH e pelo worker. */
export function podeAgendar(arte: Arte): boolean {
  return arte.estado === "publicavel" && arte.imagens.length > 0
}
