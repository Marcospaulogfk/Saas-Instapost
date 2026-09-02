import type { PreviewSlide } from "@/components/carousel/slide-preview"

// =====================================================================
// Leitura da copy que o CRM (WebSync-OS) já mandou PRONTA na `description`
// da pauta (a Ponte, regra de negócio D11 — 01/09/2026).
//
// Módulo PURO de propósito: nenhuma chamada de I/O aqui, só parsing de
// texto. Quem lê banco, Storage ou Fal é `lib/websync/gerar-arte.ts`. Isso
// é o que deixa este arquivo 100% testável sem mockar Supabase.
//
// O contrato de formato é do CRM, não nosso — ele escreve a description
// assim (ver fixture no CLAUDE.md/spec da feature):
//
//   Título | formato | observação
//
//   Slide 1: texto do slide 1
//   Slide 2: texto do slide 2
//   ...
//
//   Legenda: texto da legenda, pode ter
//
//   vários parágrafos
//   #hashtags #no fim
//   Fonte: linha de fonte, quando existe
//
// O Nexus SÓ DIAGRAMA essa copy — não reescreve texto com IA. Ver a regra
// D11 no CONTEXT do CRM.
// =====================================================================

/** Copy pronta lida da pauta, antes de virar slides diagramados. */
export interface CopyDoCrm {
  /** Um item por "Slide N:", já ordenado por N. */
  slides: string[]
  /** Texto da legenda, parágrafos preservados (quebras em branco intactas). */
  legenda: string
  /** Linha "Fonte: ..." quando o CRM mandou. null quando não veio. */
  fonte: string | null
}

/**
 * Marcadores de fim de bloco de legenda — tudo que vem depois de "Legenda:"
 * até a primeira linha que comece com um destes é o corpo da legenda; da
 * primeira em diante é metadado (fonte, trilha, variação de gancho, foto por
 * slide manual). A lista replica o que o CRM já escreve nessas peças —
 * mudar aqui sem mudar lá quebra a leitura silenciosamente.
 */
const FIM_DE_LEGENDA_RE =
  /^(Fonte:|Musica:|Gancho alternativo:|Imagem slide|Busca slide|Miniatura da arte:)/m

/** `true` quando a pauta chegou com copy pronta do CRM (regra D11). */
export function temCopyPronta(descricao: string | null | undefined): boolean {
  if (!descricao) return false
  return /^Slide \d+:/m.test(descricao) && descricao.includes("Legenda:")
}

/**
 * Lê a copy pronta da `description` da pauta. `null` quando o formato não
 * bate (sem "Slide N:" ou sem "Legenda:") — mesma condição de
 * `temCopyPronta`, então os callers checam uma vez e confiam na outra.
 */
export function lerCopyDoCrm(descricao: string | null | undefined): CopyDoCrm | null {
  if (!temCopyPronta(descricao)) return null
  const texto = descricao as string

  // Cada "Slide N:" no início de linha marca o começo de um bloco; o bloco
  // vai até o próximo "Slide" ou até "Legenda:", o que vier primeiro. O
  // cabeçalho antes do primeiro Slide (título | formato | observação) fica
  // de fora só por não estar dentro de nenhum bloco.
  const cabecalhos = [...texto.matchAll(/^Slide (\d+):[ \t]*/gm)]
  if (cabecalhos.length === 0) return null

  const legendaMatch = /^Legenda:[ \t]*/m.exec(texto)
  if (!legendaMatch) return null

  const numerados: Array<{ n: number; corpo: string }> = cabecalhos.map(
    (m, i) => {
      const inicio = (m.index ?? 0) + m[0].length
      const proximoSlide = cabecalhos[i + 1]?.index ?? Infinity
      const fim = Math.min(
        proximoSlide,
        legendaMatch.index >= inicio ? legendaMatch.index : Infinity,
      )
      return {
        n: Number(m[1]),
        corpo: texto.slice(inicio, fim === Infinity ? texto.length : fim).trim(),
      }
    },
  )
  numerados.sort((a, b) => a.n - b.n)
  const slides = numerados.map((s) => s.corpo).filter(Boolean)
  if (slides.length === 0) return null

  // Legenda: do fim do cabeçalho "Legenda:" até o primeiro marcador de
  // metadado (ou fim do texto). `.trim()` só tira as pontas — os parágrafos
  // internos (linhas em branco) sobrevivem, é isso que o editor precisa pra
  // não colar frase em frase.
  const legStart = legendaMatch.index + legendaMatch[0].length
  const resto = texto.slice(legStart)
  const fimMetadado = FIM_DE_LEGENDA_RE.exec(resto)
  const legenda = (
    fimMetadado ? resto.slice(0, fimMetadado.index) : resto
  ).trim()

  const fonteMatch = /^Fonte:[ \t]*(.*)$/m.exec(texto)
  const fonte = fonteMatch ? fonteMatch[1].trim() || null : null

  return { slides, legenda, fonte }
}

