import { isProxyableHost } from "@/lib/proxy-image"

export const runtime = "nodejs"

// =====================================================================
// GET /api/proxy-image?url=<https://...>
//
// Serve imagens de hosts externos (fal.media, Unsplash, Wikimedia,
// Supabase Storage) pela MESMA origem do app. Sem isso, o export em
// PNG/ZIP (html-to-image → canvas) falha nas imagens geradas por IA:
// o host externo não manda CORS e o canvas fica "tainted".
//
// Allowlist de hosts em lib/proxy-image.ts — NÃO é um proxy aberto.
// =====================================================================

const MAX_BYTES = 25 * 1024 * 1024 // 25MB — imagem maior que isso é anômala

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get("url")
  if (!raw) {
    return new Response("url obrigatória", { status: 400 })
  }

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return new Response("url inválida", { status: 400 })
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return new Response("protocolo inválido", { status: 400 })
  }
  if (!isProxyableHost(target.host)) {
    return new Response("host não permitido", { status: 403 })
  }

  try {
    const upstream = await fetch(target.toString(), {
      // Sem headers de auth — só imagens públicas.
      signal: AbortSignal.timeout(20_000),
    })
    if (!upstream.ok || !upstream.body) {
      return new Response(`upstream ${upstream.status}`, { status: 502 })
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg"
    if (!contentType.startsWith("image/")) {
      return new Response("não é imagem", { status: 415 })
    }
    const length = Number(upstream.headers.get("content-length") ?? 0)
    if (length > MAX_BYTES) {
      return new Response("imagem grande demais", { status: 413 })
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Imagens geradas são imutáveis por URL — cache agressivo.
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch {
    return new Response("falha ao buscar imagem", { status: 502 })
  }
}
