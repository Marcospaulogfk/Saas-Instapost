import { describe, expect, it } from "vitest"
import {
  avaliarJanela,
  dataValida,
  hojeNoFuso,
  horaValida,
  instanteAgendado,
  motivoJanelaVencida,
  normalizarHora,
} from "./agenda"

describe("instanteAgendado", () => {
  it("lê a hora como hora de Brasília, não como UTC", () => {
    // 09:00 em São Paulo (UTC-3) é 12:00Z. Ler como UTC publicaria às 06:00
    // da manhã no Brasil — três horas cedo, todo dia.
    expect(instanteAgendado("2026-09-18", "09:00")?.toISOString()).toBe(
      "2026-09-18T12:00:00.000Z",
    )
  })

  it("não inventa hora quando a peça não tem: sem hora não é agendável", () => {
    expect(instanteAgendado("2026-09-18", null)).toBeNull()
    expect(instanteAgendado("2026-09-18", "")).toBeNull()
  })

  it("aceita o time do Postgres com segundos", () => {
    expect(instanteAgendado("2026-09-18", "23:30:00")?.toISOString()).toBe(
      "2026-09-19T02:30:00.000Z",
    )
  })

  it("recusa data impossível em vez de deslizar pro mês seguinte", () => {
    expect(instanteAgendado("2026-02-30", "10:00")).toBeNull()
    expect(dataValida("2026-02-30")).toBe(false)
    expect(dataValida("2026-02-28")).toBe(true)
  })

  it("recusa hora fora do relógio", () => {
    expect(horaValida("24:00")).toBe(false)
    expect(horaValida("9:00")).toBe(false)
    expect(horaValida("09:60")).toBe(false)
    expect(horaValida("09:00")).toBe(true)
  })

  it("normaliza o que vem do banco pro formato da API", () => {
    expect(normalizarHora("09:05:00")).toBe("09:05")
    expect(normalizarHora(null)).toBeNull()
    expect(normalizarHora("banana")).toBeNull()
  })
})

describe("avaliarJanela", () => {
  const agendado = new Date("2026-09-18T12:00:00.000Z")

  it("antes da hora não publica", () => {
    const j = avaliarJanela(agendado, new Date("2026-09-18T11:30:00.000Z"))
    expect(j.estado).toBe("cedo")
    expect(j.atrasoMin).toBe(-30)
  })

  it("atraso pequeno ainda publica: o worker não roda no segundo exato", () => {
    expect(avaliarJanela(agendado, new Date("2026-09-18T12:20:00.000Z")).estado).toBe(
      "na_hora",
    )
  })

  it("passou da janela NÃO publica: post de ontem não vira enxurrada hoje", () => {
    const j = avaliarJanela(agendado, new Date("2026-09-19T14:00:00.000Z"))
    expect(j.estado).toBe("vencida")
    expect(motivoJanelaVencida(j.atrasoMin)).toContain("a janela passou")
  })

  it("a borda da janela ainda é publicável", () => {
    expect(avaliarJanela(agendado, new Date("2026-09-18T14:00:00.000Z")).estado).toBe(
      "na_hora",
    )
    expect(avaliarJanela(agendado, new Date("2026-09-18T14:01:00.000Z")).estado).toBe(
      "vencida",
    )
  })
})

describe("hojeNoFuso", () => {
  it("usa o dia do Brasil, não o do container em UTC", () => {
    // 01:00Z do dia 27 ainda é dia 26 em São Paulo.
    expect(hojeNoFuso(new Date("2026-08-27T01:00:00.000Z"))).toBe("2026-08-26")
  })
})
