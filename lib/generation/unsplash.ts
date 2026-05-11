export interface UnsplashAttribution {
  photographerName: string
  photographerUrl: string
  unsplashId: string
}

export interface UnsplashResult {
  url: string
  attribution: UnsplashAttribution
  width: number
  height: number
  costUsd: number
  ms: number
}

export async function searchUnsplash(query: string): Promise<UnsplashResult> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) {
    throw new Error("UNSPLASH_ACCESS_KEY ausente em .env.local")
  }

  const start = performance.now()
  const url = new URL("https://api.unsplash.com/search/photos")
  url.searchParams.set("query", query)
  url.searchParams.set("per_page", "1")
  url.searchParams.set("orientation", "portrait")

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${key}`,
      "Accept-Version": "v1",
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Unsplash ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    results?: Array<{
      id: string
      urls: { raw: string }
      links: { download_location?: string }
      user: { name: string; links: { html: string } }
    }>
  }

  const photo = data.results?.[0]
  if (!photo) {
    throw new Error(`Unsplash sem resultados pra "${query}"`)
  }

  // Track download per Unsplash ToS — fire-and-forget
  if (photo.links?.download_location) {
    fetch(photo.links.download_location, {
      headers: { Authorization: `Client-ID ${key}` },
    }).catch(() => {
      // ignore — tracking failure is not fatal
    })
  }

  const ms = performance.now() - start
  const optimizedUrl = `${photo.urls.raw}&w=1080&h=1350&fit=crop&fm=jpg&q=80`

  return {
    url: optimizedUrl,
    attribution: {
      photographerName: photo.user?.name ?? "Unknown",
      photographerUrl: `${photo.user?.links?.html ?? "https://unsplash.com"}?utm_source=instapost&utm_medium=referral`,
      unsplashId: photo.id,
    },
    width: 1080,
    height: 1350,
    costUsd: 0,
    ms,
  }
}

/**
 * Busca múltiplas fotos do Unsplash pra grid de seleção no editor.
 * Retorna 12 thumbs por padrão.
 */
export interface UnsplashResultMulti {
  results: Array<{
    id: string
    thumbUrl: string
    fullUrl: string
    photographerName: string
    photographerUrl: string
  }>
  ms: number
}

export async function searchUnsplashMulti(
  query: string,
  perPage: number = 12,
): Promise<UnsplashResultMulti> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) {
    throw new Error("UNSPLASH_ACCESS_KEY ausente em .env.local")
  }

  const start = performance.now()
  const url = new URL("https://api.unsplash.com/search/photos")
  url.searchParams.set("query", query)
  url.searchParams.set("per_page", String(Math.min(perPage, 30)))
  url.searchParams.set("orientation", "portrait")

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${key}`,
      "Accept-Version": "v1",
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Unsplash ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    results?: Array<{
      id: string
      urls: { raw: string; thumb: string; small: string }
      links: { download_location?: string }
      user: { name: string; links: { html: string } }
    }>
  }

  const photos = data.results ?? []
  const ms = performance.now() - start

  return {
    results: photos.map((p) => ({
      id: p.id,
      thumbUrl: p.urls.small,
      fullUrl: `${p.urls.raw}&w=1080&h=1350&fit=crop&fm=jpg&q=80`,
      photographerName: p.user?.name ?? "Unknown",
      photographerUrl: `${p.user?.links?.html ?? "https://unsplash.com"}?utm_source=instapost&utm_medium=referral`,
    })),
    ms,
  }
}

/**
 * Track download per Unsplash ToS — fire-and-forget.
 * Chamar quando o usuário SELECIONA uma foto (não no preview do grid).
 */
export function trackUnsplashDownload(downloadLocation: string): void {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key || !downloadLocation) return
  fetch(downloadLocation, {
    headers: { Authorization: `Client-ID ${key}` },
  }).catch(() => {
    // ignore tracking failures
  })
}
