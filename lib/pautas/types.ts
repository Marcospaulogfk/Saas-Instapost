/**
 * Calendario Inteligente — tipos compartilhados entre o modal, a rota de
 * geracao e a server action que persiste.
 *
 * Onde isso encaixa no funil: a PAUTA (o que postar, em que dia, por que)
 * e gratuita — 0 tokens. Ela existe pra encher o calendario sem medo. O que
 * cobra e materializar a pauta em POST, e isso acontece no wizard de criacao
 * pelo caminho que ja debita (ver lib/tokens.ts).
 *
 * NAO redefinimos formato/objetivo/status aqui: eles sao os mesmos de
 * `scheduled_posts` e vivem em lib/planejar.ts. Pauta nao e uma entidade
 * paralela — e uma linha de scheduled_posts com source='ia'.
 */

import type {
  PostFormato,
  PostObjetivo,
  ScheduledPost,
} from "@/lib/planejar"

/** Redes oferecidas no modal. O banco aceita 'tiktok' tambem (ver 0013). */
export type PautaRede = "instagram" | "facebook" | "linkedin"

/** Horizonte de planejamento. */
export type PautaPeriodo = "semana" | "mes"

export const REDE_LABEL: Record<PautaRede, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
}

export const PERIODO_LABEL: Record<PautaPeriodo, string> = {
  semana: "Próxima semana",
  mes: "Próximo mês",
}

/** Rotulos curtos dos dias, indexados por getDay() (0 = domingo). */
export const DIA_SEMANA_LABEL = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const

/** O que o usuario configurou no modal antes de gerar. */
export interface CalendarioConfig {
  periodo: PautaPeriodo
  /** Quantos posts por semana (1–14). O "custom" do modal cai aqui tambem. */
  postsPorSemana: number
  /** Dias preferidos, no indice de getDay() (0 = domingo). */
  diasSemana: number[]
  rede: PautaRede
}

/** Uma pauta pronta pra virar linha em scheduled_posts. */
export interface PautaGerada {
  titulo: string
  /** Resumo do conteudo (vai pra scheduled_posts.description). */
  descricao: string
  /** Por que este post neste dia (vai pra scheduled_posts.rationale). */
  motivo: string
  formato: PostFormato
  objetivo: PostObjetivo
  /** YYYY-MM-DD — vem da grade deterministica, nunca da IA (ver agenda.ts). */
  data: string
}

/** Resposta da rota POST /api/calendario/gerar. */
export interface GerarCalendarioResponse {
  pautas: PautaGerada[]
  /** Sempre 0 — o contrato do funil, explicito no payload pra UI nao chutar. */
  tokensCobrados: 0
}

/**
 * Linha de scheduled_posts com os campos da 0013.
 *
 * Opcionais de proposito: ate a migration rodar as colunas nao existem e o
 * select devolve a linha sem elas. A UI trata ausencia como "sem info", nunca
 * como erro.
 */
export interface PautaScheduledPost extends ScheduledPost {
  network?: PautaRede | "tiktok" | null
  rationale?: string | null
}

/** Limites do modal — validados no cliente E na rota. */
export const MIN_POSTS_SEMANA = 1
export const MAX_POSTS_SEMANA = 14

/**
 * Briefing que a pauta entrega pro wizard de criacao.
 *
 * E aqui que a pauta gratuita vira o input do post pago: o texto abaixo cai
 * em `?brief=` e o usuario ja abre o passo 2 com a ideia escrita, sem
 * retrabalho. Sem isso o gancho quebra — ele teria que redigitar a pauta.
 */
export function briefingDaPauta(p: {
  title: string
  description?: string | null
  rationale?: string | null
}): string {
  return [p.title, p.description?.trim() || "", p.rationale?.trim() ? `Contexto: ${p.rationale.trim()}` : ""]
    .filter(Boolean)
    .join("\n\n")
}
