import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateFreeText } from "@/lib/single-posts/free-generate"
import {
  editNanoBanana,
  generateNanoBanana,
} from "@/lib/generation/nano-banana"
import {
  buildSpecFromLayout,
  extractTextLayout,
  type MeasuredText,
} from "@/lib/single-posts/extract-layout"
import type { SkeletonContent } from "@/lib/single-posts/skeletons"
import type { FreePostSpec } from "@/lib/single-posts/free-spec"
import type { PostBrand } from "@/lib/single-posts/types"

// =============================================================================
// PILOTO do loop bitmap → spec editável (PLANO-LOOP-POST-EDITAVEL.md, Fase 1).
// Rota DEV-ONLY, sem auth, sem débito de token. Multi-caso desde 26/08: cada
// nicho do lote vive em .pilot/cases/<slug>/state.json e as actions recebem
// `case`. A action `save` fecha o ciclo NO PRODUTO: re-hospeda as imagens do
// Fal no Storage (elas expiram — é a Fase 0 em miniatura) e grava o post na
// biblioteca real (single_posts), abrível no editor oficial.
// Apagar junto com app/debug/pilot quando a fábrica de verdade nascer.
// =============================================================================

export const runtime = "nodejs"
export const maxDuration = 300

const PILOT_DIR = path.join(process.cwd(), ".pilot")

// Mesmo prompt do free-generate.ts (lá é const privada do módulo).
const CLEAN_PLATE_PROMPT =
  "Erase every single piece of text from this image — headlines, small body text, captions, bullet list text, labels inside buttons and pills, prices, numbers, usernames, watermarks. No letters or digits of any size may remain anywhere. Keep untouched: the photograph, background colors, panels, gradients, shapes, pill/button shapes (now empty) and small icons without letters. Where text was erased, seamlessly continue the surface behind it. Do not add anything new."

interface PilotState {
  briefing: string
  brand: PostBrand
  skeleton_id?: string
  content?: SkeletonContent
  caption?: string
  photo_prompt?: string | null
  artUrl?: string
  cleanUrl?: string
  items?: MeasuredText[]
  spec?: FreePostSpec
  savedPostId?: string
  costs: Record<string, number>
  log: string[]
}

function caseDir(slug: string): string {
  return path.join(PILOT_DIR, "cases", slug)
}

function stateFile(slug: string): string {
  return path.join(caseDir(slug), "state.json")
}

/** Slug de caso: minúsculas, dígitos e hífen — nada de path traversal. */
function validCase(slug: unknown): slug is string {
  return typeof slug === "string" && /^[a-z0-9][a-z0-9-]{0,40}$/.test(slug)
}

function readState(slug: string): PilotState | null {
  try {
    return JSON.parse(fs.readFileSync(stateFile(slug), "utf8")) as PilotState
  } catch {
    return null
  }
}

function writeState(slug: string, s: PilotState): void {
  fs.mkdirSync(caseDir(slug), { recursive: true })
  fs.writeFileSync(stateFile(slug), JSON.stringify(s, null, 2))
}

function guard(): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
  return null
}

/** Baixa uma URL de imagem e re-hospeda no bucket público de uploads. */
async function rehostImage(
  admin: ReturnType<typeof createAdminClient>,
  url: string,
  ownerId: string,
  name: string,
): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download falhou (${res.status}): ${url.slice(0, 80)}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get("content-type") ?? "image/jpeg"
  const ext = contentType.includes("png") ? "png" : "jpg"
  // Convenção do bucket: <user_id>/<filename> (ver 0007).
  const key = `${ownerId}/piloto-${name}-${Date.now()}.${ext}`
  const { error } = await admin.storage
    .from("editorial-uploads")
    .upload(key, buf, { contentType, upsert: false })
  if (error) throw new Error(`upload falhou: ${error.message}`)
  const { data } = admin.storage.from("editorial-uploads").getPublicUrl(key)
  return data.publicUrl
}

