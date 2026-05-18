import * as cheerio from "cheerio"

export interface ExtractedContent {
  url: string
  title: string
  description: string
  ogImage: string | null
  logoUrl: string | null
  html: string
  text: string
  instagram: string | null
}

export interface LogoFile {
  data: string // base64 without prefix
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif"
}

const SUPPORTED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
])

const MAX_LOGO_BYTES = 5 * 1024 * 1024 // 5MB

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
      logoUrl: null,
      html: "",
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
        // alguns sites bloqueiam requests sem User-Agent de navegador
        "User-Agent": "Mozilla/5.0 (compatible; SyncPostBot/1.0)",
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

  // Try to find a logo URL via cascade BEFORE we strip header/nav from the DOM
  const logoUrl = findLogoUrl($, url)

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
    logoUrl,
    html,
    text: cleanText,
    instagram,
  }
}

// =============================================================================
// Logo cascade — find the best logo URL in the page HTML
// =============================================================================

export function findLogoUrl(
  $: cheerio.CheerioAPI,
  baseUrl: string,
): string | null {
  const resolve = (src?: string): string | null => {
    if (!src) return null
    try {
      return new URL(src, baseUrl).href
    } catch {
      return null
    }
  }

  // 1. og:image — usually the brand "official" image
  const og = $('meta[property="og:image"]').attr("content")
  const ogResolved = resolve(og)
  if (ogResolved) return ogResolved

  // 2. apple-touch-icon — high-resolution icon, great for color analysis
  const apple =
    $('link[rel="apple-touch-icon"]').attr("href") ||
    $('link[rel="apple-touch-icon-precomposed"]').attr("href")
  const appleResolved = resolve(apple)
  if (appleResolved) return appleResolved

  // 3. <img> dentro de header/nav com "logo"/"brand" nas classes/alt/id
  let headerImg: string | undefined
  $("header img, nav img").each((_, el) => {
    if (headerImg) return
    const $el = $(el)
    const haystack =
      `${$el.attr("class") ?? ""} ${$el.attr("alt") ?? ""} ${$el.attr("id") ?? ""}`
        .toLowerCase()
    if (haystack.includes("logo") || haystack.includes("brand")) {
      headerImg = $el.attr("src") || $el.attr("data-src") || undefined
    }
  })
  const headerResolved = resolve(headerImg)
  if (headerResolved) return headerResolved

  // 4. favicon comum
  const icon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href")
  const iconResolved = resolve(icon)
  if (iconResolved) return iconResolved

  return null
}

// =============================================================================
// Logo download — convert URL to base64 with media type detection
// =============================================================================

export async function downloadLogoAsBase64(
  logoUrl: string,
): Promise<LogoFile | null> {
  try {
    const res = await fetch(logoUrl, {
      headers: {
        // alguns sites bloqueiam requests sem User-Agent de navegador
        "User-Agent": "Mozilla/5.0 (compatible; SyncPostBot/1.0)",
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.warn(`[logo] download HTTP ${res.status} ${logoUrl}`)
      return null
    }

    const rawType = (res.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase()

    let mediaType: LogoFile["mediaType"] | null = null
    if (rawType === "image/png") mediaType = "image/png"
    else if (rawType === "image/jpeg" || rawType === "image/jpg")
      mediaType = "image/jpeg"
    else if (rawType === "image/webp") mediaType = "image/webp"
    else if (rawType === "image/gif") mediaType = "image/gif"

    if (!mediaType) {
      // Tenta inferir pela extensão da URL
      const lower = logoUrl.toLowerCase().split("?")[0]
      if (lower.endsWith(".png")) mediaType = "image/png"
      else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg"))
        mediaType = "image/jpeg"
      else if (lower.endsWith(".webp")) mediaType = "image/webp"
      else if (lower.endsWith(".gif")) mediaType = "image/gif"
    }

    if (!mediaType || !SUPPORTED_LOGO_TYPES.has(mediaType)) {
      console.warn(
        `[logo] tipo nao suportado (${rawType || "?"}) — pulando ${logoUrl}`,
      )
      return null
    }

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength > MAX_LOGO_BYTES) {
      console.warn(
        `[logo] muito grande (${buf.byteLength} bytes) — pulando ${logoUrl}`,
      )
      return null
    }
    if (buf.byteLength === 0) {
      console.warn(`[logo] arquivo vazio — pulando ${logoUrl}`)
      return null
    }

    return {
      data: buf.toString("base64"),
      mediaType,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[logo] download falhou: ${msg}`)
    return null
  }
}

// =============================================================================
// Clearbit fallback — last resort when no logo found in HTML
// =============================================================================

export function clearbitLogoUrl(websiteUrl: string): string | null {
  try {
    const host = new URL(websiteUrl).hostname.replace(/^www\./, "")
    if (!host) return null
    return `https://logo.clearbit.com/${host}`
  } catch {
    return null
  }
}
