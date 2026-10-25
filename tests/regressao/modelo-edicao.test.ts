// Funções PURAS do modelo de edição e do carrossel que ainda não tinham teste.
// Nada aqui precisa de navegador: são contas, regras e textos.
//
// Fora daqui (precisam de DOM real, não dá pra testar sem navegador):
//   collectEditableNodes / applyElementOverrides / singleTextNode de
//   editable-overrides.ts. O que elas produzem é coberto pelo contrato dos
//   estilos (data-edit no HTML) e pelos testes visuais (outro agente).
import { describe, it, expect } from "vitest"
import {
  BLOCK_DESIGN_W,
  BLOCK_LIMIT,
  BLOCK_MIN_SIZE,
  BLOCK_TYPE_LABEL,
  clampBlock,
  createBlock,
  slideDesignHeight,
  type BlockType,
  type SlideBlock,
} from "@/components/carousel/slide-blocks"
import { EDITABLE_TYPE_LABEL } from "@/components/carousel/editable-overrides"
import {
  aberturaFraca,
  coverMentions,
  motivoRejeicaoCapa,
} from "@/lib/carousel/cover-guard"
import {
  classifyEntity,
  decideImagePolicy,
  enforceVeracity,
  fallbackScenePrompt,
  hasNegativeContext,
} from "@/lib/carousel/image-policy"
import { properNounCandidates } from "@/lib/carousel/extract-entities"

// ============================================================================
// Blocos livres (slide-blocks.ts)
// ============================================================================
const TIPOS: BlockType[] = ["heading", "text", "image", "pill", "shape", "divider", "brand"]
const OPTS = { slideH: 525, z: 3, accent: "#1668E3", onDark: true }

describe("blocos livres: criar um bloco novo", () => {
  it("o slide de feed tem 525 de altura e o stories 747", () => {
    expect(slideDesignHeight("feed")).toBe(525)
    expect(slideDesignHeight("stories")).toBe(747)
    expect(BLOCK_DESIGN_W).toBe(420)
  })

  it.each(TIPOS)("bloco %s nasce centralizado no slide, com o z pedido", (tipo) => {
    const b = createBlock(tipo, OPTS)
    expect(b.type).toBe(tipo)
    expect(b.z).toBe(3)
    expect(b.x).toBe(Math.round((BLOCK_DESIGN_W - b.w) / 2))
    expect(b.y).toBe(Math.round((OPTS.slideH - b.h) / 2))
    expect(b.w).toBeGreaterThanOrEqual(BLOCK_MIN_SIZE)
    // Inclusive o divisor: nascia com 10px (abaixo do mínimo de 16 que o
    // clampBlock impõe) e "pulava" de tamanho no primeiro arraste. Corrigido
    // em 24/10/2026: nasce já com BLOCK_MIN_SIZE.
    expect(b.h).toBeGreaterThanOrEqual(BLOCK_MIN_SIZE)
  })

  it("o divisor nasce já no tamanho mínimo e o clamp não o altera", () => {
    const d = createBlock("divider", OPTS)
    expect(d.h).toBe(BLOCK_MIN_SIZE)
    expect(clampBlock(d, 525).h).toBe(BLOCK_MIN_SIZE)
  })

  it("cada bloco ganha um id curto e único", () => {
    const ids = Array.from({ length: 200 }, () => createBlock("text", OPTS).id)
    expect(new Set(ids).size).toBe(200)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]{8}$/i)
  })

  it("o limite é de 12 blocos por slide (a trava fica no editor)", () => {
    expect(BLOCK_LIMIT).toBe(12)
  })

  it("todo tipo de bloco tem rótulo em português", () => {
    for (const t of TIPOS) expect(BLOCK_TYPE_LABEL[t]).toBeTruthy()
    expect(BLOCK_TYPE_LABEL.pill).toBe("Tag")
    expect(BLOCK_TYPE_LABEL.brand).toBe("Marca")
  })

  it("título e texto vêm brancos sobre fundo escuro e pretos sobre claro", () => {
    const escuro = createBlock("heading", OPTS)
    const claro = createBlock("text", { ...OPTS, onDark: false })
    expect(escuro).toMatchObject({
      text: "Seu título aqui",
      color: "#FFFFFF",
      size: 30,
      weight: 800,
      align: "center",
    })
    expect(claro).toMatchObject({ color: "#0A0A0F", size: 14, weight: 500, align: "left" })
  })

  it("a tag acompanha o fundo: escura no escuro, clara no claro", () => {
    expect(createBlock("pill", OPTS)).toMatchObject({ text: "Nova tag", variant: "dark" })
    expect(createBlock("pill", { ...OPTS, onDark: false })).toMatchObject({ variant: "light" })
  })

  it("forma e divisor nascem na cor de destaque da marca", () => {
    expect(createBlock("shape", OPTS)).toMatchObject({
      shape: "rect",
      fill: "#1668E3",
      radius: 16,
      opacity: 0.9,
    })
    expect(createBlock("divider", OPTS)).toMatchObject({ color: "#1668E3", thickness: 3 })
  })

  it("imagem nasce vazia (sem url), quadrada e arredondada", () => {
    expect(createBlock("image", OPTS)).toMatchObject({
      url: null,
      fit: "cover",
      radius: 12,
      w: 200,
      h: 200,
    })
  })

  it("bloco de marca usa nome e @ cadastrados", () => {
    const b = createBlock("brand", {
      ...OPTS,
      brand: { name: "Nexus Content", handle: "@nexus", initials: "NC" },
    })
    expect(b).toMatchObject({
      name: "Nexus Content",
      handle: "@nexus",
      initials: "NC",
      verified: true,
      showAvatar: true,
    })
  })

  it("bloco de marca SEM @ cadastrado fica com @ vazio (nunca '@marca')", () => {
    const b = createBlock("brand", OPTS)
    expect(b).toMatchObject({ name: "Sua marca", handle: "" })
  })
})

