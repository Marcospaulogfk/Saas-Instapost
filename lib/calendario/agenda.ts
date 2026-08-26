// =====================================================================
// lib/calendario/agenda.ts
// A conta do RELÓGIO do calendário editorial. Isolada aqui de propósito:
// é a parte do auto-publish onde errar não dá erro — dá post na hora errada.
//
// Duas decisões que valem pra tudo que consome este arquivo:
//
// 1) `scheduled_date` é `date` e `scheduled_time` é `time`, os dois SEM fuso
//    (migrations 0009 e 0012). Quem escreveu "18/09 às 09:00" quis dizer nove
//    da manhã NO BRASIL, não em UTC. Tratar isso como UTC publica três horas
//    cedo — de madrugada, no dia anterior, quando ninguém está olhando.
//    Por isso o fuso é explícito e não herda o relógio do servidor: o
//    container da Coolify roda em UTC.
//
// 2) O offset é perguntado ao ICU (Intl) em vez de fixado em -03:00. O Brasil
//    não tem horário de verão desde 2019, mas isso é decisão política e já
//    mudou várias vezes. Perguntar custa nada e não vira bug em 2027.
// =====================================================================

export const FUSO_CALENDARIO = "America/Sao_Paulo"

/**
 * Tolerância padrão pra publicar atrasado. O worker roda de tempos em tempos e
 * cai o container às vezes: publicar 20 minutos atrasado é o esperado.
 * Passar disso, não — ver `avaliarJanela`.
 */
export const JANELA_PADRAO_MIN = 120

const DATA_RE = /^\d{4}-\d{2}-\d{2}$/
const HORA_RE = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/

/** Quanto o fuso está deslocado de UTC NESTE instante, em ms. */
function offsetMs(instante: Date, fuso: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const p: Record<string, string> = {}
  for (const parte of dtf.formatToParts(instante)) p[parte.type] = parte.value
  // hour12:false devolve 24 no lugar de 0 em alguns runtimes.
  const hora = Number(p.hour) === 24 ? 0 : Number(p.hour)
  const comoSeFosseUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    hora,
    Number(p.minute),
    Number(p.second),
  )
  return comoSeFosseUtc - instante.getTime()
}

export function dataValida(data: string): boolean {
  if (!DATA_RE.test(data)) return false
  const [a, m, d] = data.split("-").map(Number)
  const teste = new Date(Date.UTC(a, m - 1, d))
  return (
    teste.getUTCFullYear() === a &&
    teste.getUTCMonth() === m - 1 &&
    teste.getUTCDate() === d
  )
}

export function horaValida(hora: string): boolean {
  return HORA_RE.test(hora)
}

/** "9:5" → null, "09:05:00" → "09:05". Normaliza o que vem do banco e da API. */
export function normalizarHora(hora: string | null | undefined): string | null {
  if (!hora) return null
  const bruta = hora.trim()
  if (!horaValida(bruta)) return null
  return bruta.slice(0, 5)
}

/**
 * O instante real (UTC) de um agendamento escrito em hora de parede brasileira.
 * Devolve null quando falta hora: peça sem hora NÃO é agendável (regra da v1),
 * e inventar meia-noite aqui seria exatamente a esperteza que a gente decidiu
 * não ter — publicaria a madrugada inteira sem ninguém ter pedido.
 */
export function instanteAgendado(
  data: string,
  hora: string | null | undefined,
  fuso: string = FUSO_CALENDARIO,
): Date | null {
  const h = normalizarHora(hora)
  if (!h || !dataValida(data)) return null
  const [ano, mes, dia] = data.split("-").map(Number)
  const [hh, mm] = h.split(":").map(Number)

  const paredeComoUtc = Date.UTC(ano, mes - 1, dia, hh, mm, 0)
  // Duas passadas: a primeira usa o offset do palpite, a segunda o do instante
  // corrigido. Só difere na virada de horário de verão, e é barato estar certo.
  let real = paredeComoUtc - offsetMs(new Date(paredeComoUtc), fuso)
  real = paredeComoUtc - offsetMs(new Date(real), fuso)
  return new Date(real)
}

export type EstadoJanela = "cedo" | "na_hora" | "vencida"

export interface Janela {
  estado: EstadoJanela
  /** Minutos de atraso em relação ao horário agendado (negativo = ainda falta). */
  atrasoMin: number
}

/**
 * Vale publicar agora?
 *
 * `vencida` existe por decisão explícita do desenho: se o worker ficou fora do
 * ar e volta com três posts de ontem na fila, publicar os três de uma vez é
 * pior do que não publicar. Vira enxurrada no perfil sem ninguém ter pedido.
 * Peça vencida vira 'falhou' com motivo, e o dono reagenda se quiser.
 */
export function avaliarJanela(
  agendadoEm: Date,
  agora: Date,
  janelaMin: number = JANELA_PADRAO_MIN,
): Janela {
  const atrasoMin = Math.floor((agora.getTime() - agendadoEm.getTime()) / 60000)
  if (atrasoMin < 0) return { estado: "cedo", atrasoMin }
  if (atrasoMin > janelaMin) return { estado: "vencida", atrasoMin }
  return { estado: "na_hora", atrasoMin }
}

/** Motivo legível pro card do CRM e pro histórico. Nunca "erro 3". */
export function motivoJanelaVencida(atrasoMin: number): string {
  const horas = Math.floor(atrasoMin / 60)
  const quando =
    horas >= 24
      ? `${Math.floor(horas / 24)} dia(s)`
      : horas >= 1
        ? `${horas}h${String(atrasoMin % 60).padStart(2, "0")}`
        : `${atrasoMin} min`
  return `a janela passou: o horário agendado ficou ${quando} pra trás e a publicação não roda em lote atrasado`
}

/** Hoje no fuso do calendário, em YYYY-MM-DD. Base do filtro de período. */
export function hojeNoFuso(agora: Date = new Date(), fuso: string = FUSO_CALENDARIO): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  return dtf.format(agora)
}
