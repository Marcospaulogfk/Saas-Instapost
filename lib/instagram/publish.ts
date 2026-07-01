/**
 * FUNDAÇÃO da integração com Instagram (publicação direta).
 *
 * ⚠️ ESQUELETO / MOCK — a publicação REAL depende de:
 *   1. App no Meta for Developers (Instagram Graph API / Content Publishing).
 *   2. Conta do cliente ser Business/Creator vinculada a uma Página do Facebook.
 *   3. Permissão `instagram_content_publish` aprovada no App Review da Meta.
 *   4. Token de longa duração (long-lived user access token) por conta conectada.
 *
 * O contrato (tipos + funções) abaixo já reflete o fluxo real, mas a
 * implementação está MOCKADA. Quando o app da Meta for aprovado, troca-se só
 * o miolo das funções marcadas com `// TODO(meta)`.
 *
 * Fluxo real da Meta (Content Publishing API), pra referência:
 *   POST /{ig-user-id}/media        → cria um "container" de mídia (image_url + caption)
 *   POST /{ig-user-id}/media_publish → publica o container (creation_id)
 *   Carrossel: cria 1 container por imagem (is_carousel_item=true),
 *              depois 1 container pai (media_type=CAROUSEL, children=[ids]),
 *              e por fim media_publish do container pai.
 *   ⚠️ As imagens precisam estar em URLs PÚBLICAS acessíveis pela Meta.
 */

export interface InstagramConnection {
  /** @handle da conta conectada (sem @). */
  username: string
  /** ID da conta Instagram Business (ig-user-id). Mock por enquanto. */
  igUserId: string
  /** Quando conectou (ISO). */
  connectedAt: string
  /** True enquanto o app da Meta ainda não foi aprovado (publicação simulada). */
  pendingMetaReview: boolean
}

export interface PublishInput {
  /** URLs públicas das imagens, na ordem dos slides. */
  imageUrls: string[]
  /** Legenda do post (caption + hashtags). */
  caption: string
}

export type PublishResult =
  | { ok: true; permalink: string | null; simulated: boolean }
  | { ok: false; error: string }

const CONNECTION_KEY = "syncpost_ig_connection"

/** Lê a conexão atual do storage local (mock — futuramente vem do banco/sessão). */
export function getInstagramConnection(): InstagramConnection | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CONNECTION_KEY)
    return raw ? (JSON.parse(raw) as InstagramConnection) : null
  } catch {
    return null
  }
}

/**
 * Inicia a conexão da conta.
 * TODO(meta): substituir pelo OAuth real — redirect pro Facebook Login com os
 * scopes (instagram_basic, instagram_content_publish, pages_show_list,
 * business_management), trocar code por token de longa duração e descobrir o
 * ig-user-id via /me/accounts → page → instagram_business_account.
 */
export async function connectInstagramMock(
  username: string,
): Promise<InstagramConnection> {
  const conn: InstagramConnection = {
    username: username.replace(/^@/, "").trim() || "minha_conta",
    igUserId: "mock-ig-user-id",
    connectedAt: new Date().toISOString(),
    pendingMetaReview: true,
  }
  try {
    localStorage.setItem(CONNECTION_KEY, JSON.stringify(conn))
  } catch {}
  return conn
}

export function disconnectInstagram(): void {
  try {
    localStorage.removeItem(CONNECTION_KEY)
  } catch {}
}

/**
 * Publica o carrossel/post.
 * TODO(meta): trocar o mock pelas chamadas reais (createMediaContainer →
 * media_publish) usando o token da conexão. Por ora simula sucesso pra validar
 * o fluxo de UI ponta a ponta.
 */
export async function publishToInstagramMock(
  input: PublishInput,
): Promise<PublishResult> {
  if (!input.imageUrls.length) {
    return { ok: false, error: "Sem imagens pra publicar." }
  }
  // Simula a latência das chamadas de container + publish.
  await new Promise((r) => setTimeout(r, 1200))
  return { ok: true, permalink: null, simulated: true }
}
