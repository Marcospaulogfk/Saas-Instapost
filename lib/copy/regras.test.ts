import { describe, expect, it } from "vitest"
import { regraCopy, regraSujeitoImagem, regrasCopy } from "./regras"

describe("regras de copy em markdown", () => {
  it("carrega os 6 blocos do disco", () => {
    for (const nome of [
      "principios",
      "capa",
      "estrutura",
      "profundidade",
      "legenda",
      "imagem",
    ] as const) {
      expect(regraCopy(nome).length).toBeGreaterThan(200)
    }
  })

  it("mantém as travas centrais de produto", () => {
    const tudo = regrasCopy("principios", "capa", "estrutura", "legenda")
    expect(tudo).toContain("TRAVESSÃO É PROIBIDO")
    expect(tudo).toContain("NOMEIA o sujeito")
    expect(tudo).toContain("Slide 1 = REHOOK")
    expect(tudo).toContain("3 a 5 hashtags")
    // Decisão 21/08: sem molde fixo de dois-pontos na capa.
    expect(tudo).not.toMatch(/com dois-pontos, 15-25/)
  })

  it("não cita fornecedor de IA (regras neutras)", () => {
    const tudo = regrasCopy(
      "principios",
      "capa",
      "estrutura",
      "profundidade",
      "legenda",
      "imagem",
    )
    expect(tudo).not.toMatch(/\b(Claude|Anthropic|Gemini|GPT|Sonnet|Haiku|Flux)\b/)
  })

  it("recorta só a regra do sujeito pro post único", () => {
    const bloco = regraSujeitoImagem()
    expect(bloco.startsWith("## Regra do sujeito")).toBe(true)
    expect(bloco).toContain("Trava de veracidade")
    expect(bloco).not.toContain("## Template do prompt")
  })
})
