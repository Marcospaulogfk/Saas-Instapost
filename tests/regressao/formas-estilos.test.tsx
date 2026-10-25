// Quantas formas decorativas editáveis (data-edit="shape") cada estilo tem no
// carrossel padrão de 5 slides. Se alguém mexer num layout e um enfeite deixar
// de ser clicável/editável, o número cai e este teste acusa.
//
// Mudou de propósito (forma nova ou removida)? Atualize o número aqui.
// Estilos com 0: não têm enfeite solto (só foto, texto, tag e degradês de
// legibilidade, que não viram forma). Ver tests/README.md.
import { describe, it, expect } from "vitest"
import { ESTILOS_ORIGINAIS, abrir, carrosselPadrao, renderCarrossel } from "./helpers"

const FORMAS_POR_ESTILO: Record<(typeof ESTILOS_ORIGINAIS)[number], number> = {
  auto: 0,
  wesley: 0,
  brandsdecoded: 4,
  bolo: 0,
  mypostflow: 0,
  gradient: 0,
  minimal: 10,
  seamless: 0,
  cards: 4,
  perfil: 0,
  lookbook: 5,
  cinema: 4,
  estudio: 0,
  colagem: 5,
  cartaz: 3,
  agencia: 6,
  poster: 3,
  geometrico: 29,
}

describe("formas editáveis por estilo", () => {
  for (const estilo of ESTILOS_ORIGINAIS) {
    it(`${estilo}: ${FORMAS_POR_ESTILO[estilo]} formas no carrossel de 5 slides`, () => {
      const htmls = renderCarrossel(carrosselPadrao(), { estilo })
      const total = htmls.reduce((n, h) => n + abrir(h)('[data-edit="shape"]').length, 0)
      expect(total).toBe(FORMAS_POR_ESTILO[estilo])
    })
  }

  it("forma nunca é <p> (p vira texto sozinho e embaralharia as chaves)", () => {
    for (const estilo of ESTILOS_ORIGINAIS) {
      for (const h of renderCarrossel(carrosselPadrao(), { estilo })) {
        expect(abrir(h)('p[data-edit="shape"]').length, estilo).toBe(0)
      }
    }
  })
})
