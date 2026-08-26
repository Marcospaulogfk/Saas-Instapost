import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
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
// Rota DEV-ONLY, sem auth, sem débito de token, sem Supabase: cada etapa do
// loop vira uma action, e o estado vive em .pilot/state.json na raiz do repo.
// Apagar junto com app/debug/pilot quando o piloto terminar.
// =============================================================================

export const runtime = "nodejs"
export const maxDuration = 300

const STATE_DIR = path.join(process.cwd(), ".pilot")
const STATE_FILE = path.join(STATE_DIR, "state.json")

// Mesmo prompt do free-generate.ts (lá é const privada do módulo).
const CLEAN_PLATE_PROMPT =
  "Erase every single piece of text from this image — headlines, small body text, captions, bullet list text, labels inside buttons and pills, prices, numbers, usernames, watermarks. No letters or digits of any size may remain anywhere. Keep untouched: the photograph, background colors, panels, gradients, shapes, pill/button shapes (now empty) and small icons without letters. Where text was erased, seamlessly continue the surface behind it. Do not add anything new."

interface PilotState {
  briefing: string
  brand: PostBrand
  skeleton_id?: string
  content?: SkeletonContent
  photo_prompt?: string | null
  artUrl?: string
  cleanUrl?: string
  items?: MeasuredText[]
  spec?: FreePostSpec
  costs: Record<string, number>
  log: string[]
}

function readState(): PilotState | null {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as PilotState
  } catch {
    return null
  }
}

function writeState(s: PilotState): void {
  fs.mkdirSync(STATE_DIR, { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2))
}

function guard(): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
  return null
}

export async function GET() {
  const g = guard()
  if (g) return g
  const state = readState()
  if (!state) return NextResponse.json({ error: "sem estado" }, { status: 404 })
  return NextResponse.json(state)
}

export async function POST(req: Request) {
  const g = guard()
  if (g) return g
  const body = (await req.json()) as {
    action: "copy" | "art" | "extract" | "save-render"
    briefing?: string
    brand?: PostBrand
    dataUrl?: string
  }

  try {
    if (body.action === "save-render") {
      const m = body.dataUrl?.match(/^data:image\/png;base64,(.+)$/)
      if (!m) return NextResponse.json({ error: "dataUrl inválido" }, { status: 400 })
      fs.mkdirSync(STATE_DIR, { recursive: true })
      const file = path.join(STATE_DIR, "render.png")
      fs.writeFileSync(file, Buffer.from(m[1], "base64"))
      return NextResponse.json({ ok: true, file })
    }

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
        photo_prompt: r.photo_prompt,
        costs: { copyUsd: r.metrics.totalCostUsd },
        log: [`copy ok (${r.skeleton_id}) — $${r.metrics.totalCostUsd.toFixed(4)}`],
      }
      writeState(state)
      return NextResponse.json(state)
    }

    if (body.action === "art") {
      const state = readState()
      if (!state?.photo_prompt) {
        return NextResponse.json(
          { error: "rode a action copy antes (sem photo_prompt no estado)" },
          { status: 400 },
        )
      }
      const art = await generateNanoBanana(state.photo_prompt, "bitmap")
      state.artUrl = art.url
      state.costs.artUsd = art.costUsd
      state.log.push(`bitmap ok ${art.width}x${art.height} — $${art.costUsd.toFixed(4)} (${art.model})`)
      const clean = await editNanoBanana(CLEAN_PLATE_PROMPT, art.url)
      state.cleanUrl = clean.url
      state.costs.cleanUsd = clean.costUsd
      state.log.push(`clean plate ok — $${clean.costUsd.toFixed(4)}`)
      writeState(state)
      return NextResponse.json(state)
    }

    if (body.action === "extract") {
      const state = readState()
      if (!state?.artUrl || !state.cleanUrl || !state.content) {
        return NextResponse.json(
          { error: "rode copy e art antes" },
          { status: 400 },
        )
      }
      const items = await extractTextLayout(state.artUrl, state.content)
      state.items = items
      state.spec = buildSpecFromLayout(state.cleanUrl, items)
      state.log.push(`extração ok — ${items.length} textos medidos, ${state.spec.blocks.length} blocos`)
      writeState(state)
      return NextResponse.json(state)
    }

    return NextResponse.json({ error: "action desconhecida" }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
