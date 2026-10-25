// CONTRATO que TODO estilo de carrossel precisa cumprir — inclusive os novos
// que ainda estão sendo desenhados. Não compara pixel nem HTML exato: garante
// o mínimo pra que o slide seja legível E editável no editor (data-edit).
//
// Se um estilo novo falhar aqui, ele nasceu sem alguma peça do modelo de
// edição (título sem FitText, foto sem data-edit, "@marca" vazando...).
//
// Exceções documentadas abaixo são DECISÕES DE DESIGN dos estilos originais
// (lidas no código), não bugs. Bugs reais ficam como it.todo com explicação.
import { describe, it, expect } from "vitest"
import { CAROUSEL_STYLES } from "@/components/carousel/carousel-styles"
import type { EditorialStyle } from "@/components/carousel/slide-preview"
import {
  abrir,
  carrosselPadrao,
  renderCarrossel,
  renderSlide,
  semImagem,
  textoVisivel,
} from "./helpers"

const TODOS_OS_ESTILOS = CAROUSEL_STYLES.map((s) => s.style)

// Lista escrita à mão da união EditorialStyle. Se alguém adicionar um estilo
// na união e esquecer aqui (ou em CAROUSEL_STYLES), o TypeScript reclama em
// `_check` abaixo — e o teste de 1 a 1 reclama em runtime.
const UNIAO_EDITORIAL_STYLE = [
  "auto",
  "wesley",
  "brandsdecoded",
  "bolo",
  "mypostflow",
  "lookbook",
  "cinema",
  "estudio",
  "colagem",
  "cartaz",
  "agencia",
  "poster",
  "geometrico",
  "gradient",
  "minimal",
  "seamless",
  "cards",
  "perfil",
] as const satisfies readonly EditorialStyle[]

// Erro de TIPO se faltar algum membro da união na lista acima.
const _check: Record<EditorialStyle, true> = Object.fromEntries(
  UNIAO_EDITORIAL_STYLE.map((s) => [s, true]),
) as Record<(typeof UNIAO_EDITORIAL_STYLE)[number], true>
void _check

const PROIBIDOS = ["undefined", "NaN", "[object Object]", "backdrop-filter"]

// ---- Exceções por DESIGN (lidas no código dos estilos originais) ----------
// Estilos que não têm tag/categoria em slide nenhum: Revista (brandsdecoded)
// é capa de revista sem etiqueta; Perfil imita um post de rede social;
// Seamless usa contador "01 — 05" no lugar da tag.
const SEM_TAG: ReadonlySet<EditorialStyle> = new Set(["brandsdecoded", "perfil", "seamless"])
// Perfil: o título é um parágrafo uniforme (como um tweet) — no editor ele
// vira "Texto", não "Título". É assim de propósito.
const TITULO_COMO_PARAGRAFO: ReadonlySet<EditorialStyle> = new Set(["perfil"])
// Sem foto: Perfil simplesmente esconde a mídia; Seamless pinta um degradê
// no fundo. Nenhum dos dois mostra a caixa "IMAGEM".
const SEM_CAIXA_IMAGEM: ReadonlySet<EditorialStyle> = new Set(["perfil", "seamless"])

// ---- Bugs reais encontrados no código atual (ver tests/README.md) ----------
// Seamless (conteúdo): a foto é um <img> cru, sem data-edit="image" — no
// editor ela não pode ser selecionada nem reenquadrada (posição/zoom).
const FOTO_SEM_DATA_EDIT: ReadonlySet<EditorialStyle> = new Set(["seamless"])
// Vazamento de @ de exemplo: nenhum estilo pode mostrar "@perfil"/"@marca" em
// post pronto. O Perfil tinha esse bug e foi consertado em 24/10/2026.
const VAZA_ARROBA_EXEMPLO: ReadonlySet<EditorialStyle> = new Set([]) // "perfil" corrigido em 24/10

describe("catálogo de estilos (CAROUSEL_STYLES)", () => {
  it("a união EditorialStyle e o catálogo batem 1 a 1", () => {
    expect([...TODOS_OS_ESTILOS].sort()).toEqual([...UNIAO_EDITORIAL_STYLE].sort())
  })

  it("cada estilo tem id único", () => {
    expect(new Set(TODOS_OS_ESTILOS).size).toBe(TODOS_OS_ESTILOS.length)
  })

  it("cada estilo tem nome único e descrição preenchida", () => {
    const nomes = CAROUSEL_STYLES.map((s) => s.name.trim())
    expect(new Set(nomes).size).toBe(nomes.length)
    for (const s of CAROUSEL_STYLES) {
      expect(s.name.trim(), `nome vazio em ${s.style}`).not.toBe("")
      expect(s.desc.trim(), `descrição vazia em ${s.style}`).not.toBe("")
    }
  })
})

