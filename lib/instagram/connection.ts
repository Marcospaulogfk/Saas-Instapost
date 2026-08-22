import type { SupabaseClient } from "@supabase/supabase-js"
import { refreshLongLivedToken } from "./meta"

export interface InstagramConnection {
  igUserId: string
  username: string | null
  accessToken: string
  expiresAt: string | null
}

/** Renova quando faltar menos que isso pra expirar. */
const REFRESH_WINDOW_MS = 10 * 24 * 3600 * 1000

/**
 * Conexão do usuário logado, com o token de longa duração RENOVADO quando
 * está perto de vencer. Antes não existia renovação: todo mundo teria que
 * reconectar a cada 60 dias e descobriria isso na hora de publicar.
 *
 * Devolve null se não há conexão; lança se o token já expirou (aí só
 * reconectando mesmo).
 */
export async function getValidConnection(
  supabase: SupabaseClient,
  userId: string,
): Promise<InstagramConnection | null> {
  const { data } = await supabase
    .from("instagram_connections")
    .select("ig_user_id, username, access_token, token_expires_at")
    .eq("user_id", userId)
    .maybeSingle()
  if (!data) return null

  const expiresAt = data.token_expires_at ? new Date(data.token_expires_at).getTime() : null
  if (expiresAt && expiresAt < Date.now()) {
    throw new Error("Conexão expirada. Reconecte o Instagram.")
  }

  let accessToken: string = data.access_token
  let expiresIso: string | null = data.token_expires_at
  if (expiresAt && expiresAt - Date.now() < REFRESH_WINDOW_MS) {
    try {
      const fresh = await refreshLongLivedToken(accessToken)
      accessToken = fresh.access_token
      expiresIso = new Date(Date.now() + fresh.expiresInSec * 1000).toISOString()
      await supabase
        .from("instagram_connections")
        .update({
          access_token: accessToken,
          token_expires_at: expiresIso,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
    } catch (e) {
      // Token ainda vale: segue com o atual e tenta de novo na próxima.
      console.warn("[instagram] refresh falhou", e)
    }
  }

  return {
    igUserId: data.ig_user_id,
    username: data.username,
    accessToken,
    expiresAt: expiresIso,
  }
}
