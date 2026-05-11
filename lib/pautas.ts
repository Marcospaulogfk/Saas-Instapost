/**
 * Pautas — agendamento de posts no calendário editorial.
 * Client-side via localStorage por enquanto. Migrar pra banco depois.
 */

export type PautaStatus = "ideia" | "em_criacao" | "pronto" | "agendado"

export interface Pauta {
  id: string
  titulo: string
  /** YYYY-MM-DD */
  data: string
  status: PautaStatus
  formato: "post" | "carrossel" | "stories"
  rede?: "instagram" | "facebook" | "linkedin" | "tiktok"
  /** Briefing usado pra gerar */
  briefing?: string
  /** Cor pra mostrar no calendário (vem do status) */
  notas?: string
  createdAt: string
}

const STORAGE_KEY = "syncpost_pautas_v1"

export function loadPautas(): Pauta[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Pauta[]
  } catch {
    return []
  }
}

export function savePautas(list: Pauta[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

export function addPauta(p: Omit<Pauta, "id" | "createdAt">): Pauta {
  const novo: Pauta = {
    ...p,
    id: `pauta_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  const all = [...loadPautas(), novo]
  savePautas(all)
  return novo
}

export function updatePauta(id: string, patch: Partial<Pauta>): void {
  const all = loadPautas().map((p) => (p.id === id ? { ...p, ...patch } : p))
  savePautas(all)
}

export function deletePauta(id: string): void {
  savePautas(loadPautas().filter((p) => p.id !== id))
}

export function statusColor(s: PautaStatus): string {
  switch (s) {
    case "ideia":
      return "bg-purple-500"
    case "em_criacao":
      return "bg-blue-500"
    case "pronto":
      return "bg-emerald-500"
    case "agendado":
      return "bg-orange-500"
  }
}

export function statusLabel(s: PautaStatus): string {
  switch (s) {
    case "ideia":
      return "Ideia"
    case "em_criacao":
      return "Em criação"
    case "pronto":
      return "Pronto"
    case "agendado":
      return "Agendado"
  }
}

/**
 * Gera N pautas semente espalhadas no mês — usado pelo botão "Recomendações IA".
 * Usa datas comemorativas + temas comuns.
 */
export function gerarPautasIA(year: number, month: number, count: number = 8): Pauta[] {
  const dias = new Date(year, month + 1, 0).getDate()
  const ideias = [
    "Quebra um mito do nicho",
    "Bastidores do trabalho",
    "Antes e depois (case)",
    "Pergunta provocativa pra engajar",
    "Lista de 5 erros comuns",
    "Depoimento de cliente",
    "Opinião contracorrente",
    "Checklist salvável",
    "Curiosidade do segmento",
    "Resposta pra dúvida frequente",
  ]
  const formatos: Pauta["formato"][] = ["carrossel", "post", "stories"]
  const created: Pauta[] = []
  const step = Math.max(1, Math.floor(dias / count))
  for (let i = 0; i < count; i++) {
    const dia = Math.min(dias, 1 + i * step + Math.floor(Math.random() * 2))
    const ideia = ideias[i % ideias.length]
    const fmt = formatos[i % formatos.length]
    const data = `${year}-${String(month + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
    created.push({
      id: `pauta_ia_${Date.now()}_${i}`,
      titulo: ideia,
      data,
      status: "ideia",
      formato: fmt,
      rede: "instagram",
      createdAt: new Date().toISOString(),
    })
  }
  return created
}