describe.each(TODOS_OS_ESTILOS)("estilo %s cumpre o contrato do slide", (estilo) => {
  const slides = carrosselPadrao()
  const htmls = renderCarrossel(slides, { estilo })
  const capa = htmls[0]
  const conteudo = htmls[1]
  const ultimo = htmls[4]

  it("a capa mostra o título", () => {
    expect(textoVisivel(capa)).toContain("Como a Nexus")
  })

  it("o slide de conteúdo mostra o título e o corpo", () => {
    const texto = textoVisivel(conteudo)
    expect(texto).toContain("Comece pelo problema")
    expect(texto).toContain("Quem fala do próprio produto")
  })

  const itTag = SEM_TAG.has(estilo) ? it.skip : it
  itTag("a chamada (cta_badge) aparece na capa ou no último slide", () => {
    const texto = `${textoVisivel(capa)} ${textoVisivel(ultimo)}`.toLowerCase()
    expect(texto).toMatch(/guia|chame a nexus/)
  })

  it("todo slide tem o título num nó editável", () => {
    for (const [i, html] of htmls.entries()) {
      const $ = abrir(html)
      if (TITULO_COMO_PARAGRAFO.has(estilo)) {
        // <p> vira data-edit="text" em runtime (ver editable-overrides.ts).
        const p = $("p").filter((_, el) => $(el).text().includes(slides[i].title.slice(0, 20)))
        expect(p.length, `slide ${i}`).toBeGreaterThan(0)
      } else {
        expect($('[data-edit="title"]').length, `slide ${i}`).toBeGreaterThan(0)
      }
    }
  })

  it("com foto, a capa tem foto editável ([data-edit=image])", () => {
    expect(abrir(capa)('img[data-edit="image"]').length).toBeGreaterThan(0)
  })

  const itFotoConteudo = FOTO_SEM_DATA_EDIT.has(estilo) ? it.todo : it
  itFotoConteudo("com foto, o slide de conteúdo tem foto editável ([data-edit=image])", () => {
    expect(abrir(conteudo)('img[data-edit="image"]').length).toBeGreaterThan(0)
  })

  it("sem foto, nenhuma URL de foto sobra no HTML", () => {
    const semFoto = slides.map((s) => ({ ...s, image: semImagem, extra_images: [] }))
    for (const h of renderCarrossel(semFoto, { estilo })) {
      expect(h).not.toContain("img.exemplo.test")
    }
  })

  const itCaixa = SEM_CAIXA_IMAGEM.has(estilo) ? it.skip : it
  itCaixa("sem foto, a capa mostra a caixa IMAGEM no lugar", () => {
    const html = renderSlide({ ...slides[0], image: semImagem }, 5, { estilo })
    expect(textoVisivel(html)).toContain("IMAGEM")
    expect(abrir(html)('[data-edit="image"]').length).toBeGreaterThan(0)
  })

  it("mostra o @ da marca quando existe", () => {
    expect(htmls.some((h) => textoVisivel(h).includes("@nexus"))).toBe(true)
  })

  it("esconde o @ quando é marcador de exemplo (@marca)", () => {
    const renders = renderCarrossel(slides, { estilo, handle: "@marca" })
    for (const h of renders) expect(textoVisivel(h)).not.toMatch(/@marca/i)
  })

  const itArroba = VAZA_ARROBA_EXEMPLO.has(estilo) ? it.todo : it
  itArroba("marca sem @ não mostra nenhum @ de exemplo (@perfil, @brand, @marca)", () => {
    const renders = renderCarrossel(slides, { estilo, handle: "" })
    for (const h of renders) expect(textoVisivel(h)).not.toMatch(/@(perfil|brand|marca)\b/i)
  })

  it("trocar o fundo muda a cor do slide", () => {
    const html = renderSlide({ ...slides[1], bg: "#123456" }, 5, { estilo })
    expect(html.toLowerCase()).toContain("#123456")
  })

  it("o HTML não contém lixo (undefined, NaN, [object Object], backdrop-filter)", () => {
    for (const [i, html] of htmls.entries()) {
      for (const p of PROIBIDOS) expect(html, `slide ${i}`).not.toContain(p)
    }
  })

  it("em formato stories o quadro vira 9/16", () => {
    const html = renderSlide(slides[0], 5, { estilo, format: "stories" })
    const wrapper = abrir(html)(".relative").first().children().first()
    expect(wrapper.attr("class")).toContain("aspect-[9/16]")
    // Em feed o mesmo wrapper NÃO força 9/16.
    const feed = abrir(capa)(".relative").first().children().first()
    expect(feed.attr("class") ?? "").not.toContain("9/16")
  })
})
