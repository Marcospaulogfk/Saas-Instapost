/**
 * Integração REAL com a API do Instagram — fluxo "Instagram API with Instagram
 * Login" (scopes business_basic + content_publish + manage_insights).
 *
 * Só roda no server (usa o App Secret). Endpoints:
 *   - Authorize: https://www.instagram.com/oauth/authorize
 *   - Token:     https://api.instagram.com/oauth/access_token  (code → short-lived)
 *   - Long-lived: https://graph.instagram.com/access_token     (short → 60 dias)
 *   - Graph:      https://graph.instagram.com/{version}/...
 *
 * Config via env (Coolify):
 *   INSTAGRAM_APP_ID        — App ID (público)
 *   INSTAGRAM_APP_SECRET    — Chave secreta do app (sensível)
 *   INSTAGRAM_REDIRECT_URI  — opcional; default {origin}/api/instagram/callback
 */

// v22+: `impressions` saiu, `views` entrou (insights dependem disso).
const GRAPH_VERSION = "v23.0"
const GRAPH = `https://graph.instagram.com`

export function isInstagramConfigured(): boolean {
  return Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET)
}

export function instagramScopes(): string {
  return "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights"
}

export function redirectUri(origin: string): string {
  return (
    process.env.INSTAGRAM_REDIRECT_URI ||
    `${origin}/api/instagram/callback`
  )
}

/** URL pra onde mandamos o usuário logar/autorizar no Instagram. */
export function buildAuthorizeUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: instagramScopes(),
    state,
  })
  return `https://www.instagram.com/oauth/authorize?${p.toString()}`
}

interface ShortToken {
  access_token: string
  user_id: string | number
}

/** Troca o `code` do callback por um token de curta duração + user_id. */
export async function exchangeCodeForToken(
  code: string,
  origin: string,
): Promise<ShortToken> {
  const body = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    client_secret: process.env.INSTAGRAM_APP_SECRET!,
    grant_type: "authorization_code",
    redirect_uri: redirectUri(origin),
    code,
  })
  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  const data = await res.json()
  if (!res.ok || !data?.access_token) {
    throw new Error(data?.error_message || data?.error?.message || "falha ao trocar code por token")
  }
  return { access_token: data.access_token, user_id: data.user_id }
}

interface LongToken {
  access_token: string
  expiresInSec: number
}

/** Troca o token de curta duração por um de longa (≈60 dias). */
export async function getLongLivedToken(shortToken: string): Promise<LongToken> {
  const p = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: process.env.INSTAGRAM_APP_SECRET!,
    access_token: shortToken,
  })
  const res = await fetch(`${GRAPH}/access_token?${p.toString()}`)
  const data = await res.json()
  if (!res.ok || !data?.access_token) {
    throw new Error(data?.error?.message || "falha ao obter token de longa duração")
  }
  return { access_token: data.access_token, expiresInSec: data.expires_in ?? 60 * 24 * 3600 }
}

/** Descobre user_id + username da conta autenticada. */
export async function getInstagramProfile(
  accessToken: string,
): Promise<{ igUserId: string; username: string }> {
  const p = new URLSearchParams({
    fields: "user_id,username",
    access_token: accessToken,
  })
  const res = await fetch(`${GRAPH}/me?${p.toString()}`)
  const data = await res.json()
  if (!res.ok || (!data?.user_id && !data?.id)) {
    throw new Error(data?.error?.message || "falha ao ler o perfil do Instagram")
  }
  return {
    igUserId: String(data.user_id ?? data.id),
    username: data.username ?? "",
  }
}

