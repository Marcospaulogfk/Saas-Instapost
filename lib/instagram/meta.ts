/**
 * Integração REAL com a API do Instagram — fluxo "Instagram API with Instagram
 * Login" (scopes instagram_business_basic + instagram_business_content_publish).
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

const GRAPH_VERSION = "v21.0"
const GRAPH = `https://graph.instagram.com`

export function isInstagramConfigured(): boolean {
  return Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET)
}

export function instagramScopes(): string {
  return "instagram_business_basic,instagram_business_content_publish"
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
