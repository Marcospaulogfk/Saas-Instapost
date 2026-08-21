/**
 * Busca imagem real de uma entidade (empresa, pessoa, marca, lugar).
 * Grátis, sem API key, imagens com licença aberta.
 *
 * Estratégia em cascata:
 *  1. Wikidata: logo oficial (P154) → senão imagem (P18). Pega logos de empresa
 *     que a API de "pageimages" da Wikipedia exclui por serem non-free/infobox.
 *  2. Wikipedia (pageimages): foto principal da página. Bom pra pessoas, lugares,
 *     produtos e empresas com foto livre (ex: SpaceX → Starbase).
 *
 * Logos vêm como SVG no Commons; rasterizamos pra PNG via imageinfo (iiurlwidth).
 *
 * ⚠️ VALIDAÇÃO DE IDENTIDADE (regra de veracidade R2)
 * A busca estrita passa por `labelMatchesQuery`: o nome que voltou tem que ser o
 * nome que foi pedido. Sem isso, `wbsearchentities` com limit=1 devolvia o
 * primeiro palpite e a busca full-text da Wikipedia devolvia qualquer artigo que
 * contivesse os tokens — foi assim que um post sobre a arquiteta Marilia
 * Pellegrini (que não tem verbete) recebeu a foto de outra pessoa, e um post
 * único recebeu o pôster da novela "Terra e Paixão" como fundo.
 */

export interface WikimediaResult {
  url: string
  title: string
  sourcePage: string
  width: number
  height: number
  ms: number
}

const USER_AGENT = "NexusContentBot/1.0 (https://syncpost.app; contato@syncpost.app)"
const TIMEOUT = 10_000

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

// =============================================================================
// Validação de identidade — o nome que voltou é o nome que foi pedido?
// =============================================================================

