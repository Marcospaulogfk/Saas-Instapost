/**
 * Persistência do post único na biblioteca (tabela `single_posts`).
 *
 * Extraído de app/teste/page.tsx para o editor promovido
 * (app/dashboard/editor/post-unico) poder reusar sem copiar a lógica. O
 * sandbox continua com a cópia dele até o carrossel também ser promovido.
 */
import { createSinglePost, updateSinglePost } from "@/app/actions/single-posts"
import { POST_FORMATS, type PostFormat } from "./formats"
import type { FreeBlock, FreePostSpec } from "./free-spec"
import type { PostContent } from "./types"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** `true` se o id é uma marca real do usuário (e não a marca-demo do sandbox). */
export function isRealBrandId(id: string | null | undefined): boolean {
  return !!id && UUID_RE.test(id)
}

/** Primeiro texto do spec — vira o título do post na biblioteca. */
export function titleFromSpec(spec: FreePostSpec | null): string {
  if (!spec) return ""
  const stack = [...spec.blocks]
  while (stack.length) {
    const b = stack.shift()!
    if (b.type === "text" && b.text.trim()) return b.text.trim().slice(0, 80)
    if (b.type === "card" || b.type === "stack") stack.push(...b.children)
  }
  return ""
}

/**
 * Foto em data URL (upload local) → sobe pro Storage antes de persistir.
 * Guardar base64 de até 5MB dentro do JSONB incharia o banco.
 * Em falha, devolve a data URL original — salvar nunca quebra por isso.
 */
async function maybeUploadDataUrl(url: string): Promise<string> {
  if (!url.startsWith("data:")) return url
  try {
    const blob = await (await fetch(url)).blob()
    const fd = new FormData()
    fd.append("file", new File([blob], "upload.png", { type: blob.type || "image/png" }))
    const res = await fetch("/api/editorial/upload-image", { method: "POST", body: fd })
    const data = await res.json()
    if (data?.success && typeof data.url === "string") return data.url
  } catch {
    // mantém a data URL
  }
  return url
}

/**
 * Percorre a árvore de blocos e re-hospeda toda imagem em data URL.
 * Recursivo porque `card` e `stack` carregam filhos.
 */
async function hostImageBlocks(blocks: FreeBlock[]): Promise<FreeBlock[]> {
  return Promise.all(
    blocks.map(async (b): Promise<FreeBlock> => {
      if (b.type === "image" && b.url.startsWith("data:")) {
        return { ...b, url: await maybeUploadDataUrl(b.url) }
      }
      if (b.type === "card" || b.type === "stack") {
        return { ...b, children: await hostImageBlocks(b.children) }
      }
      return b
    }),
  )
}

/**
 * Espera as imagens do nó terminarem de decodificar.
 *
 * Sem isso a miniatura sai com o buraco da foto: o auto-save dispara no mesmo
 * ciclo em que o spec chega ao estado, muito antes do <img> da arte carregar.
 */
async function waitImages(node: HTMLElement, timeoutMs = 6000): Promise<void> {
  const imgs = Array.from(node.querySelectorAll("img"))
  if (!imgs.length) return
  const pendentes = imgs.map(
    (img) =>
      new Promise<void>((resolve) => {
        if (img.complete && img.naturalWidth > 0) return resolve()
        img.addEventListener("load", () => resolve(), { once: true })
        img.addEventListener("error", () => resolve(), { once: true })
      }),
  )
  await Promise.race([
    Promise.all(pendentes),
    new Promise<void>((r) => setTimeout(r, timeoutMs)),
  ])
}

/** Largura da miniatura salva na biblioteca — leve o bastante pra uma grade
 *  de 12 cartões e nítida o bastante em tela retina. */
const THUMB_WIDTH = 540

/**
 * Captura a arte visível e hospeda no Storage — é isso que vira a miniatura
 * dos cartões (`single_posts.rendered_image_url`).
 *
 * Best-effort por decisão: falha aqui NUNCA pode derrubar o save. Antes desta
 * função a coluna nunca era escrita e toda a biblioteca mostrava só o gradiente
 * de fallback.
 *
 * REGRA GLOBAL: o nó capturado precisa estar visível — passar um nó offscreen
 * (fixed + left negativo) devolve PNG 100% transparente, sem erro.
 */
export async function captureSpecThumb(
  node: HTMLElement | null | undefined,
  format: PostFormat,
): Promise<string | null> {
  if (!node) return null
  try {
    const art = (node.querySelector("[data-post-canvas]") as HTMLElement | null) ?? node
    await waitImages(art)
    const def = POST_FORMATS[format] ?? POST_FORMATS.post
    const { toPng } = await import("html-to-image")
    const dataUrl = await toPng(art, {
      cacheBust: true,
      includeQueryParams: true,
      canvasWidth: THUMB_WIDTH,
      canvasHeight: Math.round((THUMB_WIDTH * def.height) / def.width),
      pixelRatio: 1,
    })
    const hosted = await maybeUploadDataUrl(dataUrl)
    // Upload falhou → maybeUploadDataUrl devolve a própria data URL. Guardar
    // base64 de uma imagem inteira numa coluna de texto é pior que não ter
    // miniatura, então descarta.
    return hosted.startsWith("data:") ? null : hosted
  } catch {
    return null
  }
}

