/**
 * Helpers de CLIENT pra publicar no Instagram: a API da Meta só aceita URLs
 * públicas, e a arte final (texto + marca + foto) só existe como HTML no
 * preview. Então o caminho é sempre: html-to-image → PNG → upload → URL.
 *
 * Sem isso o que ia pro feed era a foto de fundo crua, sem texto nenhum.
 */

/** Sobe um PNG (data URL) pro storage público e devolve a URL. Lança em falha. */
export async function uploadPngDataUrl(dataUrl: string, name: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob()
  const fd = new FormData()
  fd.append("file", new File([blob], name, { type: "image/png" }))
  const res = await fetch("/api/editorial/upload-image", { method: "POST", body: fd })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.success || typeof data.url !== "string") {
    throw new Error(data?.error || "falha ao hospedar a imagem pra publicar")
  }
  return data.url
}

/**
 * Zoom máximo que o usuário pode aplicar na foto do slide (SliderRow "Zoom"
 * em carousel-editor.tsx vai até 250%). O alvo de encolhimento usa essa
 * folga sobre o canvas FINAL desta captura (`width`/`height` de
 * renderNodeToPng) — não um número fixo — senão uma foto zoomada saía
 * borrada. Medido no Lote 8: fal.ai devolve ~768×1024 e o Unsplash já pede
 * 1080×1350 — MENORES que 2400px (o teto fixo testado antes), por isso
 * "fotos-reduzidas" deu ~0ms: nenhuma foto era grande o bastante pra entrar
 * no corte. Alvo adaptativo por canvas pega isso (ex.: a capa, 540×675,
 * só precisa de ~1690px mesmo com zoom no máximo) e ainda cobre fotos bem
 * maiores (Wikimedia, sem redimensionamento no upstream).
 */
const ZOOM_HEADROOM = 2.5

/**
 * Encolhe (ANTES do html-to-image rodar) toda <img> do nó que passe do alvo
 * pro tamanho final desta captura, já como data: URL. Como o
 * `embedImageNode` do html-to-image só age em <img> cujo src AINDA NÃO é
 * data: (node_modules/html-to-image/lib/embed-images.js), ele pula a própria
 * busca/conversão pra essas fotos.
 *
 * IMPORTANTE (Lote 8): isso NÃO é a causa principal da lentidão medida
 * (36-80s). Fotos de fundo aqui são sempre <img> reais (nunca
 * background-image — essa propriedade só carrega gradiente decorativo em
 * editorial-covers/splits/shared, confirmado lendo o código) e, pelo menos
 * com fal.ai/Unsplash, já nascem pequenas. A causa confirmada é
 * node_modules/html-to-image/lib/clone-node.js: pra CADA nó do slide ele
 * chama getComputedStyle 3x (estilo + ::before + ::after), em sequência
 * (await encadeado, sem paralelismo) — o custo escala com a árvore de
 * elementos do slide (editorial-shared/covers/splits), não com foto nenhuma.
 * Não dá pra reduzir essa árvore a partir daqui (fora do escopo: não mexer
 * em editorial-shared.tsx/editable-canvas.tsx). O `console.debug` abaixo
 * fica pra confirmar com número real na próxima medição.
 *
 * As fotos do editor sempre passam por /api/proxy-image (proxiedImageUrl em
 * lib/proxy-image.ts), mesma origem do app — o canvas não fica "tainted"
 * nesse caminho. Qualquer imprevisto (host não proxiado, decode) cai no
 * catch: a foto fica como estava e o html-to-image embute do jeito de
 * sempre, sem quebrar a captura nem piorar o resultado.
 */