/** minúsculas, sem acento, sem pontuação, espaços colapsados. */
function normalizeName(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(new RegExp("[\u0300-\u036f]", "g"), "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Partículas que não contam como "palavra do nome" na comparação. */
const NAME_STOPWORDS = new Set([
  "de", "da", "do", "dos", "das", "e", "di", "del", "della",
  "van", "von", "of", "the", "la", "le", "el", "y",
])

function nameTokens(s: string): string[] {
  return normalizeName(s)
    .split(" ")
    .filter((t) => t.length > 1 && !NAME_STOPWORDS.has(t))
}

/**
 * O label (ou algum alias) corresponde à query?
 * Critério: igualdade normalizada, OU o label contém TODOS os tokens
 * significativos da query (assim "Anitta" casa com "Anitta (cantora)" e
 * "Tom Cruise" casa com "Thomas Cruise Mapother IV" só se os dois tokens
 * aparecerem). Nome parcial não passa: "Marilia Pellegrini" NÃO casa com
 * "Marília Mendonça" nem com um artigo qualquer que apenas cite "Marilia".
 */
export function labelMatchesQuery(
  label: string,
  query: string,
  aliases: string[] = [],
): boolean {
  const q = normalizeName(query)
  if (!q) return false
  const qt = nameTokens(query)
  const candidates = [label, ...aliases].filter(Boolean)

  for (const c of candidates) {
    const l = normalizeName(c)
    if (!l) continue
    if (l === q) return true
    if (!qt.length) continue
    const lt = new Set(nameTokens(c))
    if (qt.every((t) => lt.has(t))) return true
  }
  return false
}

// =============================================================================
// Commons — resolve nome de arquivo pra URL PNG rasterizada
// =============================================================================

async function commonsThumb(
  fileName: string,
  width = 1080,
): Promise<{ url: string; width: number; height: number } | null> {
  const api = new URL("https://commons.wikimedia.org/w/api.php")
  api.searchParams.set("action", "query")
  api.searchParams.set("format", "json")
  api.searchParams.set("titles", `File:${fileName}`)
  api.searchParams.set("prop", "imageinfo")
  api.searchParams.set("iiprop", "url|size")
  api.searchParams.set("iiurlwidth", String(width))
  api.searchParams.set("origin", "*")

  const data = await getJson<{
    query?: {
      pages?: Record<
        string,
        { imageinfo?: Array<{ thumburl?: string; url?: string; thumbwidth?: number; thumbheight?: number }> }
      >
    }
  }>(api.toString())

  const pages = data?.query?.pages
  if (!pages) return null
  for (const page of Object.values(pages)) {
    const ii = page.imageinfo?.[0]
    const url = ii?.thumburl || ii?.url
    if (url) {
      return {
        url,
        width: ii?.thumbwidth ?? width,
        height: ii?.thumbheight ?? width,
      }
    }
  }
  return null
}

// =============================================================================
// Wikidata — logo (P154) ou imagem (P18) de uma entidade
// =============================================================================

interface WikidataCandidate {
  photo: string | null
  logo: string | null
  label: string
  /** descrição curta do item ("building in Lagos, Portugal") — usada pra
   *  descartar homônimo de outro domínio/país. */
  description: string
  sourcePage: string
  isHuman: boolean
  /** o label bateu com a query pedida (validação de identidade) */
  labelMatched: boolean
}

/**
 * Nome igual não é a mesma coisa. "Casa das Palmeiras" bate com um palacete em
 * Lagos, Portugal — e com a casa em Alphaville de um artigo brasileiro. A
 * checagem de label sozinha deixa passar homônimo; esta função compara a
 * DESCRIÇÃO do item (tirando as palavras do próprio nome, que sempre batem)
 * contra o contexto do post.
 *
 * ⚠️ Ausência de descrição REPROVA quando há contexto pra checar.
 * A tentação é aceitar ("não dá pra reprovar por falta de dado"), mas o
 * pipeline automático não tem quem revise: sem evidência de que é a coisa
 * certa, a imagem entra por sorte. E o artigo "Casa das Palmeiras" da
 * Wikipedia lusófona — o palacete português — não tem descrição nenhuma.
 * Degradar de família é seguro; degradar de precisão não é.
 */
function descriptionFitsContext(
  description: string,
  query: string,
  context: string,
): boolean {
  const ctx = new Set(nameTokens(context))
  // Sem contexto não há o que julgar — quem chamou não pediu a checagem.
  if (!ctx.size) return true

  const queryTokens = new Set(nameTokens(query))
  // Descrição vazia, ou que só repete o nome, não prova identidade nenhuma.
  const distinctive = nameTokens(description).filter((t) => !queryTokens.has(t))
  if (!distinctive.length) return false

  return distinctive.some((t) => ctx.has(t))
}

async function wikidataCandidates(
  query: string,
  opts: { strict?: boolean } = {},
): Promise<WikidataCandidate | null> {
  // 1. Acha o QID da entidade. limit=5 (era 1): com um resultado só não dá pra
  //    escolher o que REALMENTE corresponde ao nome pedido.
  const search = new URL("https://www.wikidata.org/w/api.php")
  search.searchParams.set("action", "wbsearchentities")
  search.searchParams.set("search", query)
  search.searchParams.set("language", "pt")
  search.searchParams.set("uselang", "pt")
  search.searchParams.set("type", "item")
  search.searchParams.set("limit", "5")
  search.searchParams.set("format", "json")
  search.searchParams.set("origin", "*")

  const searchData = await getJson<{
    search?: Array<{
      id: string
      label?: string
      description?: string
      aliases?: string[]
      concepturi?: string
    }>
  }>(search.toString())

  const hits = searchData?.search ?? []
  if (!hits.length) return null

  // Prefere o primeiro hit cujo label/alias corresponda ao nome pedido.
  const matched = hits.find((h) =>
    labelMatchesQuery(h.label ?? "", query, h.aliases ?? []),
  )
  // Em modo estrito, sem correspondência = sem entidade. Nada de chutar o primeiro.
  if (!matched && opts.strict) return null
  const hit = matched ?? hits[0]

  // 2. Pega todas as claims da entidade numa chamada (P31 instance-of, P154 logo, P18 imagem).
  const entUrl = new URL("https://www.wikidata.org/w/api.php")
  entUrl.searchParams.set("action", "wbgetentities")
  entUrl.searchParams.set("ids", hit.id)
  entUrl.searchParams.set("props", "claims")
  entUrl.searchParams.set("format", "json")
  entUrl.searchParams.set("origin", "*")

  const ent = await getJson<{
    entities?: Record<
      string,
      {
        claims?: Record<
          string,
          Array<{ mainsnak?: { datavalue?: { value?: string | { id?: string } } } }>
        >
      }
    >
  }>(entUrl.toString())

  const claims = ent?.entities?.[hit.id]?.claims
  if (!claims) return null

  const fileOf = (prop: string): string | null => {
    const v = claims[prop]?.[0]?.mainsnak?.datavalue?.value
    return typeof v === "string" ? v : null
  }

  // P31 = instance-of. Q5 = ser humano. Usado pela rede de segurança pra só
  // puxar foto real quando a entidade extraída do texto é REALMENTE uma pessoa
  // (evita puxar foto de lugar/conceito fora de contexto).
  const instanceOf = (claims["P31"] ?? [])
    .map((c) => {
      const v = c.mainsnak?.datavalue?.value
      return typeof v === "object" && v ? v.id : undefined
    })
    .filter((id): id is string => Boolean(id))

  // P18 = foto/imagem; P154 = logo. Devolve os dois candidatos e deixa a cascata
  // decidir — foto SEMPRE antes de logo (logo full-bleed fica recortado/feio).
  return {
    photo: fileOf("P18"),
    logo: fileOf("P154"),
    label: hit.label ?? query,
    description: hit.description ?? "",
    sourcePage: hit.concepturi ?? `https://www.wikidata.org/wiki/${hit.id}`,
    isHuman: instanceOf.includes("Q5"),
    labelMatched: Boolean(matched),
  }
}

// =============================================================================
// Wikipedia — foto principal da página (pageimages)
// =============================================================================

interface WikiPage {
  title?: string
  fullurl?: string
  original?: { source: string; width: number; height: number }
  /** descrição curta vinda do Wikidata (wbptterms) — usada contra homônimo. */
  terms?: { description?: string[] }
}

async function queryWikipedia(
  lang: string,
  query: string,
  opts: { requireTitleMatch?: boolean; context?: string } = {},
): Promise<WikimediaResult | null> {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`)
  url.searchParams.set("action", "query")
  url.searchParams.set("format", "json")
  url.searchParams.set("generator", "search")
  url.searchParams.set("gsrsearch", query)
  // 5 (era 1) pra conseguir escolher a página cujo TÍTULO bate com a query.
  url.searchParams.set("gsrlimit", "5")
  url.searchParams.set("prop", "pageimages|info|pageterms")
  url.searchParams.set("piprop", "original")
  url.searchParams.set("inprop", "url")
  // descrição curta do Wikidata: é ela que denuncia o homônimo
  url.searchParams.set("wbptterms", "description")
  url.searchParams.set("origin", "*")

  const data = await getJson<{
    query?: { pages?: Record<string, WikiPage> }
  }>(url.toString())

  const pages = data?.query?.pages
  if (!pages) return null
  for (const page of Object.values(pages)) {
    if (!page.original?.source) continue
    // Busca full-text sem checar o título é como se pegava a foto errada:
    // qualquer artigo que contenha os tokens virava "a foto da entidade".
    if (opts.requireTitleMatch && !labelMatchesQuery(page.title ?? "", query)) {
      continue
    }
    // Título idêntico não basta: existe um artigo "Casa das Palmeiras" sobre um
    // palacete em Lagos, Portugal. A descrição é o que separa do assunto do post.
    if (
      opts.context &&
      !descriptionFitsContext(page.terms?.description?.[0] ?? "", query, opts.context)
    ) {
      continue
    }
    return {
      url: page.original.source,
      title: page.title ?? query,
      sourcePage:
        page.fullurl ??
        `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title ?? query)}`,
      width: page.original.width,
      height: page.original.height,
      ms: 0,
    }
  }
  return null
}

// =============================================================================
// Cascata pública
// =============================================================================

/**
 * Busca LARGA — devolve o melhor palpite mesmo sem correspondência exata de nome.
 * Use SÓ quando um humano digitou a query e vai ver o resultado antes de aceitar
 * (busca manual no editor). NUNCA use em pipeline automático: é ela que produz
 * "foto de outra pessoa" quando a entidade não existe na enciclopédia.
 */
export async function searchWikimedia(
  query: string,
): Promise<WikimediaResult | null> {
  const cleaned = query.trim()
  if (cleaned.length < 2) return null

  const start = performance.now()
  const wd = await wikidataCandidates(cleaned)
  const finish = (r: WikimediaResult): WikimediaResult => {
    r.ms = performance.now() - start
    return r
  }

  // 1. FOTO real da entidade (Wikidata P18) — enche o frame, bom full-bleed.
  if (wd?.photo) {
    const t = await commonsThumb(wd.photo)
    if (t)
      return finish({
        url: t.url,
        title: wd.label,
        sourcePage: wd.sourcePage,
        width: t.width,
        height: t.height,
        ms: 0,
      })
  }

  // 2. Foto principal da página (pessoas, lugares, produtos).
  let result = await queryWikipedia("pt", cleaned)
  if (!result) result = await queryWikipedia("en", cleaned)
  if (result) return finish(result)

  // 3. ÚLTIMO recurso: logo (Wikidata P154) — só quando não há foto nenhuma.
  if (wd?.logo) {
    const t = await commonsThumb(wd.logo)
    if (t)
      return finish({
        url: t.url,
        title: wd.label,
        sourcePage: wd.sourcePage,
        width: t.width,
        height: t.height,
        ms: 0,
      })
  }

  return null
}

/**
 * Busca ESTRITA — é a que o pipeline automático deve usar.
 * Só devolve imagem quando o nome que voltou corresponde ao nome pedido e a
 * imagem tem cara de foto. Não existe "quase isso": se não bate, devolve null e
 * quem chamou degrada de família (pessoa → obra → objeto → capa tipográfica).
 *
 * `requireHuman` liga a trava de veracidade: para uma entidade declarada como
 * PESSOA, ou é a foto real dela (P31=Q5 + P18), ou não é foto nenhuma.
 */
export async function searchWikimediaEntity(
  query: string,
  opts: {
    requireHuman?: boolean
    allowLogo?: boolean
    /** Texto do post — descarta homônimo de outro domínio/país. */
    context?: string
  } = {},
): Promise<WikimediaResult | null> {
  const cleaned = query.trim()
  if (cleaned.length < 3) return null

  const start = performance.now()
  const wd = await wikidataCandidates(cleaned, { strict: true })

  // Homônimo: nome idêntico, coisa diferente. Só checa quando quem chamou
  // mandou contexto — sem contexto não dá pra julgar.
  const contextOk =
    !opts.context ||
    !wd ||
    descriptionFitsContext(wd.description, cleaned, opts.context)

  if (wd?.labelMatched && contextOk) {
    if (opts.requireHuman && !wd.isHuman) return null

    if (wd.photo) {
      const t = await commonsThumb(wd.photo)
      if (t && isUsablePhoto(t.width, t.height)) {
        return {
          url: t.url,
          title: wd.label,
          sourcePage: wd.sourcePage,
          width: t.width,
          height: t.height,
          ms: performance.now() - start,
        }
      }
    }

    // Logo só quando quem chamou pediu explicitamente (marca/empresa).
    if (opts.allowLogo && wd.logo) {
      const t = await commonsThumb(wd.logo)
      if (t) {
        return {
          url: t.url,
          title: wd.label,
          sourcePage: wd.sourcePage,
          width: t.width,
          height: t.height,
          ms: performance.now() - start,
        }
      }
    }
  }

  // Pessoa sem P18 não vira foto de página homônima — para aqui.
  if (opts.requireHuman) return null

  // Página da Wikipedia cujo TÍTULO corresponde ao nome pedido (obra, lugar,
  // produto). Com requireTitleMatch, deixou de ser "o primeiro do full-text".
  for (const lang of ["pt", "en"]) {
    const r = await queryWikipedia(lang, cleaned, {
      requireTitleMatch: true,
      context: opts.context,
    })
    if (r && isUsablePhoto(r.width, r.height)) {
      r.ms = performance.now() - start
      return r
    }
  }

  return null
}

/**
 * Rede de segurança: busca foto real SÓ se a entidade for uma PESSOA (P31=Q5)
 * com foto (P18). Usada quando a IA esqueceu de marcar image_entity mas o texto
 * cita alguém famoso pelo nome. Retorna null pra qualquer coisa que não seja
 * humano-com-foto — assim nunca puxa foto de lugar/conceito fora de contexto.
 */
export async function searchWikimediaPerson(
  query: string,
): Promise<WikimediaResult | null> {
  return (await lookupPerson(query)).photo
}

/**
 * Igual ao `searchWikimediaPerson`, mas informa TAMBÉM se o nome resolveu pra
 * uma pessoa real mesmo quando não há foto usável.
 *
 * É essa distinção que liga a trava de veracidade no caso que estourou: nome
 * de pessoa real que a enciclopédia conhece (ou não) mas sem retrato livre.
 * Sem saber disso, o pipeline caía no gerador de imagem e produzia o retrato
 * de uma estranha ao lado de um nome verdadeiro.
 */
export async function lookupPerson(
  query: string,
): Promise<{ isHuman: boolean; photo: WikimediaResult | null }> {
  const cleaned = query.trim()
  // nome+sobrenome: "Marilia" sozinho casaria com qualquer homônima
  if (cleaned.length < 3 || !cleaned.includes(" ")) {
    return { isHuman: false, photo: null }
  }

  const start = performance.now()
  const wd = await wikidataCandidates(cleaned, { strict: true })
  if (!wd?.labelMatched || !wd.isHuman) return { isHuman: false, photo: null }
  if (!wd.photo) return { isHuman: true, photo: null }

  const t = await commonsThumb(wd.photo)
  if (!t || !isUsablePhoto(t.width, t.height)) return { isHuman: true, photo: null }

  return {
    isHuman: true,
    photo: {
      url: t.url,
      title: wd.label,
      sourcePage: wd.sourcePage,
      width: t.width,
      height: t.height,
      ms: performance.now() - start,
    },
  }
}

/**
 * Filtro de sanidade pra foto que vai virar FUNDO de post: resolução mínima e
 * proporção de fotografia (nem tira panorâmica, nem faixa fina de diagrama).
 * Brasão/bandeira/mapa costuma reprovar aqui pela proporção ou pelo tamanho.
 */
function isUsablePhoto(width: number, height: number): boolean {
  if (width < 500 || height < 500) return false
  const ratio = width / height
  return ratio >= 0.45 && ratio <= 2.2
}
