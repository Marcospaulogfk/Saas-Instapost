import * as cheerio from "cheerio"

export interface ExtractedContent {
  url: string
  title: string
  description: string
  ogImage: string | null
  text: string
  instagram: string | null
}

export async function extractFromUrl(rawUrl: string): Promise<ExtractedContent> {
  let url = rawUrl.trim()
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }

  // Instagram blocks scrapers — extract handle and return early
  if (/^https?:\/\/(www\.)?instagram\.com/i.test(url)) {
    const match = url.match(/instagram\.com\/([^/?#]+)/)
    const handle = match?.[1] ?? ""
    return {
      url,
      title: handle ? `@${handle}` : "",
      description: "",
      ogImage: null,
      text: handle
        ? `Pagina de Instagram do handle @${handle}. Como Instagram bloqueia scrapers, o conteudo da pagina nao pode ser extraido automaticamente. Analise a marca baseado no nome do handle e infera o resto pela contexto.`
        : "URL de Instagram invalida.",
      instagram: handle,
    }
  }

  let html: string
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; InstaPostBot/1.0; +https://instapost.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) {
      throw new Error(`URL retornou HTTP ${response.status}`)
    }
    const ct = response.headers.get("content-type") ?? ""
    if (!ct.includes("html")) {
      throw new Error(`URL nao retorna HTML (content-type: ${ct})`)
    }
    html = await response.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Falha ao acessar a URL: ${msg}`)
  }

  const $ = cheerio.load(html)

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").first().text() ||
    ""

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    ""

  const ogImage = $('meta[property="og:image"]').attr("content") ?? null

  // Strip noise before grabbing text
  $("script, style, noscript, iframe, svg, nav, footer, header").remove()

  // Prefer main/article content; fall back to body
  let textNode = $("main").first()
  if (!textNode.length) textNode = $("article").first()
  if (!textNode.length) textNode = $("body")

  const cleanText = textNode
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000)

  // Try to find an instagram handle anywhere in the HTML
  const igMatch = html.match(/instagram\.com\/([a-zA-Z0-9._]{2,30})/i)
  const instagram = igMatch?.[1] ?? null

  return {
    url,
    title: title.trim(),
    description: description.trim(),
    ogImage,
    text: cleanText,
    instagram,
  }
}
