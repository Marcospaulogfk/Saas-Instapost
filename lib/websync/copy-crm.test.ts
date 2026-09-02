import { describe, expect, it } from "vitest"
import {
  temCopyPronta,
  lerCopyDoCrm,
  papelDoSlide,
  montarSlides,
  promptDaCapa,
  ORIGEM_FOTO_CRM,
} from "./copy-crm"

// Fixture real: description exatamente como o CRM grava (ver spec da feature
// "arte automática pela Ponte", 01/09/2026).
const DESCRICAO_YOUTUBE = `Banco do Nexus (N25) | carrossel | copy pronta, o Nexus so diagrama

Slide 1: O YouTube dobrou a régua pra você conseguir monetizar.
Slide 2: A partir de 1º de fevereiro de 2027, canal novo do YouTube vai precisar de 8 mil horas assistidas ou 20 milhões de visualizações em Shorts para monetizar. Fonte: YouTube Blog e TechCrunch, 10/08/2026.
Slide 3: Primeiro, as horas assistidas: Até fevereiro de 2027, um canal precisava juntar 4 mil horas assistidas em 12 meses para começar a monetizar vídeos longos. A partir dessa data a exigência sobe para 8 mil horas, e quem está começando agora só vê a primeira grana entrar bem mais tarde.
Slide 4: E os Shorts também: Quem apostava em vídeo curto tinha outra porta pra monetizar, 10 milhões de visualizações de Shorts em 90 dias. Essa marca também sobe para 20 milhões, e vale pra todo canal novo que tentar entrar pelo caminho rápido a partir de fevereiro.
Slide 5: Primeira mudança desde 2018: A régua de monetização do YouTube não mexe nesses dois números desde 2018, oito anos sem ajuste nas portas de entrada do programa de parceiros. É a maior revisão que o programa recebe desde que existe do jeito atual, e ela chega de uma vez, sem meio termo.
Slide 6: Quem ainda não monetiza tem até fevereiro pra entrar pela régua antiga, mas entre o anúncio e a data de corte sobram menos de seis meses de janela.
Slide 7: No YouTube, quem demora pra monetizar não perde a vaga, perde é a régua antiga.
Slide 8: Este carrossel saiu da Nexus Content em 3 minutos. Comenta NEXUS que eu te mando o acesso pra fazer o seu.

Legenda: O YouTube dobrou a régua de monetização pela primeira vez desde 2018: agora são 8 mil horas assistidas ou 20 milhões de visualizações em Shorts.

A mudança vale pra canal novo, a partir de 1º de fevereiro de 2027. Quem ainda não monetiza tem até lá pra entrar pela régua antiga.

Seu canal já bate a régua antiga, ou fevereiro vai pegar você no meio do caminho?
Este carrossel saiu da Nexus Content em 3 minutos.
Comenta NEXUS que eu te mando o acesso pra fazer o seu.
#youtube #monetizacao #youtubeshorts #criadordeconteudo
Fonte: YouTube Blog; TechCrunch, 10/08/2026`

describe("temCopyPronta", () => {
  it("reconhece a fixture do CRM", () => {
    expect(temCopyPronta(DESCRICAO_YOUTUBE)).toBe(true)
  })

  it("recusa description sem Slide", () => {
    expect(temCopyPronta("só um título qualquer\n\nLegenda: oi")).toBe(false)
  })

  it("recusa description sem Legenda", () => {
    expect(temCopyPronta("Slide 1: oi\nSlide 2: tchau")).toBe(false)
  })

  it("recusa null/undefined", () => {
    expect(temCopyPronta(null)).toBe(false)
    expect(temCopyPronta(undefined)).toBe(false)
  })
})

describe("lerCopyDoCrm", () => {
  const copy = lerCopyDoCrm(DESCRICAO_YOUTUBE)

  it("lê os 8 slides, ignorando o cabeçalho", () => {
    expect(copy).not.toBeNull()
    expect(copy!.slides).toHaveLength(8)
    expect(copy!.slides[0]).toBe(
      "O YouTube dobrou a régua pra você conseguir monetizar.",
    )
    expect(copy!.slides[7]).toBe(
      "Este carrossel saiu da Nexus Content em 3 minutos. Comenta NEXUS que eu te mando o acesso pra fazer o seu.",
    )
    // Nada do cabeçalho ("Banco do Nexus...") vazou pro primeiro slide.
    expect(copy!.slides[0]).not.toContain("Banco do Nexus")
  })

  it("lê a legenda com os 3 parágrafos + selo + convite + hashtags, sem a linha Fonte", () => {
    const legenda = copy!.legenda
    expect(legenda).toContain(
      "O YouTube dobrou a régua de monetização pela primeira vez desde 2018",
    )
    expect(legenda).toContain("A mudança vale pra canal novo")
    expect(legenda).toContain("Seu canal já bate a régua antiga")
    expect(legenda).toContain("Este carrossel saiu da Nexus Content em 3 minutos.")
    expect(legenda).toContain("Comenta NEXUS que eu te mando o acesso pra fazer o seu.")
    expect(legenda).toContain("#youtube #monetizacao #youtubeshorts #criadordeconteudo")
    // A linha de fonte é metadado, não faz parte da legenda.
    expect(legenda).not.toContain("Fonte:")
    // Parágrafos preservados (quebra em branco entre o 1º e o 2º bloco).
    expect(legenda).toContain(
      "8 mil horas assistidas ou 20 milhões de visualizações em Shorts.\n\nA mudança vale",
    )
    // Sem espaço/quebra sobrando nas pontas.
    expect(legenda.startsWith("O YouTube dobrou")).toBe(true)
    expect(legenda.endsWith("#criadordeconteudo")).toBe(true)
  })

  it("lê a fonte", () => {
    expect(copy!.fonte).toBe("YouTube Blog; TechCrunch, 10/08/2026")
  })

  it("devolve null pra description sem copy pronta", () => {
    expect(lerCopyDoCrm("sem nada disso aqui")).toBeNull()
    expect(lerCopyDoCrm(null)).toBeNull()
  })
})