export async function GET(req: Request) {
  const g = guard()
  if (g) return g
  const slug = new URL(req.url).searchParams.get("case") ?? "default"
  if (!validCase(slug)) {
    return NextResponse.json({ error: "case inválido" }, { status: 400 })
  }
  const state = readState(slug)
  if (!state) return NextResponse.json({ error: "sem estado" }, { status: 404 })
  return NextResponse.json(state)
}

export async function POST(req: Request) {
  const g = guard()
  if (g) return g
  const body = (await req.json()) as {
    action: "copy" | "art" | "clean" | "extract" | "save"
    case?: string
    briefing?: string
    brand?: PostBrand
    /** save: arquivo de render dentro do dir do caso que vira a thumb. */
    thumbFile?: string
    /** save: brand REAL (do banco) que recebe o post na biblioteca. */
    saveBrandId?: string
    /** save: título do post salvo. */
    title?: string
  }
  const slug = body.case ?? "default"
  if (!validCase(slug)) {
    return NextResponse.json({ error: "case inválido" }, { status: 400 })
  }

  try {
    if (body.action === "copy") {
      if (!body.briefing || !body.brand) {
        return NextResponse.json(
          { error: "briefing e brand obrigatórios" },
          { status: 400 },
        )
      }
      const r = await generateFreeText({
        brand: body.brand,
        briefing: body.briefing,
      })
      const state: PilotState = {
        briefing: body.briefing,
        brand: body.brand,
        skeleton_id: r.skeleton_id,
        content: r.content,
        caption: r.caption,
        photo_prompt: r.photo_prompt,
        costs: { copyUsd: r.metrics.totalCostUsd },
        log: [`copy ok (${r.skeleton_id}) — $${r.metrics.totalCostUsd.toFixed(4)}`],
      }
      writeState(slug, state)
      return NextResponse.json(state)
    }

    if (body.action === "art") {
      const state = readState(slug)
      if (!state?.photo_prompt) {
        return NextResponse.json(
          { error: "rode a action copy antes (sem photo_prompt no estado)" },
          { status: 400 },
        )
      }
      const art = await generateNanoBanana(state.photo_prompt, "bitmap")
      state.artUrl = art.url
      state.costs.artUsd = art.costUsd
      state.log.push(
        `bitmap ok ${art.width}x${art.height} — $${art.costUsd.toFixed(4)} (${art.model})`,
      )
      const clean = await editNanoBanana(CLEAN_PLATE_PROMPT, art.url)
      state.cleanUrl = clean.url
      state.costs.cleanUsd = clean.costUsd
      state.log.push(`clean plate ok — $${clean.costUsd.toFixed(4)}`)
      writeState(slug, state)
      return NextResponse.json(state)
    }

    if (body.action === "clean") {
      // Retry SÓ da clean plate: 2 de 4 casos do lote saíram com texto ainda
      // pintado no fundo (o edit do nano-banana falha silenciosamente nisso).
      // Refaz a limpeza a partir do MESMO bitmap e reconstrói o spec com as
      // medidas já extraídas — a extração mede o original, continua válida.
      const state = readState(slug)
      if (!state?.artUrl) {
        return NextResponse.json({ error: "rode art antes" }, { status: 400 })
      }
      const clean = await editNanoBanana(CLEAN_PLATE_PROMPT, state.artUrl)
      state.cleanUrl = clean.url
      state.costs.cleanUsd = (state.costs.cleanUsd ?? 0) + clean.costUsd
      state.log.push(`clean plate REFEITA — $${clean.costUsd.toFixed(4)}`)
      if (state.items?.length) {
        const patched = state.spec?.blocks
        state.spec = buildSpecFromLayout(clean.url, state.items)
        // Se o juiz já tinha aplicado patches nos blocos, preserva os blocos
        // patchados e troca só o fundo.
        if (patched && state.spec) {
          state.spec = {
            ...state.spec,
            blocks: patched,
          }
        }
      }
      writeState(slug, state)
      return NextResponse.json(state)
    }

    if (body.action === "extract") {
      const state = readState(slug)
      if (!state?.artUrl || !state.cleanUrl || !state.content) {
        return NextResponse.json({ error: "rode copy e art antes" }, { status: 400 })
      }
      const items = await extractTextLayout(state.artUrl, state.content)
      state.items = items
      state.spec = buildSpecFromLayout(state.cleanUrl, items)
      state.log.push(
        `extração ok — ${items.length} textos medidos, ${state.spec.blocks.length} blocos`,
      )
      writeState(slug, state)
      return NextResponse.json(state)
    }

    if (body.action === "save") {
      const state = readState(slug)
      if (!state?.spec || !state.artUrl || !state.cleanUrl) {
        return NextResponse.json(
          { error: "caso sem spec aprovado (rode o loop antes)" },
          { status: 400 },
        )
      }
      if (!body.saveBrandId || !body.thumbFile) {
        return NextResponse.json(
          { error: "saveBrandId e thumbFile obrigatórios" },
          { status: 400 },
        )
      }
      const admin = createAdminClient()
      // A brand precisa existir e o dono dela define a pasta do Storage.
      const { data: brand, error: brandErr } = await admin
        .from("brands")
        .select("id, user_id")
        .eq("id", body.saveBrandId)
        .single()
      if (brandErr || !brand) {
        return NextResponse.json({ error: "brand não encontrada" }, { status: 400 })
      }

      // 1) Fase 0 em miniatura: as URLs do Fal expiram — clean plate (fundo do
      //    post salvo) e bitmap original (dado do dataset) vão pro Storage.
      const cleanHosted = await rehostImage(admin, state.cleanUrl, brand.user_id, `${slug}-clean`)
      const artHosted = await rehostImage(admin, state.artUrl, brand.user_id, `${slug}-bitmap`)
      const spec: FreePostSpec = {
        ...state.spec,
        background: { ...state.spec.background, photo_url: cleanHosted },
      }

      // 2) Thumb: o render aprovado pelo juiz, do dir do caso.
      const thumbName = path.basename(body.thumbFile)
      const thumbPath = path.join(caseDir(slug), thumbName)
      if (!fs.existsSync(thumbPath)) {
        return NextResponse.json({ error: `thumb não existe: ${thumbName}` }, { status: 400 })
      }
      const thumbKey = `${brand.user_id}/piloto-${slug}-thumb-${Date.now()}.png`
      const { error: thumbErr } = await admin.storage
        .from("editorial-uploads")
        .upload(thumbKey, fs.readFileSync(thumbPath), { contentType: "image/png" })
      if (thumbErr) throw new Error(`upload da thumb falhou: ${thumbErr.message}`)
      const thumbUrl = admin.storage
        .from("editorial-uploads")
        .getPublicUrl(thumbKey).data.publicUrl

      // 3) O post na biblioteca real — mesmo shape do saveSinglePost.
      const { data: created, error: insertErr } = await admin
        .from("single_posts")
        .insert({
          brand_id: brand.id,
          template_id: `free:${state.skeleton_id ?? "auto"}`,
          title: body.title ?? `[Piloto] ${slug}`,
          raw_brief: state.briefing,
          content: {
            _free_spec: spec,
            _font_preset: "editorial",
            _format: "post",
            _photo_url: cleanHosted,
            _caption: state.caption ?? "",
          },
          rendered_image_url: thumbUrl,
        })
        .select("id")
        .single()
      if (insertErr || !created) {
        throw new Error(`insert falhou: ${insertErr?.message ?? "?"}`)
      }

      state.spec = spec
      state.savedPostId = created.id
      state.log.push(
        `salvo na biblioteca: ${created.id} (clean+bitmap re-hospedados no Storage)`,
      )
      writeState(slug, state)
      return NextResponse.json({
        ok: true,
        postId: created.id,
        editorPath: `/dashboard/editor/post-unico?post=${created.id}`,
        artHosted,
        cleanHosted,
      })
    }

    return NextResponse.json({ error: "action desconhecida" }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