function shrinkImagesForCapture(
  node: HTMLElement,
  width: number,
  height: number,
  timingLabel?: string,
): () => void {
  const targetEdge = Math.max(width, height) * ZOOM_HEADROOM
  const restores: Array<() => void> = []
  const imgs = Array.from(node.querySelectorAll("img"))
  let shrunk = 0
  for (const img of imgs) {
    const src = img.src
    if (!src || src.startsWith("data:")) continue
    const { naturalWidth: w, naturalHeight: h } = img
    if (!w || !h || Math.max(w, h) <= targetEdge) continue
    try {
      const scale = targetEdge / Math.max(w, h)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      const ctx = canvas.getContext("2d")
      if (!ctx) continue
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = canvas.toDataURL("image/jpeg", 0.92)
      shrunk++
      restores.push(() => {
        img.src = src
      })
    } catch {
      // canvas "tainted" ou qualquer erro: mantém a foto original.
    }
  }
  if (timingLabel) {
    const bgCount = Array.from(node.querySelectorAll<HTMLElement>("*")).filter((el) =>
      /url\(/.test(el.style.backgroundImage || ""),
    ).length
    console.debug(
      `${timingLabel} fotos: ${imgs.length} <img> (${shrunk} encolhidas, alvo ${Math.round(targetEdge)}px), ${bgCount} com background-image url(...)`,
      imgs.map((im) => `${im.naturalWidth}x${im.naturalHeight}`),
    )
  }
  return () => restores.forEach((restore) => restore())
}

/** Renderiza um nó do DOM em PNG no tamanho final do Instagram. */
export async function renderNodeToPng(
  node: HTMLElement,
  width: number,
  height: number,
  /** Se vier, mede cada etapa com console.time (ex: "[capa]"). */
  timingLabel?: string,
): Promise<string> {
  const { toPng } = await import("html-to-image")
  if (timingLabel) console.time(`${timingLabel} fotos-reduzidas`)
  const restoreImages = shrinkImagesForCapture(node, width, height, timingLabel)
  if (timingLabel) console.timeEnd(`${timingLabel} fotos-reduzidas`)
  if (timingLabel) console.time(`${timingLabel} fontes`)
  const fontEmbedCSS = await buildFontEmbedCSS(node)
  if (timingLabel) console.timeEnd(`${timingLabel} fontes`)
  if (timingLabel) console.time(`${timingLabel} html-to-image`)
  try {
    const png = await toPng(node, {
      // SEM cacheBust: ele pendurava ?timestamp em cada imagem, furava o cache do
      // browser e o /api/proxy-image baixava a foto do fal.media de novo a cada
      // captura (~7s por imagem, medido). A URL da imagem já é imutável.
      // Sem includeQueryParams a chave de cache do html-to-image ignora a query
      // string e toda imagem proxiada (/api/proxy-image?url=…) colide numa só.
      includeQueryParams: true,
      canvasWidth: width,
      canvasHeight: height,
      pixelRatio: 1,
      // Fontes montadas aqui (ver buildFontEmbedCSS). Sem isso o html-to-image
      // tenta ler a folha do Google Fonts (cross-origin, dá erro de CSS no
      // console), baixa TODAS as fontes dela a cada captura e reinsere as regras
      // na página, então cada salvar ficava mais lento (chegou a ~2 min).
      fontEmbedCSS,
    })
    return png
  } finally {
    if (timingLabel) console.timeEnd(`${timingLabel} html-to-image`)
    // Restaura a <img> pro src original: essa é a MESMA árvore do editor
    // (não um clone), então quem olhar pra ela depois (próxima captura,
    // waitPreviewImages) precisa ver a foto de verdade, não a reduzida.
    restoreImages()
  }
}

const FONT_FETCH_TIMEOUT_MS = 5000
const cssTextCache = new Map<string, Promise<string>>()
const fontDataCache = new Map<string, Promise<string | null>>()

function normalizeFamily(f: string): string {
  return f.trim().replace(/["']/g, "").toLowerCase()
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController()
  const t = window.setTimeout(() => ctrl.abort(), FONT_FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { signal: ctrl.signal })
  } finally {
    window.clearTimeout(t)
  }
}

/** Arquivo de fonte → data URL, 1 download por sessão. null = falhou. */
function fontToDataUrl(url: string): Promise<string | null> {
  let p = fontDataCache.get(url)
  if (!p) {
    p = fetchWithTimeout(url)
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(String(res.status)))))
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onerror = reject
            reader.onloadend = () => resolve(String(reader.result))
            reader.readAsDataURL(blob)
          }),
      )
      .catch(() => null)
    fontDataCache.set(url, p)
  }
  return p
}

/** Blocos @font-face de todas as folhas da página, com a URL base de cada um. */
async function collectFontFaces(): Promise<{ css: string; base: string }[]> {
  const out: { css: string; base: string }[] = []
  const remote: Promise<void>[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    const base = sheet.href ?? location.href
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSFontFaceRule) out.push({ css: rule.cssText, base })
      }
    } catch {
      // Folha cross-origin (Google Fonts): lê o texto 1x por sessão e só
      // separa os @font-face. As fontes em si só baixam se o slide usar.
      const href = sheet.href
      if (!href) continue
      let text = cssTextCache.get(href)
      if (!text) {
        text = fetchWithTimeout(href)
          .then((r) => (r.ok ? r.text() : ""))
          .catch(() => "")
        cssTextCache.set(href, text)
      }
      remote.push(
        text.then((css) => {
          for (const m of css.match(/@font-face\s*{[^}]*}/g) ?? []) {
            out.push({ css: m, base: href })
          }
        }),
      )
    }
  }
  await Promise.all(remote)
  return out
}

/**
 * CSS de fontes pro html-to-image: só as famílias que o nó realmente usa, com
 * os arquivos embutidos em data URL e cacheados. Fonte que falha ou demora é
 * pulada (a imagem sai com a fonte reserva), nunca trava a captura.
 */
export async function buildFontEmbedCSS(node: HTMLElement): Promise<string> {
  const used = new Set<string>()
  const walk = (el: Element) => {
    for (const f of getComputedStyle(el).fontFamily.split(",")) used.add(normalizeFamily(f))
    for (const child of Array.from(el.children)) walk(child)
  }
  walk(node)

  const faces = (await collectFontFaces()).filter(({ css }) => {
    const fam = css.match(/font-family\s*:\s*([^;}]+)/i)?.[1]
    return fam != null && used.has(normalizeFamily(fam))
  })

  const blocks = await Promise.all(
    faces.map(async ({ css, base }) => {
      const urls = Array.from(css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g))
      let result = css
      for (const m of urls) {
        if (m[1].startsWith("data:")) continue
        const data = await fontToDataUrl(new URL(m[1], base).href)
        if (!data) return ""
        result = result.replace(m[0], `url(${data})`)
      }
      return result
    }),
  )
  return blocks.filter(Boolean).join("\n")
}