async function graphPost(
  igUserId: string,
  path: "media" | "media_publish",
  params: Record<string, string>,
  accessToken: string,
): Promise<{ id: string }> {
  const body = new URLSearchParams({ ...params, access_token: accessToken })
  const res = await fetch(`${GRAPH}/${GRAPH_VERSION}/${igUserId}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  const data = await res.json()
  if (!res.ok || !data?.id) {
    throw new Error(data?.error?.message || `falha em ${path}`)
  }
  return { id: data.id }
}

/**
 * Publica um carrossel (2+ imagens) OU um post único (1 imagem).
 * As imagens precisam estar em URLs PÚBLICAS acessíveis pela Meta.
 * Retorna o id do post publicado.
 */
export async function publishCarousel(
  igUserId: string,
  accessToken: string,
  imageUrls: string[],
  caption: string,
): Promise<{ id: string }> {
  if (!imageUrls.length) throw new Error("sem imagens pra publicar")

  // 1 imagem → post simples
  if (imageUrls.length === 1) {
    const container = await graphPost(
      igUserId,
      "media",
      { image_url: imageUrls[0], caption },
      accessToken,
    )
    return graphPost(igUserId, "media_publish", { creation_id: container.id }, accessToken)
  }

  // Carrossel: 1 container por imagem (is_carousel_item) → container pai → publish
  const childIds: string[] = []
  for (const url of imageUrls.slice(0, 10)) {
    const child = await graphPost(
      igUserId,
      "media",
      { image_url: url, is_carousel_item: "true" },
      accessToken,
    )
    childIds.push(child.id)
  }
  const parent = await graphPost(
    igUserId,
    "media",
    { media_type: "CAROUSEL", children: childIds.join(","), caption },
    accessToken,
  )
  return graphPost(igUserId, "media_publish", { creation_id: parent.id }, accessToken)
}

// ── Token de longa duração: renovação ───────────────────────────────────────

/**
 * Renova um token de longa duração (só funciona com ≥24h de vida e ainda
 * válido). Devolve o novo token + validade (≈60 dias de novo).
 */
export async function refreshLongLivedToken(accessToken: string): Promise<LongToken> {
  const p = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: accessToken,
  })
  const res = await fetch(`${GRAPH}/refresh_access_token?${p.toString()}`)
  const data = await res.json()
  if (!res.ok || !data?.access_token) {
    throw new Error(data?.error?.message || "falha ao renovar o token do Instagram")
  }
  return { access_token: data.access_token, expiresInSec: data.expires_in ?? 60 * 24 * 3600 }
}

// ── Insights (instagram_business_manage_insights) ───────────────────────────

async function graphGet<T>(path: string, params: Record<string, string>, accessToken: string): Promise<T> {
  const p = new URLSearchParams({ ...params, access_token: accessToken })
  const res = await fetch(`${GRAPH}/${GRAPH_VERSION}/${path}?${p.toString()}`)
  const data = await res.json()
  if (!res.ok || data?.error) {
    throw new Error(data?.error?.message || `falha em GET ${path}`)
  }
  return data as T
}

export interface InstagramProfile {
  igUserId: string
  username: string
  name: string | null
  profilePictureUrl: string | null
  followersCount: number
  followsCount: number
  mediaCount: number
}

/** Perfil completo da conta conectada (contadores incluídos). */
export async function getInstagramProfileFull(accessToken: string): Promise<InstagramProfile> {
  const d = await graphGet<Record<string, unknown>>(
    "me",
    { fields: "user_id,username,name,profile_picture_url,followers_count,follows_count,media_count" },
    accessToken,
  )
  return {
    igUserId: String(d.user_id ?? d.id),
    username: String(d.username ?? ""),
    name: (d.name as string) ?? null,
    profilePictureUrl: (d.profile_picture_url as string) ?? null,
    followersCount: Number(d.followers_count ?? 0),
    followsCount: Number(d.follows_count ?? 0),
    mediaCount: Number(d.media_count ?? 0),
  }
}

/** Métricas da CONTA no período (somatório). Chaves = nome da métrica na Meta. */
export type AccountInsights = Partial<
  Record<
    | "reach"
    | "views"
    | "accounts_engaged"
    | "total_interactions"
    | "likes"
    | "comments"
    | "saves"
    | "shares"
    | "profile_links_taps",
    number
  >
>

interface InsightRow {
  name: string
  total_value?: { value: number }
  values?: Array<{ value: number; end_time?: string }>
}

/**
 * Insights da conta nos últimos `days` dias. `impressions` foi removida pela
 * Meta (v22) — `views` é a substituta. Cada métrica falhando derruba a chamada
 * inteira na API, então pedimos em dois lotes: o núcleo (sempre disponível) e
 * o extra (pode faltar em conta pequena), e o extra é best-effort.
 */
export async function getAccountInsights(
  igUserId: string,
  accessToken: string,
  days = 30,
): Promise<AccountInsights> {
  const until = Math.floor(Date.now() / 1000)
  const since = until - days * 24 * 3600
  const base = {
    period: "day",
    metric_type: "total_value",
    since: String(since),
    until: String(until),
  }
  const out: AccountInsights = {}
  const collect = (rows: InsightRow[]) => {
    for (const r of rows) {
      const v = r.total_value?.value ?? r.values?.reduce((s, x) => s + (x.value ?? 0), 0)
      if (typeof v === "number") out[r.name as keyof AccountInsights] = v
    }
  }
  const core = await graphGet<{ data: InsightRow[] }>(
    `${igUserId}/insights`,
    { ...base, metric: "reach,views,accounts_engaged,total_interactions" },
    accessToken,
  )
  collect(core.data ?? [])
  try {
    const extra = await graphGet<{ data: InsightRow[] }>(
      `${igUserId}/insights`,
      { ...base, metric: "likes,comments,saves,shares,profile_links_taps" },
      accessToken,
    )
    collect(extra.data ?? [])
  } catch {
    // conta sem histórico/seguidores suficientes: segue só com o núcleo
  }
  return out
}

/** Série diária de seguidores (Meta só entrega pra contas com ≥100 seguidores). */
export async function getFollowerSeries(
  igUserId: string,
  accessToken: string,
  days = 30,
): Promise<Array<{ date: string; value: number }>> {
  const until = Math.floor(Date.now() / 1000)
  const since = until - Math.min(days, 30) * 24 * 3600
  try {
    const r = await graphGet<{ data: InsightRow[] }>(
      `${igUserId}/insights`,
      { metric: "follower_count", period: "day", since: String(since), until: String(until) },
      accessToken,
    )
    return (r.data?.[0]?.values ?? []).map((v) => ({
      date: (v.end_time ?? "").slice(0, 10),
      value: v.value ?? 0,
    }))
  } catch {
    return []
  }
}

export interface InstagramMedia {
  id: string
  caption: string | null
  mediaType: "IMAGE" | "CAROUSEL_ALBUM" | "VIDEO" | string
  mediaUrl: string | null
  thumbnailUrl: string | null
  permalink: string
  timestamp: string
  likeCount: number
  commentsCount: number
}

/** Últimas publicações do feed da conta. */
export async function getRecentMedia(
  accessToken: string,
  limit = 24,
): Promise<InstagramMedia[]> {
  const r = await graphGet<{ data: Array<Record<string, unknown>> }>(
    "me/media",
    {
      fields:
        "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
      limit: String(limit),
    },
    accessToken,
  )
  return (r.data ?? []).map((m) => ({
    id: String(m.id),
    caption: (m.caption as string) ?? null,
    mediaType: String(m.media_type ?? ""),
    mediaUrl: (m.media_url as string) ?? null,
    thumbnailUrl: (m.thumbnail_url as string) ?? null,
    permalink: String(m.permalink ?? ""),
    timestamp: String(m.timestamp ?? ""),
    likeCount: Number(m.like_count ?? 0),
    commentsCount: Number(m.comments_count ?? 0),
  }))
}

export type MediaInsights = Partial<
  Record<"reach" | "views" | "saved" | "likes" | "comments" | "shares" | "total_interactions", number>
>

/**
 * Insights de UMA publicação. Best-effort: mídia antiga ou tipo sem suporte
 * devolve null em vez de derrubar a lista.
 */
export async function getMediaInsights(
  mediaId: string,
  accessToken: string,
): Promise<MediaInsights | null> {
  try {
    const r = await graphGet<{ data: InsightRow[] }>(
      `${mediaId}/insights`,
      { metric: "reach,views,saved,likes,comments,shares,total_interactions" },
      accessToken,
    )
    const out: MediaInsights = {}
    for (const row of r.data ?? []) {
      const v = row.total_value?.value ?? row.values?.[0]?.value
      if (typeof v === "number") out[row.name as keyof MediaInsights] = v
    }
    return out
  } catch {
    return null
  }
}
