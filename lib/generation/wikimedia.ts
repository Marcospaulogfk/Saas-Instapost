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
 */

export interface WikimediaResult {
  url: string
  title: string
  sourcePage: string
  width: number
  height: number
  ms: number
}

const USER_AGENT = "SyncPostBot/1.0 (https://syncpost.app; contato@syncpost.app)"
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

async function wikidataCandidates(query: string): Promise<{
  photo: string | null
  logo: string | null
  label: string
  sourcePage: string
} | null> {
  // 1. Acha o QID da entidade.
  const search = new URL("https://www.wikidata.org/w/api.php")
  search.searchParams.set("action", "wbsearchentities")
  search.searchParams.set("search", query)
  search.searchParams.set("language", "en")
  search.searchParams.set("type", "item")
  search.searchParams.set("limit", "1")
  search.searchParams.set("format", "json")
  search.searchParams.set("origin", "*")

  const searchData = await getJson<{
    search?: Array<{ id: string; label?: string; concepturi?: string }>
  }>(search.toString())
  const hit = searchData?.search?.[0]
  if (!hit) return null

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

  // P18 = foto/imagem; P154 = logo. Devolve os dois candidatos e deixa a cascata
  // decidir — foto SEMPRE antes de logo (logo full-bleed fica recortado/feio).
  return {
    photo: fileOf("P18"),
    logo: fileOf("P154"),
    label: hit.label ?? query,
    sourcePage: hit.concepturi ?? `https://www.wikidata.org/wiki/${hit.id}`,
  }
}

// =============================================================================
// Wikipedia — foto principal da página (pageimages)
// =============================================================================

interface WikiPage {
  title?: string
  fullurl?: string
  original?: { source: string; width: number; height: number }
}

async function queryWikipedia(
  lang: string,
  query: string,
): Promise<WikimediaResult | null> {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`)
  url.searchParams.set("action", "query")
  url.searchParams.set("format", "json")
  url.searchParams.set("generator", "search")
  url.searchParams.set("gsrsearch", query)
  url.searchParams.set("gsrlimit", "1")
  url.searchParams.set("prop", "pageimages|info")
  url.searchParams.set("piprop", "original")
  url.searchParams.set("inprop", "url")
  url.searchParams.set("origin", "*")

  const data = await getJson<{
    query?: { pages?: Record<string, WikiPage> }
  }>(url.toString())

  const pages = data?.query?.pages
  if (!pages) return null
  for (const page of Object.values(pages)) {
    if (page.original?.source) {
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
  }
  return null
}

// =============================================================================
// Cascata pública
// =============================================================================

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