describe("papelDoSlide", () => {
  it("segue a regra de posição num carrossel de 8", () => {
    expect(papelDoSlide(0, 8)).toBe("gancho")
    expect(papelDoSlide(1, 8)).toBe("fato_fonte")
    expect(papelDoSlide(2, 8)).toBe("argumento")
    expect(papelDoSlide(3, 8)).toBe("argumento")
    expect(papelDoSlide(4, 8)).toBe("argumento")
    expect(papelDoSlide(5, 8)).toBe("virada")
    expect(papelDoSlide(6, 8)).toBe("tese")
    expect(papelDoSlide(7, 8)).toBe("selo_convite")
  })
})

describe("montarSlides", () => {
  const copy = lerCopyDoCrm(DESCRICAO_YOUTUBE)!
  const semImagens = montarSlides(copy.slides, new Map())

  it("slide 1 (gancho, curto) vira título inteiro, sem corpo", () => {
    const s = semImagens[0]
    expect(s.title).toBe("O YouTube dobrou a régua pra você conseguir monetizar.")
    expect(s.body).toBe("")
    expect(s.order_index).toBe(0)
  })

  it("slide 2 (fato+fonte, longo) quebra na primeira frase", () => {
    const s = semImagens[1]
    expect(s.title).toBe(
      "A partir de 1º de fevereiro de 2027, canal novo do YouTube vai precisar de 8 mil horas assistidas ou 20 milhões de visualizações em Shorts para monetizar.",
    )
    expect(s.body).toBe("Fonte: YouTube Blog e TechCrunch, 10/08/2026.")
  })

  it("slide 3 (argumento) quebra em Título: corpo", () => {
    const s = semImagens[2]
    expect(s.title).toBe("Primeiro, as horas assistidas")
    expect((s.body ?? "").startsWith("Até fevereiro de 2027")).toBe(true)
  })

  it("cada slide sai com subtitle/highlight_words vazios e sem imagem", () => {
    for (const s of semImagens) {
      expect(s.subtitle).toBe("")
      expect(s.highlight_words).toEqual([])
      expect(s.image.url).toBeNull()
      expect(s.image.source).toBeNull()
      expect(s.image.attribution).toBeNull()
    }
  })

  it("imagem do slide 4 (1-based) entra no image.url do índice 3", () => {
    const imagens = new Map([[4, { url: "https://exemplo.com/foto-shorts.jpg" }]])
    const slides = montarSlides(copy.slides, imagens)
    expect(slides[3].image.url).toBe("https://exemplo.com/foto-shorts.jpg")
    expect(slides[3].image.source).toBe(ORIGEM_FOTO_CRM)
    expect(slides[3].image.attribution).toBeNull()
    // Os outros slides não recebem a foto por engano.
    expect(slides[0].image.url).toBeNull()
    expect(slides[2].image.url).toBeNull()
  })
})

describe("promptDaCapa", () => {
  it("monta o prompt em inglês com o gancho e o termo de busca", () => {
    const prompt = promptDaCapa("O YouTube dobrou a régua", "youtube studio dashboard")
    expect(prompt).toContain(
      'Realistic editorial photograph for an Instagram cover about: "O YouTube dobrou a régua".',
    )
    expect(prompt).toContain("Photographic subject: youtube studio dashboard.")
    expect(prompt).toContain("No text, no letters, no logos, no watermark, clean composition.")
  })

  it("sem termo de busca, omite a frase de sujeito", () => {
    const prompt = promptDaCapa("O YouTube dobrou a régua", null)
    expect(prompt).not.toContain("Photographic subject")
    expect(prompt).toContain(
      'Realistic editorial photograph for an Instagram cover about: "O YouTube dobrou a régua".',
    )
  })
})
