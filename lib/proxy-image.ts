// =====================================================================
// lib/proxy-image.ts
// Helper compartilhado (client-safe) pra rotear imagens externas pelo
// /api/proxy-image. Motivo: o export (html-to-image) precisa buscar a
// imagem via fetch/canvas — hosts externos sem CORS (fal.media etc.)
// "sujam" o canvas e o download do PNG/ZIP falha. Servindo pela mesma
// origem, o export funciona sempre.
// =====================================================================

/** Hosts externos que o proxy aceita (allowlist anti-SSRF). */
export const PROXY_ALLOWED_HOSTS = [
  "fal.media",
  "v2.fal.media",
  "v3.fal.media",
  "images.unsplash.com",
  "plus.unsplash.com",
  "upload.wikimedia.org",
] as const

export function isProxyableHost(host: string): boolean {
  const h = host.toLowerCase()
  if (h.endsWith(".fal.media")) return true
  if (h.endsWith(".supabase.co")) return true
  return (PROXY_ALLOWED_HOSTS as readonly string[]).includes(h)
}

/**
 * Retorna a URL proxiada quando a imagem é de um host externo conhecido.
 * data:/blob:/URLs relativas (mesma origem) passam direto.
 * Hosts desconhecidos também passam direto (comportamento atual preservado).
 */
export function proxiedImageUrl(url: string): string {
  if (!url) return url
  if (!/^https?:\/\//i.test(url)) return url // data:, blob:, relativa
  try {
    const u = new URL(url)
    if (typeof window !== "undefined" && u.host === window.location.host) {
      return url
    }
    if (!isProxyableHost(u.host)) return url
    return `/api/proxy-image?url=${encodeURIComponent(url)}`
  } catch {
    return url
  }
}