describe("blocos livres: manter o bloco dentro do slide", () => {
  const base = createBlock("text", OPTS)

  it("bloco arrastado pra fora pela esquerda/cima volta pra borda 0", () => {
    const b = clampBlock({ ...base, x: -80, y: -30 }, 525)
    expect(b.x).toBe(0)
    expect(b.y).toBe(0)
  })

  it("bloco arrastado pra fora pela direita/baixo encosta na borda", () => {
    const b = clampBlock({ ...base, x: 9999, y: 9999 }, 525)
    expect(b.x).toBe(BLOCK_DESIGN_W - base.w)
    expect(b.y).toBe(525 - base.h)
  })

  it("bloco não encolhe abaixo do mínimo nem cresce além do slide", () => {
    const pequeno = clampBlock({ ...base, w: 2, h: 1 }, 525)
    expect(pequeno.w).toBe(BLOCK_MIN_SIZE)
    expect(pequeno.h).toBe(BLOCK_MIN_SIZE)
    const gigante = clampBlock({ ...base, x: 0, y: 0, w: 5000, h: 5000 }, 525)
    expect(gigante.w).toBe(BLOCK_DESIGN_W)
    expect(gigante.h).toBe(525)
    expect(gigante.x).toBe(0)
    expect(gigante.y).toBe(0)
  })

  it("arredonda posição e tamanho pra inteiro e não perde os outros campos", () => {
    const b = clampBlock({ ...base, x: 10.4, y: 20.6, w: 100.5, h: 40.2 }, 525)
    expect([b.x, b.y, b.w, b.h]).toEqual([10, 21, 101, 40])
    expect(b.id).toBe(base.id)
    expect((b as SlideBlock & { text: string }).text).toBe((base as { text: string }).text)
  })

  it("no stories o limite de baixo é maior (747)", () => {
    const b = clampBlock({ ...base, y: 700 }, slideDesignHeight("stories"))
    expect(b.y).toBe(747 - base.h)
  })
})

describe("modelo de edição: rótulos dos elementos editáveis", () => {
  it("todo tipo editável tem rótulo em português pro painel", () => {
    expect(EDITABLE_TYPE_LABEL).toEqual({
      title: "Título",
      text: "Texto",
      badge: "Tag",
      image: "Imagem",
      meta: "Rodapé",
      block: "Bloco",
    })
  })
})