/** Papel do slide pela POSIÇÃO — mesma regra que o CRM usa pra escrever a copy. */
export type PapelSlide =
  | "gancho"
  | "fato_fonte"
  | "argumento"
  | "virada"
  | "tese"
  | "selo_convite"

/**
 * índice 0 = gancho, 1 = fato + fonte, último = selo + convite,
 * penúltimo = tese, antepenúltimo = virada, todo o resto = argumento.
 * Checa as posições fixas (0, 1, último) antes das relativas por segurança
 * em carrosséis curtos — não é o caso comum, mas não custa a ordem certa.
 */
export function papelDoSlide(i: number, total: number): PapelSlide {
  if (i === 0) return "gancho"
  if (i === total - 1) return "selo_convite"
  if (i === total - 2) return "tese"
  if (i === total - 3) return "virada"
  if (i === 1) return "fato_fonte"
  return "argumento"
}

/** Índice (0-based) até onde o prefixo "Título: " de um argumento pode ir. */
const LIMITE_PREFIXO_ARGUMENTO = 48

/**
 * Quebra um slide "argumento" no formato `Título: corpo` — só quando o
 * `: ` aparece dentro do limite (senão não é título, é uma frase comprida
 * que por acaso tem dois-pontos no meio).
 */
function quebraArgumento(texto: string): { title: string; body: string } | null {
  const idx = texto.indexOf(": ")
  if (idx === -1 || idx > LIMITE_PREFIXO_ARGUMENTO) return null
  return { title: texto.slice(0, idx), body: texto.slice(idx + 2) }
}

/**
 * Quebra pela primeira frase: corta no primeiro `. ` ou `: ` que deixe as
 * duas partes não vazias. Sem quebra decente (texto sem pontuação de meio de
 * frase), o título vira o texto inteiro — mesmo desfecho do caso ≤140.
 */
function quebraPrimeiraFrase(texto: string): { title: string; body: string } {
  const re = /[.:] /g
  let m: RegExpExecArray | null
  while ((m = re.exec(texto))) {
    const corte = m.index + 1 // logo depois do ponto/dois-pontos
    const title = texto.slice(0, corte).trim()
    const body = texto.slice(corte + 1).trim()
    if (title && body) return { title, body }
  }
  return { title: texto.trim(), body: "" }
}

const LIMITE_TITULO_INTEIRO = 140

/** Foto que o CRM já escolheu pra um slide, indexada por número de slide (1-based). */
export type ImagemPorSlide = Map<number, { url: string }>

/**
 * `source` de uma foto que chegou pronta do CRM (não veio do Unsplash nem
 * foi gerada aqui). `attribution: null` some com o rodapé "Foto: X / Unsplash"
 * (ver `Attribution` em editorial-shared.tsx — ele só renderiza esse texto
 * fixo, hardcoded pro Unsplash; colocar 'unsplash' aqui pintaria um crédito
 * inventado). 'wikimedia' é o rótulo mais honesto: é uma foto real, só que
 * sem o rastro de crédito que o Unsplash exige.
 */
export const ORIGEM_FOTO_CRM = "wikimedia" as const

/**
 * Monta os `PreviewSlide[]` que o editor de carrossel lê, a partir da copy
 * já pronta do CRM. Não reescreve nenhum texto — só decide título/corpo e
 * encaixa a foto (quando o CRM mandou uma pro slide).
 */
export function montarSlides(
  slidesTexto: string[],
  imagens: ImagemPorSlide,
): PreviewSlide[] {
  const total = slidesTexto.length
  return slidesTexto.map((texto, i) => {
    const papel = papelDoSlide(i, total)
    const quebra =
      (papel === "argumento" ? quebraArgumento(texto) : null) ??
      (texto.length <= LIMITE_TITULO_INTEIRO
        ? { title: texto, body: "" }
        : quebraPrimeiraFrase(texto))

    const foto = imagens.get(i + 1) // imagens[].slide é 1-based

    return {
      order_index: i,
      title: quebra.title,
      body: quebra.body,
      subtitle: "",
      highlight_words: [],
      image: {
        url: foto?.url ?? null,
        source: foto ? ORIGEM_FOTO_CRM : null,
        attribution: null,
        error: null,
      },
    }
  })
}

/**
 * Prompt (em inglês, mesmo padrão dos outros geradores editoriais) pra
 * `generateEditorialImageForRole(..., 'cover')`. `termoBusca` é a `buscas`
 * do slide 1 que o CRM mandou; sem ele, o prompt fica só com o gancho.
 */
export function promptDaCapa(gancho: string, termoBusca: string | null): string {
  const sujeito = termoBusca
    ? ` Photographic subject: ${termoBusca}.`
    : ""
  return (
    `Realistic editorial photograph for an Instagram cover about: "${gancho}".` +
    `${sujeito} No text, no letters, no logos, no watermark, clean composition.`
  )
}
