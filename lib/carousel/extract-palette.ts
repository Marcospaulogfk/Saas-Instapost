import { proxiedImageUrl } from "@/lib/proxy-image"

interface Bucket {
  count: number
  r: number
  g: number
  b: number
}

const toHex = (c: { r: number; g: number; b: number }) =>
  `#${[c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`

const lum = (c: { r: number; g: number; b: number }) =>
  0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b

const sat = (c: { r: number; g: number; b: number }) => {
  const mx = Math.max(c.r, c.g, c.b)
  const mn = Math.min(c.r, c.g, c.b)
  return mx === 0 ? 0 : (mx - mn) / mx
}

/**
 * Extrai uma paleta [acento, escuro, claro] de uma imagem, client-side.
 * A imagem passa pelo /api/proxy-image (mesma origem) + crossOrigin anonymous,
 * então o canvas NÃO fica "tainted" e o getImageData funciona.
 */
export async function extractPalette(url: string): Promise<string[]> {
  const fallback = ["#7320E6", "#0A0A0F", "#FAF8F5"]
  if (typeof window === "undefined" || !url) return fallback

  const img = new Image()
  img.crossOrigin = "anonymous"
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("load"))
      img.src = proxiedImageUrl(url)
    })
  } catch {
    return fallback
  }

  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return fallback
  ctx.drawImage(img, 0, 0, size, size)

  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, size, size).data
  } catch {
    return fallback
  }

  // Agrupa cores reduzindo a precisão (4 bits/canal) e média por bucket.
  const buckets = new Map<string, Bucket>()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue // ignora quase-transparente
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`
    const cur = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 }
    cur.count++
    cur.r += r
    cur.g += g
    cur.b += b
    buckets.set(key, cur)
  }

  const cols = [...buckets.values()].map((b) => ({
    count: b.count,
    r: b.r / b.count,
    g: b.g / b.count,
    b: b.b / b.count,
  }))
  if (!cols.length) return fallback

  // Acento = frequente + vibrante · escuro = menor luminância · claro = maior.
  const accent = [...cols].sort(
    (a, b) => b.count * (0.35 + sat(b)) - a.count * (0.35 + sat(a)),
  )[0]
  const dark = [...cols].sort((a, b) => lum(a) - lum(b))[0]
  const light = [...cols].sort((a, b) => lum(b) - lum(a))[0]

  return [toHex(accent), toHex(dark), toHex(light)]
}