// ============================================================================
// Trava da capa (cover-guard.ts)
// ============================================================================
describe("trava da capa: a capa nomeia o assunto?", () => {
  it("aceita o nome completo", () => {
    expect(
      coverMentions("Marilia Pellegrini entre os 30 mais promissores", "Marilia Pellegrini"),
    ).toBe(true)
  })

  it("aceita só o sobrenome (ou qualquer palavra forte do nome)", () => {
    expect(coverMentions("Pellegrini entre os 30 mais promissores", "Marilia Pellegrini")).toBe(
      true,
    )
    expect(coverMentions("O Dragão volta em outubro", "A Casa do Dragão")).toBe(true)
  })

  it("ignora acentos e maiúsculas", () => {
    expect(coverMentions("O DRAGAO VOLTA", "A Casa do Dragão")).toBe(true)
  })

  it("palavras curtas e conectores do nome não contam (do, de, Ana)", () => {
    // "Ana" (3 letras) e "do" não bastam; só "Dragão"/"Casa" (4+ letras) contam.
    expect(coverMentions("A obra do ano", "A Casa do Dragão")).toBe(false)
    expect(coverMentions("Ana venceu de novo", "Ana Li")).toBe(false)
  })

  it("é tolerante de propósito: 'casa' (4 letras) do nome já conta", () => {
    expect(coverMentions("A casa do vizinho", "A Casa do Dragão")).toBe(true)
  })

  it("capa que não cita ninguém é rejeitada", () => {
    expect(
      coverMentions("Uma brasileira entre os 30 mais promissores do mundo", "Marilia Pellegrini"),
    ).toBe(false)
  })

  it("sem assunto definido, qualquer capa passa", () => {
    expect(coverMentions("Qualquer coisa", "")).toBe(true)
    expect(coverMentions("Qualquer coisa", "   ")).toBe(true)
  })
})

describe("trava da capa: aberturas que desperdiçam as primeiras palavras", () => {
  it.each([
    ["Você torceu pela vilã a temporada toda", "voce"],
    ["VOCÊ, sim, você", "voce"],
    ["Vc sabia disso?", "vc"],
    ["Se você tem um negócio local", "se voce"],
    ["Sabia que 70% desistem?", "sabia que"],
    ["Imagine acordar sem alarme", "imagine"],
    ["Muita gente erra isso", "muita gente"],
    ["E se o seu post fosse lido?", "e se"],
  ])("'%s' é abertura fraca (%s)", (titulo, esperado) => {
    expect(aberturaFraca(titulo)).toBe(esperado)
  })

  it("ignora emoji, aspas e pontuação no começo", () => {
    expect(aberturaFraca("“Você precisa ver isso”")).toBe("voce")
  })

  it("não confunde palavra que só COMEÇA igual (vocês, existencialismo)", () => {
    expect(aberturaFraca("Vocês já viram isso?")).toBeNull()
    expect(aberturaFraca("Existencialismo pra iniciantes")).toBeNull()
  })

  it("abertura boa passa", () => {
    expect(aberturaFraca("Marilia Pellegrini entre os 30 mais promissores")).toBeNull()
  })
})

describe("trava da capa: decisão final", () => {
  it("capa boa é aprovada (null)", () => {
    expect(
      motivoRejeicaoCapa(
        { title: "Marilia Pellegrini entre os 30 mais promissores" },
        "Marilia Pellegrini",
      ),
    ).toBeNull()
  })

  it("abertura fraca é o primeiro motivo, mesmo citando o assunto", () => {
    const m = motivoRejeicaoCapa({ title: "Você viu Marilia Pellegrini?" }, "Marilia Pellegrini")
    expect(m).toContain('abre com "voce"')
  })

  it("não citar o assunto é motivo de refazer", () => {
    const m = motivoRejeicaoCapa(
      { title: "Uma brasileira entre os 30 mais promissores" },
      "Marilia Pellegrini",
    )
    expect(m).toContain("não nomeia o sujeito")
    expect(m).toContain("Marilia Pellegrini")
  })

  it("capa com mais de 26 palavras não cabe no card", () => {
    const longa = Array.from({ length: 27 }, (_, i) => (i === 0 ? "Pellegrini" : "palavra")).join(
      " ",
    )
    const m = motivoRejeicaoCapa({ title: longa }, "Marilia Pellegrini")
    expect(m).toContain("27 palavras")
  })

  it("capa com exatamente 26 palavras ainda passa", () => {
    const limite = Array.from({ length: 26 }, (_, i) => (i === 0 ? "Pellegrini" : "palavra")).join(
      " ",
    )
    expect(motivoRejeicaoCapa({ title: limite }, "Marilia Pellegrini")).toBeNull()
  })

  it("sem assunto, só abertura e tamanho são checados", () => {
    expect(motivoRejeicaoCapa({ title: "Cinco erros ao precificar serviço" }, "")).toBeNull()
  })
})

