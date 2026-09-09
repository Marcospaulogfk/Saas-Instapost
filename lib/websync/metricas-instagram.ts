import type { AccountInsights, InstagramMedia, MediaInsights } from "@/lib/instagram/meta"

// =====================================================================
// O QUE A META DIZ → O QUE O CRM LÊ.
//
// Isto é uma tradução, e ela vive fora da rota por dois motivos. O primeiro
// é que dá pra testar sem rede. O segundo é que a regra que ela guarda é
// fácil de quebrar sem ninguém ver:
//
//   NÚMERO QUE NÃO FOI MEDIDO É `null`, NUNCA `0`.
//
// A Meta some com métrica de três jeitos diferentes, todos calados: omite a
// chave do total que não entregou, devolve os insights inteiros como null
// pra mídia antiga ou de tipo sem suporte, e manda a série de seguidores
// vazia pra conta com menos de 100 seguidores. Nos três casos o valor certo
// é "ainda não sei", e a tela do CRM desenha "-".
//
// Quem trocar um desses null por 0 não quebra teste nenhum do lado de lá: a
// tela simplesmente passa a afirmar que o post teve zero salvamento, que é
// uma frase diferente e falsa. Por isso os testes deste arquivo insistem
// tanto na diferença entre os dois.
// =====================================================================

export interface PostDaPonte {
  id: string
  publicadoEm: string
  manchete: string | null
  alcance: number | null
  salvamentos: number | null
  compartilhamentos: number | null
  comentarios: number | null
  /** A pauta que virou este post, quando ele saiu pelo SyncPost. */
  scheduledPostId: string | null
  viaSyncPost: boolean
}

export interface Totais30d {
  alcance: number | null
  seguidoresGanhos: number | null
  salvamentos: number | null
  compartilhamentos: number | null
}

/** `undefined` vira null explícito; 0 de verdade continua 0. */
export function num(v: number | undefined | null): number | null {
  return typeof v === "number" ? v : null
}

/** A primeira linha não vazia da legenda serve de manchete na tabela do CRM. */
export function manchete(caption: string | null | undefined): string | null {
  const linha = (caption ?? "")
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean)
  return linha ? linha.slice(0, 120) : null
}

/**
 * Totais da conta no período.
 *
 * A conta chama `saves`/`shares`; a mídia chama `saved`/`shares`. O CRM não
 * deveria precisar saber disso, então a diferença morre aqui.
 */
export function montarTotais(
  conta: AccountInsights,
  serieSeguidores: Array<{ date: string; value: number }>,
): Totais30d {
  return {
    alcance: num(conta.reach),
    // Série vazia é conta pequena demais pra Meta entregar, não crescimento
    // zero. Somar uma lista vazia daria 0 e seria mentira.
    seguidoresGanhos: serieSeguidores.length
      ? serieSeguidores.reduce((soma, d) => soma + (d.value ?? 0), 0)
      : null,
    salvamentos: num(conta.saves),
    compartilhamentos: num(conta.shares),
  }
}

/**
 * Um post do feed com o que se sabe dele.
 *
 * `insights` nulo é post SEM LEITURA — mídia antiga ou tipo sem suporte —, e
 * não post com zero de tudo. O único número que sobrevive nesse caso é a
 * contagem de comentários, que vem da própria mídia e não dos insights.
 */
export function montarPost(
  midia: InstagramMedia,
  insights: MediaInsights | null,
  scheduledPostId: string | null,
): PostDaPonte {
  return {
    id: midia.id,
    publicadoEm: midia.timestamp,
    manchete: manchete(midia.caption),
    alcance: num(insights?.reach),
    salvamentos: num(insights?.saved),
    compartilhamentos: num(insights?.shares),
    comentarios:
      typeof midia.commentsCount === "number"
        ? midia.commentsCount
        : num(insights?.comments),
    scheduledPostId,
    viaSyncPost: scheduledPostId !== null,
  }
}

/**
 * ig_media_id → scheduled_post_id, a partir das tentativas de publicação.
 *
 * É a corrente que devolve o PILAR pro CRM: a pauta de lá guarda o
 * scheduled_post_id desde o envio, então casar por aqui dispensa o CRM ter
 * publicado qualquer coisa. Post que o dono subiu na mão no Instagram não
 * aparece nesta tabela e fica sem pauta — o que é a verdade, não uma falha.
 */
export function mapearPautas(
  linhas: Array<{ ig_media_id?: unknown; scheduled_post_id?: unknown }>,
): Map<string, string> {
  const mapa = new Map<string, string>()
  for (const l of linhas) {
    const midia = typeof l.ig_media_id === "string" ? l.ig_media_id : null
    const pauta = typeof l.scheduled_post_id === "string" ? l.scheduled_post_id : null
    // A primeira tentativa bem-sucedida manda: republicação da mesma pauta
    // não deveria trocar o vínculo que já existe.
    if (midia && pauta && !mapa.has(midia)) mapa.set(midia, pauta)
  }
  return mapa
}
