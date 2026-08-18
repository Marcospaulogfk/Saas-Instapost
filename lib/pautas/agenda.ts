/**
 * Grade de datas do Calendario Inteligente.
 *
 * DECISAO: a IA NAO escolhe datas. Ela recebe os slots prontos e so preenche
 * o conteudo de cada um.
 *
 * Por que: modelo de linguagem erra aritmetica de calendario (dia da semana,
 * virada de mes, ano bissexto) e erra em silencio — o usuario so descobre
 * quando ve tres posts caindo num domingo que ele nao marcou. A configuracao
 * do modal (periodo x posts por semana x dias preferidos) e uma restricao
 * dura do produto, entao ela vira codigo deterministico e testavel, nao
 * instrucao no prompt.
 */

import { toISODate } from "@/lib/planejar"
import {
  MAX_POSTS_SEMANA,
  MIN_POSTS_SEMANA,
  type PautaPeriodo,
} from "./types"

/** Quantas semanas cada periodo cobre. */
export function semanasDoPeriodo(periodo: PautaPeriodo): number {
  // "mes" = 4 semanas cheias, e nao "ate o fim do mes corrente": a cadencia
  // que o usuario pediu e semanal ("5 posts por semana"), entao contar em
  // semanas mantem a promessa exata. Fechar no ultimo dia do mes daria uma
  // semana quebrada — 5 posts prometidos, 2 entregues.
  return periodo === "semana" ? 1 : 4
}

/** Total de slots que a configuracao vai gerar. */
export function totalDeSlots(
  periodo: PautaPeriodo,
  postsPorSemana: number,
): number {
  return semanasDoPeriodo(periodo) * clampPostsPorSemana(postsPorSemana)
}

export function clampPostsPorSemana(n: number): number {
  if (!Number.isFinite(n)) return 3
  return Math.max(MIN_POSTS_SEMANA, Math.min(MAX_POSTS_SEMANA, Math.round(n)))
}

/**
 * Distribui as datas dos posts a partir de `inicio`.
 *
 * A semana aqui e RELATIVA ao inicio (dia 0–6, 7–13, ...), nao a semana do
 * calendario. Assim quem gera numa sexta recebe a primeira leva ja nos dias
 * seguintes, em vez de esperar o proximo domingo pra "semana 1" comecar.
 *
 * Quando `postsPorSemana` passa da quantidade de dias preferidos, os dias
 * sao reciclados em ordem (o mesmo dia recebe 2 posts) em vez de invadir um
 * dia que o usuario nao marcou — a preferencia dele e mais forte que a
 * distribuicao perfeita.
 *
 * @param diasSemana indices de getDay() (0 = domingo). Vazio = todos os dias.
 * @returns datas YYYY-MM-DD em ordem cronologica (pode repetir).
 */
export function distribuirDatas(
  inicio: Date,
  periodo: PautaPeriodo,
  postsPorSemana: number,
  diasSemana: number[],
): string[] {
  const porSemana = clampPostsPorSemana(postsPorSemana)
  const preferidos = normalizarDias(diasSemana)
  const semanas = semanasDoPeriodo(periodo)

  const base = new Date(inicio)
  base.setHours(0, 0, 0, 0)

  const out: string[] = []

  for (let semana = 0; semana < semanas; semana++) {
    // Candidatos = dias da janela de 7 dias desta semana que batem com a
    // preferencia, em ordem cronologica.
    const candidatos: Date[] = []
    for (let offset = 0; offset < 7; offset++) {
      const d = new Date(base)
      d.setDate(d.getDate() + semana * 7 + offset)
      if (preferidos.includes(d.getDay())) candidatos.push(d)
    }
    if (candidatos.length === 0) continue

    for (let i = 0; i < porSemana; i++) {
      // i % len: pega os N primeiros quando sobra dia, recicla quando falta.
      out.push(toISODate(candidatos[i % candidatos.length]!))
    }
  }

  return out.sort((a, b) => a.localeCompare(b))
}

/** Dias validos, sem repetidos e em ordem. Vazio = semana inteira. */
function normalizarDias(dias: number[]): number[] {
  const limpos = Array.from(
    new Set(dias.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)),
  ).sort((a, b) => a - b)
  return limpos.length ? limpos : [0, 1, 2, 3, 4, 5, 6]
}