export interface SaveSinglePostParams {
  brandId: string
  spec: FreePostSpec
  skeletonId: string | null
  briefing: string
  /** Legenda do Instagram gerada junto com o post (com hashtags). */
  caption: string
  fontPreset: string
  format: PostFormat
  photoUrl: string | null
  /** Textos pintados NA arte (modo bitmap) — alimentam a edição cirúrgica
   * na reedição. Null fora do modo bitmap. */
  bitmapTexts?: Record<string, unknown> | null
  /**
   * Nó do preview na tela — capturado pra gerar a miniatura da biblioteca.
   * Opcional: sem ele o post salva do mesmo jeito, só sem thumb nova.
   */
  previewNode?: HTMLElement | null
  /** Id de um save anterior — presente = update em vez de insert. */
  savedId: string | null
}

export type SaveSinglePostResult =
  | { ok: true; postId: string }
  | { ok: false; error: string }

/**
 * Salva (ou atualiza) o post no formato de spec livre: o spec inteiro vai em
 * `content`, com `template_id` = "free:<skeleton>". A biblioteca renderiza
 * pelo spec, então o post continua editável depois de salvo.
 */
export async function saveSinglePost(
  params: SaveSinglePostParams,
): Promise<SaveSinglePostResult> {
  const {
    brandId,
    spec,
    skeletonId,
    briefing,
    caption,
    fontPreset,
    format,
    photoUrl,
    bitmapTexts,
    previewNode,
    savedId,
  } = params

  if (!isRealBrandId(brandId)) {
    return {
      ok: false,
      error:
        "Pra salvar na biblioteca, gere o post a partir de uma marca sua (Dashboard → Criar conteúdo).",
    }
  }

  const title = titleFromSpec(spec) || briefing.trim().slice(0, 60) || "Post único"

  // Data URLs → Storage antes de persistir. Vale pro fundo E pros blocos de
  // imagem que o usuário adiciona por upload: base64 de até 5MB cada dentro do
  // JSONB incharia o banco rápido.
  let specToSave = spec
  if (
    specToSave.background.kind === "photo" &&
    specToSave.background.photo_url?.startsWith("data:")
  ) {
    const hosted = await maybeUploadDataUrl(specToSave.background.photo_url)
    specToSave = {
      ...specToSave,
      background: { ...specToSave.background, photo_url: hosted },
    }
  }
  specToSave = { ...specToSave, blocks: await hostImageBlocks(specToSave.blocks) }

  const content = {
    _free_spec: specToSave,
    _font_preset: fontPreset,
    _format: format,
    _photo_url: photoUrl,
    _caption: caption,
    ...(bitmapTexts ? { _bitmap_texts: bitmapTexts } : {}),
  } as unknown as PostContent

  // Miniatura da biblioteca. Roda antes do insert/update pra ir junto no mesmo
  // registro; `null` (captura falhou) não sobrescreve a thumb que já existe.
  const thumbUrl = await captureSpecThumb(previewNode, format)

  try {
    if (savedId) {
      const res = await updateSinglePost(savedId, {
        title,
        raw_brief: briefing || null,
        content,
        ...(thumbUrl ? { rendered_image_url: thumbUrl } : {}),
      })
      if (!res.ok) return { ok: false, error: res.error }
      return { ok: true, postId: savedId }
    }
    const res = await createSinglePost({
      brand_id: brandId,
      template_id: `free:${skeletonId ?? "auto"}`,
      title,
      raw_brief: briefing || null,
      content,
      rendered_image_url: thumbUrl,
    })
    if (!res.ok) return { ok: false, error: res.error }
    return { ok: true, postId: res.postId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "erro ao salvar" }
  }
}

/**
 * Exporta o preview como PNG no tamanho nativo do formato e dispara o download.
 *
 * Captura o nó da ARTE (`data-post-canvas`), não o wrapper — assim o canvas
 * mapeia 1:1 e não entra padding da UI ao redor.
 *
 * REGRA GLOBAL: o nó capturado precisa estar visível na tela. Passar um nó
 * offscreen (fixed + left negativo) faz o PNG sair 100% transparente, sem erro.
 */
export async function renderSpecToPng(
  node: HTMLElement,
  format: PostFormat = "post",
): Promise<string> {
  const art = (node.querySelector("[data-post-canvas]") as HTMLElement | null) ?? node
  const def = POST_FORMATS[format] ?? POST_FORMATS.post
  await waitImages(art)
  const { toPng } = await import("html-to-image")
  return toPng(art, {
    cacheBust: true,
    includeQueryParams: true,
    canvasWidth: def.width,
    canvasHeight: def.height,
    pixelRatio: 1,
  })
}

/** Mesmo render acima, mas dispara o download no navegador. */
export async function exportSpecToPng(
  node: HTMLElement,
  format: PostFormat = "post",
): Promise<void> {
  const dataUrl = await renderSpecToPng(node, format)
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = `post-unico-${format}-${Date.now()}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
