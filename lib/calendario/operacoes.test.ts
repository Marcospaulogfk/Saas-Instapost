import { describe, expect, it } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import { atualizarPauta, listarCalendario } from "./operacoes"

// =====================================================================
// As RECUSAS do calendário, testadas onde elas valem pros dois lados.
//
// Desde 10/09/2026 o mesmo miolo atende o webhook do WebSync-OS (segredo
// global de ambiente) e as rotas /api/v1/* (chave por conta). O risco de
// ter duas portas é a regra ser corrigida numa e esquecida na outra; como
// as duas chamam este arquivo, testar aqui cobre as duas de uma vez.
//
// O client é um espião que EXPLODE se for tocado: além de checar a
// resposta, isso prova que pedido malformado é recusado ANTES de gastar
// uma consulta no banco. Um teste que só olhasse o código de erro passaria
// mesmo se a validação acontecesse depois do SELECT.
// =====================================================================

const bancoProibido = new Proxy(
  {},
  {
    get() {
      throw new Error("o banco foi consultado antes de validar o pedido")
    },
  },
) as unknown as SupabaseClient

const DONO = "88654e3c-692e-4d4a-be20-60b72e398915"

describe("listarCalendario: período", () => {
  it("recusa período sem data", async () => {
    const r = await listarCalendario(bancoProibido, DONO, { de: "", ate: "" })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.falha.erro).toBe("periodo_invalido")
      expect(r.falha.status).toBe(400)
      // A mensagem diz o que fazer, não só que deu errado.
      expect(r.falha.motivo).toContain("de=")
    }
  })

  it("recusa data que não existe no calendário", async () => {
    const r = await listarCalendario(bancoProibido, DONO, {
      de: "2026-02-30",
      ate: "2026-03-01",
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.falha.erro).toBe("periodo_invalido")
  })

  it("recusa período invertido", async () => {
    const r = await listarCalendario(bancoProibido, DONO, {
      de: "2026-09-30",
      ate: "2026-09-01",
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.falha.motivo).toContain("depois")
  })

  it("recusa período longo demais e diz de quanto foi o pedido", async () => {
    const r = await listarCalendario(bancoProibido, DONO, {
      de: "2026-01-01",
      ate: "2026-12-31",
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.falha.erro).toBe("periodo_longo")
      expect(r.falha.motivo).toContain("365")
    }
  })
})

describe("atualizarPauta: o que o CRM não pode escrever", () => {
  const id = "b21e0000-0000-4000-8000-000000000000"

  it("recusa PATCH vazio", async () => {
    const r = await atualizarPauta(bancoProibido, DONO, id, {})
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.falha.erro).toBe("nada_pra_mudar")
  })

  it("recusa data fora do formato", async () => {
    const r = await atualizarPauta(bancoProibido, DONO, id, { data: "20/09/2026" })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.falha.erro).toBe("data_invalida")
      expect(r.falha.motivo).toContain("YYYY-MM-DD")
    }
  })

  it("recusa hora fora do formato", async () => {
    const r = await atualizarPauta(bancoProibido, DONO, id, { hora: "9h" })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.falha.erro).toBe("hora_invalida")
      expect(r.falha.motivo).toContain("HH:MM")
    }
  })

  it("aceita hora nula (tirar o horário é legítimo)", async () => {
    // Passa da validação de formato e vai ao banco — que aqui explode de
    // propósito. É o jeito de provar que NÃO foi recusado antes.
    await expect(
      atualizarPauta(bancoProibido, DONO, id, { hora: null }),
    ).rejects.toThrow("o banco foi consultado")
  })

  it("recusa 'publicado' e 'falhou': quem escreve isso é o worker", async () => {
    for (const status of ["publicado", "falhou"]) {
      const r = await atualizarPauta(bancoProibido, DONO, id, { status })
      expect(r.ok).toBe(false)
      if (!r.ok) {
        expect(r.falha.erro).toBe("campo_nao_seu")
        expect(r.falha.status).toBe(409)
      }
    }
  })

  it("recusa status inventado, repetindo o valor recebido", async () => {
    const r = await atualizarPauta(bancoProibido, DONO, id, { status: "quase_pronto" })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.falha.erro).toBe("status_desconhecido")
      expect(r.falha.motivo).toContain("quase_pronto")
    }
  })

  it("deixa passar os quatro status editoriais", async () => {
    for (const status of ["ideia", "em_criacao", "pronto", "agendado"]) {
      await expect(
        atualizarPauta(bancoProibido, DONO, id, { status }),
      ).rejects.toThrow("o banco foi consultado")
    }
  })
})