// ============================================================================
// Política de imagem (image-policy.ts)
// ============================================================================
describe("política de imagem: contexto negativo", () => {
  it("detecta crime, fraude, morte, escândalo etc.", () => {
    expect(hasNegativeContext("Empresário é acusado de fraude")).toBe(true)
    expect(hasNegativeContext("Ator morreu aos 80 anos")).toBe(true)
    expect(hasNegativeContext("ESCÂNDALO no clube")).toBe(true)
  })

  it("texto neutro ou vazio não é negativo", () => {
    expect(hasNegativeContext("Arquiteta ganha prêmio internacional")).toBe(false)
    expect(hasNegativeContext("")).toBe(false)
  })
})

describe("política de imagem: que tipo de coisa é a entidade", () => {
  it("sem entidade → none", () => {
    expect(classifyEntity("")).toBe("none")
    expect(classifyEntity("   ")).toBe("none")
  })

  it("a dica explícita da IA manda (person/work/org/place)", () => {
    expect(classifyEntity("Qualquer Coisa", "place")).toBe("place")
    expect(classifyEntity("Tom Cruise", "WORK")).toBe("work")
    expect(classifyEntity("Tom Cruise", "org")).toBe("org")
  })

  it("dica desconhecida é ignorada e cai na regra automática", () => {
    expect(classifyEntity("Tom Cruise", "robot")).toBe("person")
  })

  it("marcador de empresa (Ltda, S.A., Studio, Revista) → org", () => {
    expect(classifyEntity("Nexus Ltda")).toBe("org")
    expect(classifyEntity("Revista Wallpaper")).toBe("org")
    expect(classifyEntity("Acme S.A.")).toBe("org")
  })

  it("duas ou mais palavras capitalizadas → pessoa (o caso de maior risco)", () => {
    expect(classifyEntity("Marilia Pellegrini")).toBe("person")
    expect(classifyEntity("Ágatha Moreira")).toBe("person")
  })

  it("palavra solta ou minúscula → obra/coisa", () => {
    expect(classifyEntity("Oscar")).toBe("work")
    expect(classifyEntity("casa de praia")).toBe("work")
  })
})

describe("política de imagem: decidir a família da imagem", () => {
  it("pessoa real → retrato com trava de rosto ligada", () => {
    expect(decideImagePolicy({ entity: "Tom Cruise", text: "x" })).toEqual({
      family: "portrait",
      entity: "Tom Cruise",
      entityKind: "person",
      namesRealPerson: true,
    })
  })

  it("sem entidade → objeto simbólico", () => {
    expect(decideImagePolicy({ entity: null, text: "x" }).family).toBe("object")
    expect(decideImagePolicy({ text: "x" }).namesRealPerson).toBe(false)
  })

  it("obra, empresa ou lugar → cena", () => {
    expect(
      decideImagePolicy({ entity: "Museu do Ipiranga", entityKind: "place", text: "x" }).family,
    ).toBe("scene")
    expect(decideImagePolicy({ entity: "Nexus Ltda", text: "x" }).family).toBe("scene")
  })

  it("espaços em volta da entidade são removidos", () => {
    expect(decideImagePolicy({ entity: "  Oscar  ", text: "x" }).entity).toBe("Oscar")
  })
})

