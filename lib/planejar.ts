/**
 * Planejador Editorial — tipos compartilhados entre o chat, a API e o calendario.
 *
 * O fluxo: chat humanizado entende o negocio -> Claude monta um plano editorial
 * (lista de ideias com data sugerida) -> usuario aprova -> vira scheduled_posts.
 */

export type PostFormato = "post" | "carrossel" | "stories" | "reels"
export type PostObjetivo = "sell" | "inform" | "engage" | "community"
export type PostStatus =
  | "ideia"
  | "em_criacao"
  | "pronto"
  | "agendado"
  | "publicado"
  | "falhou"

/** Uma ideia de post no plano editorial gerado pela IA. */
export interface PlanoIdeia {
  titulo: string
  formato: PostFormato
  objetivo: PostObjetivo
  /** Data sugerida no formato YYYY-MM-DD */
  data: string
  descricao: string
  /** Motivo curto pra ideia (gancho/contexto) — ajuda o usuario a decidir */
  motivo: string
}

/** Plano editorial completo devolvido pela IA. */
export interface PlanoEditorial {
  resumo: string
  ideias: PlanoIdeia[]
}

/** Item persistido (vindo da tabela scheduled_posts). */
export interface ScheduledPost {
  id: string
  brand_id: string
  title: string
  description: string | null
  format: PostFormato
  objective: PostObjetivo
  scheduled_date: string
  /** Hora opcional (HH:MM[:SS]) — null quando so tem dia. */
  scheduled_time: string | null
  status: PostStatus
  source: "ia" | "manual"
  project_id: string | null
  created_at: string
}

export const FORMATO_LABEL: Record<PostFormato, string> = {
  post: "Post",
  carrossel: "Carrossel",
  stories: "Stories",
  reels: "Reels",
}

export const OBJETIVO_LABEL: Record<PostObjetivo, string> = {
  sell: "Vender",
  inform: "Informar",
  engage: "Engajar",
  community: "Comunidade",
}

export function statusColor(s: PostStatus): string {
  switch (s) {
    case "ideia":
      return "bg-brand-500"
    case "em_criacao":
      return "bg-blue-500"
    case "pronto":
      return "bg-emerald-500"
    case "agendado":
      return "bg-orange-500"
    case "publicado":
      return "bg-brand-600"
    case "falhou":
      return "bg-red-500"
  }
}

export function statusLabel(s: PostStatus): string {
  switch (s) {
    case "ideia":
      return "Ideia"
    case "em_criacao":
      return "Em criação"
    case "pronto":
      return "Pronto"
    case "agendado":
      return "Agendado"
    case "publicado":
      return "Publicado"
    case "falhou":
      return "Falhou"
  }
}

/** Formata uma Date pra YYYY-MM-DD em horario local (sem UTC shift). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
