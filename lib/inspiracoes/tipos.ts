// =====================================================================
// lib/inspiracoes/tipos.ts
// Tipos compartilhados das FONTES PRÓPRIAS DE INSPIRAÇÃO.
//
// Este módulo é isomórfico (client + server) de propósito: a UI precisa dos
// mesmos rótulos e do mesmo shape que o servidor persiste, e duplicar isso
// num arquivo de client seria a primeira coisa a sair de sincronia.
//
// NÃO confundir com `lib/inspiracoes.ts` (arquivo, sem barra), que é o
// catálogo estático de sugestões curadas. Aqui é o oposto: a fonte é do
// usuário e a pauta sai da IA.
// =====================================================================

/**
 * Tipos de fonte suportados pelo schema (0016_inspiration_sources.sql).
 *
 * `youtube` e `pdf` existem no tipo e no CHECK do banco mas NÃO estão
 * implementados — entram aqui pra que a feature futura seja só leitura de
 * conteúdo (transcrição / texto do PDF) caindo no mesmo pipeline de geração,
 * sem migration nem refactor de tipo. A UI só oferece os implementados.
 */
export type FonteKind = "url" | "keyword" | "youtube" | "pdf"

/** Os tipos que a UI realmente oferece hoje. */
export const FONTES_IMPLEMENTADAS = ["url", "keyword"] as const
export type FonteKindImplementada = (typeof FONTES_IMPLEMENTADAS)[number]

export function isFonteImplementada(
  kind: string,
): kind is FonteKindImplementada {
  return (FONTES_IMPLEMENTADAS as readonly string[]).includes(kind)
}

export const FONTE_LABEL: Record<FonteKind, string> = {
  url: "Site ou artigo",
  keyword: "Busca por palavra-chave",
  youtube: "Vídeo do YouTube",
  pdf: "PDF",
}

/**
 * Conteúdo já lido da fonte, guardado em `inspiration_sources.payload`.
 *
 * Os campos de youtube/pdf estão declarados (opcionais) pra que o formato do
 * dado já esteja desenhado quando esses tipos entrarem — ver comentário do
 * `payload` na migration 0016.
 *
 * SEGURANÇA: tudo aqui é conteúdo de TERCEIRO. É dado, nunca instrução.
 */
export interface FontePayload {
  /** url: título da página. */
  title?: string
  /** url: meta description. */
  description?: string
  /** url: texto limpo da página (recortado). */
  text?: string
  /** url: quando foi raspado (ISO). */
  fetched_at?: string
  /** keyword: o termo usado na última busca. */
  last_query?: string
  /** keyword: URLs citadas pela busca web na última geração. */
  citations?: string[]
  /** youtube (RESERVADO): transcrição do vídeo. */
  transcript?: string
  /** youtube (RESERVADO): canal. */
  channel?: string
  /** pdf (RESERVADO): nome do arquivo enviado. */
  file_name?: string
  /** pdf (RESERVADO): total de páginas. */
  pages?: number
}

export interface FonteInspiracao {
  id: string
  brand_id: string
  kind: FonteKind
  value: string
  label: string | null
  payload: FontePayload
  last_generated_at: string | null
  created_at: string
  /** Quantas ideias já foram geradas dessa fonte (agregado na query). */
  ideias_count?: number
}

/** Badge de tipo da pauta — espelha o benchmark (Trend / Oportunidade). */
export type IdeiaBadge = "trend" | "oportunidade"

export const BADGE_LABEL: Record<IdeiaBadge, string> = {
  trend: "Trend",
  oportunidade: "Oportunidade",
}

export type IdeiaFormato = "post" | "carrossel" | "stories" | "reels"
export type IdeiaObjetivo = "sell" | "inform" | "engage" | "community"

export const OBJETIVO_LABEL: Record<IdeiaObjetivo, string> = {
  sell: "Vender",
  inform: "Informar",
  engage: "Engajar",
  community: "Comunidade",
}

export interface IdeiaInspiracao {
  id: string
  source_id: string
  brand_id: string
  badge: IdeiaBadge
  title: string
  angle: string | null
  format: IdeiaFormato
  objective: IdeiaObjetivo
  execution_tip: string | null
  briefing: string
  source_ref: string | null
  used_at: string | null
  created_at: string
}

/** O que a IA devolve antes de virar linha no banco. */
export interface IdeiaGerada {
  badge: IdeiaBadge
  title: string
  angle: string
  format: IdeiaFormato
  objective: IdeiaObjetivo
  execution_tip: string
  briefing: string
  source_ref?: string | null
}