describe("política de imagem: trava de veracidade no prompt", () => {
  const prompt = "Editorial photo of a modern building at dusk"

  it("sempre acrescenta os negativos anti-banco-de-imagem", () => {
    const out = enforceVeracity(prompt, { namesRealPerson: false, hasVerifiedPhoto: false })
    expect(out).toContain("Negative: stock photo")
    expect(out).not.toContain("no human face")
  })

  it("pessoa real SEM foto verificada → proíbe rosto", () => {
    const out = enforceVeracity(prompt, { namesRealPerson: true, hasVerifiedPhoto: false })
    expect(out).toContain("no human face")
  })

  it("pessoa real COM foto verificada → rosto liberado", () => {
    const out = enforceVeracity(prompt, { namesRealPerson: true, hasVerifiedPhoto: true })
    expect(out).not.toContain("no human face")
  })

  it("contexto negativo proíbe rosto mesmo sem pessoa nomeada", () => {
    const out = enforceVeracity(prompt, {
      namesRealPerson: false,
      hasVerifiedPhoto: false,
      text: "Empresa pede falência",
    })
    expect(out).toContain("no human face")
  })

  it("prompt que já tem 'Negative:' ganha os termos na mesma seção, sem abrir outra", () => {
    const out = enforceVeracity(`${prompt}. Negative: blurry.`, {
      namesRealPerson: true,
      hasVerifiedPhoto: false,
    })
    expect(out.match(/Negative:/g)?.length).toBe(1)
    expect(out).toContain("blurry, stock photo")
    expect(out.endsWith(".")).toBe(true)
  })

  it("prompt vazio continua vazio", () => {
    expect(enforceVeracity("", { namesRealPerson: true, hasVerifiedPhoto: false })).toBe("")
  })
})

describe("política de imagem: prompt de última instância", () => {
  it("usa o assunto e proíbe gente na cena", () => {
    const p = fallbackScenePrompt("a sede da Nexus")
    expect(p).toContain("Editorial photograph of a sede da Nexus")
    expect(p).toContain("no people in frame")
    expect(p).toContain("no human face")
  })

  it("sem assunto, descreve 'the subject of the article'", () => {
    expect(fallbackScenePrompt("")).toContain("the subject of the article")
  })
})

// ============================================================================
// Nomes próprios no texto (extract-entities.ts)
// ============================================================================
describe("nomes de pessoa no texto do slide", () => {
  it("acha nome + sobrenome", () => {
    expect(properNounCandidates("Tom Cruise está correndo pro Oscar")).toEqual(["Tom Cruise"])
  })

  it("palavra solta capitalizada e sigla não contam (Oscar, IMAX, IA)", () => {
    expect(properNounCandidates("O Oscar vai pro IMAX com IA")).toEqual([])
  })

  it("mantém conectores no meio do nome (da, van)", () => {
    expect(properNounCandidates("A obra de Maria da Silva encanta")).toEqual(["Maria da Silva"])
    expect(properNounCandidates("O quadro de Vincent van Gogh foi vendido")).toEqual([
      "Vincent van Gogh",
    ])
  })

  it("palavra capitalizada no início da frase gruda no nome via conector (limitação)", () => {
    // "Quadro" começa a frase em maiúscula e "de" é conector → vira parte do nome.
    expect(properNounCandidates("Quadro de Vincent van Gogh vendido")).toEqual([
      "Quadro de Vincent van Gogh",
    ])
  })

  it("'e' entre dois nomes junta os dois num candidato só (limitação conhecida)", () => {
    expect(properNounCandidates("Maria da Silva e Vincent van Gogh")).toEqual([
      "Maria da Silva e Vincent van Gogh",
    ])
  })

  it("tira conector pendurado no fim ('Tom Cruise e' → 'Tom Cruise')", () => {
    expect(properNounCandidates("Tom Cruise e outros atores")).toEqual(["Tom Cruise"])
  })

  it("prefere o nome de gente a prêmio/instituição com ano", () => {
    const r = properNounCandidates(
      "A Wallpaper escolheu Marilia Pellegrini pro Architects' Directory 2026",
    )
    expect(r[0]).toBe("Marilia Pellegrini")
  })

  it("não repete o mesmo nome e respeita o máximo", () => {
    const texto =
      "Tom Cruise encontra Brad Pitt. Tom Cruise sorri. Ana Maria Braga chega. Pedro Alves sai."
    const r = properNounCandidates(texto)
    expect(r).toHaveLength(3)
    expect(new Set(r).size).toBe(3)
    expect(properNounCandidates(texto, 1)).toHaveLength(1)
  })

  it("limpa pontuação grudada no nome", () => {
    expect(properNounCandidates('"Tom Cruise", disse ela.')).toEqual(["Tom Cruise"])
  })

  it("texto vazio ou nulo não quebra", () => {
    expect(properNounCandidates("")).toEqual([])
    expect(properNounCandidates(undefined as unknown as string)).toEqual([])
  })
})
