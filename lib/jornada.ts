/**
 * Sistema de XP / Jornada — client-side via localStorage.
 * Quando tiver banco real, migrar pra tabela `user_xp_state`.
 */

export interface JornadaState {
  xp: number
  postsCriados: number
  diasOfensiva: number
  ultimaAtividadeISO: string | null
  missoesCompletas: string[]
}

export const NIVEIS = [
  { id: 1, nome: "Iniciante", min: 0, max: 350 },
  { id: 2, nome: "Aprendiz", min: 350, max: 1000 },
  { id: 3, nome: "Criador", min: 1000, max: 2500 },
  { id: 4, nome: "Especialista", min: 2500, max: 5000 },
  { id: 5, nome: "Mestre", min: 5000, max: 10000 },
  { id: 6, nome: "Lenda", min: 10000, max: Infinity },
]

export interface Missao {
  id: string
  titulo: string
  descricao: string
  xp: number
  tipo: "diaria" | "semanal" | "mensal"
  /** progresso atual / meta (ex: 1/3) */
  meta: number
}

export const MISSOES: Missao[] = [
  // Diárias
  {
    id: "analise-1-inspiracao",
    titulo: "Analise uma inspiração",
    descricao: "Abra uma inspiração para ver o briefing detalhado",
    xp: 5,
    tipo: "diaria",
    meta: 1,
  },
  {
    id: "gere-1-post",
    titulo: "Gere 1 post hoje",
    descricao: "Crie pelo menos um post — único, carrossel ou stories",
    xp: 10,
    tipo: "diaria",
    meta: 1,
  },
  // Semanais
  {
    id: "agende-3-posts",
    titulo: "Agende 3 posts",
    descricao: "Agende 3 posts no calendário esta semana",
    xp: 30,
    tipo: "semanal",
    meta: 3,
  },
  {
    id: "crie-5-posts",
    titulo: "Crie 5 posts",
    descricao: "Crie 5 posts esta semana (qualquer formato)",
    xp: 50,
    tipo: "semanal",
    meta: 5,
  },
  {
    id: "salve-2-inspiracoes",
    titulo: "Salve 2 inspirações",
    descricao: "Salve inspirações pra usar depois",
    xp: 15,
    tipo: "semanal",
    meta: 2,
  },
  // Mensais
  {
    id: "calendario-completo",
    titulo: "Crie um calendário",
    descricao: "Use as recomendações IA pra gerar 1 mês inteiro",
    xp: 100,
    tipo: "mensal",
    meta: 1,
  },
  {
    id: "indique-4-amigos",
    titulo: "Indique 4 amigos",
    descricao: "Convide 4 amigos pro SyncPost",
    xp: 200,
    tipo: "mensal",
    meta: 4,
  },
  {
    id: "top-10-ranking",
    titulo: "Top 10 Ranking",
    descricao: "Fique entre os 10 com mais XP no mês",
    xp: 40,
    tipo: "mensal",
    meta: 1,
  },
]

const STORAGE_KEY = "syncpost_jornada_v1"

export function loadJornada(): JornadaState {
  if (typeof window === "undefined") {
    return defaultState()
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    return { ...defaultState(), ...parsed }
  } catch {
    return defaultState()
  }
}

export function saveJornada(state: JornadaState): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function defaultState(): JornadaState {
  return {
    xp: 50,
    postsCriados: 1,
    diasOfensiva: 1,
    ultimaAtividadeISO: new Date().toISOString(),
    missoesCompletas: ["analise-1-inspiracao"],
  }
}

export function nivelAtual(xp: number) {
  return NIVEIS.find((n) => xp >= n.min && xp < n.max) ?? NIVEIS[NIVEIS.length - 1]
}

export function progressoNivel(xp: number): {
  nivel: typeof NIVEIS[number]
  proxima: typeof NIVEIS[number] | null
  percentual: number
  xpFaltando: number
}  {
  const nivel = nivelAtual(xp)
  const proxima = NIVEIS.find((n) => n.min === nivel.max) ?? null
  const span = nivel.max - nivel.min
  const ganho = xp - nivel.min
  const percentual = Math.min(100, Math.round((ganho / span) * 100))
  const xpFaltando = Math.max(0, nivel.max - xp)
  return { nivel, proxima, percentual, xpFaltando }
}

export function gerarRanking(xp: number): { global: number; mes: number } {
  // Mock determinístico baseado no XP atual — quando tiver backend real, vem do server
  const global = Math.max(1, 5000 - Math.floor(xp / 2))
  const mes = Math.max(1, 1500 - Math.floor(xp / 5))
  return { global, mes }
}
