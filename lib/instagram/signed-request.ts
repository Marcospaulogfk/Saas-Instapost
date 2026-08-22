import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Parse + verificação do `signed_request` que a Meta manda nos callbacks de
 * desautorização e de exclusão de dados. Formato: `<sig>.<payload>`, os dois
 * em base64url; a assinatura é HMAC-SHA256 do payload com o App Secret.
 *
 * https://developers.facebook.com/docs/facebook-login/guides/advanced/signed-request
 */
export interface SignedRequestPayload {
  algorithm: string
  issued_at: number
  /** ID do usuário do Instagram (no fluxo "Instagram API with Instagram Login"). */
  user_id: string
}

function b64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64")
}

export function parseSignedRequest(
  signedRequest: string,
  appSecret: string,
): SignedRequestPayload | null {
  const [sig, payload] = signedRequest.split(".", 2)
  if (!sig || !payload) return null

  const expected = createHmac("sha256", appSecret).update(payload).digest()
  const given = b64url(sig)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null
  }

  try {
    const data = JSON.parse(b64url(payload).toString("utf8"))
    if (!data?.user_id) return null
    if (String(data.algorithm).toUpperCase() !== "HMAC-SHA256") return null
    return { ...data, user_id: String(data.user_id) }
  } catch {
    return null
  }
}
