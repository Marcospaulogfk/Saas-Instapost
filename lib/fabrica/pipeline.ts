import Anthropic from "@anthropic-ai/sdk"
import { MODEL_MECANICO } from "@/lib/generation/models"
import { imageBlockFor } from "@/lib/generation/fetch-image"
import { editNanoBanana } from "@/lib/generation/nano-banana"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  buildSpecFromLayout,
  extractTextLayout,
  type MeasuredText,
} from "@/lib/single-posts/extract-layout"
import { detectAnchors, snapToAnchors, type Anchor } from "./anchors"
import { aplicarPatches, julgarRender, type JudgeVerdict } from "./judge"
import { rehostToStorage } from "./capture"
import type { SkeletonContent } from "@/lib/single-posts/skeletons"
import type { FreePostSpec } from "@/lib/single-posts/free-spec"

// =====================================================================
// O motor da fábrica: converte uma geração capturada (bitmap) em spec
// editável, com as regras aprendidas nos pilotos de 26/08 EM CÓDIGO:
//
//  1) clean plate com JUIZ e até 3 tentativas — ela falha ~50% na 1ª
//     (deixa texto pintado) e retry resolve;
//  2) âncoras: os elementos vazios que a limpeza preserva marcam o lugar
//     dos textos (snapToAnchors);
//  3) composição em cqw com folga e glifo por fonte (buildSpecFromLayout).
//
// O resultado para em `aguardando_revisao`: o julgamento final é humano,
// no painel /dashboard/admin/fabrica (original vs render lado a lado).
// =====================================================================

/** Mesmo prompt do free-generate/harness — a fonte canônica agora é esta. */
export const CLEAN_PLATE_PROMPT =
  "Erase every single piece of text from this image — headlines, small body text, captions, bullet list text, labels inside buttons and pills, prices, numbers, usernames, watermarks. No letters or digits of any size may remain anywhere. Keep untouched: the photograph, background colors, panels, gradients, shapes, pill/button shapes (now empty) and small icons without letters. Where text was erased, seamlessly continue the surface behind it. Do not add anything new."

const MAX_CLEAN_ATTEMPTS = 3

interface CleanJudgeVerdict {
  limpa: boolean
  restos: string[]
}

const JUDGE_TOOL: Anthropic.Messages.Tool = {
  name: "entregar_veredito",
  description: "Diz se a imagem está livre de texto legível.",
  input_schema: {
    type: "object" as const,
    properties: {
      limpa: { type: "boolean" },
      restos: {
        type: "array",
        items: { type: "string" },
        description: "Textos ainda legíveis na imagem (vazio se limpa).",
      },
    },
    required: ["limpa", "restos"],
  },
}

/** Juiz da clean plate: sobrou texto legível? */
export async function judgeCleanPlate(cleanUrl: string): Promise<CleanJudgeVerdict> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY ausente")
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const res = await client.messages.create({
    model: MODEL_MECANICO,
    max_tokens: 800,
    temperature: 0,
    tools: [JUDGE_TOOL],
    tool_choice: { type: "tool", name: "entregar_veredito" },
    messages: [
      {
        role: "user",
        content: [
          (await imageBlockFor(cleanUrl)) as Anthropic.Messages.ContentBlockParam,
          {
            type: "text",
            text: "Esta imagem deveria estar SEM NENHUM texto (letras ou dígitos legíveis). Ícones, formas e cápsulas vazias são permitidos. Há texto legível sobrando? Liste o que ainda se lê.",
          },
        ],
      },
    ],
  })
  const block = res.content.find((b) => b.type === "tool_use")
  if (!block || block.type !== "tool_use") throw new Error("juiz não respondeu")
  const v = block.input as CleanJudgeVerdict
  return { limpa: !!v.limpa, restos: v.restos ?? [] }
}

export interface CleanPlateResult {
  url: string
  attempts: number
  approved: boolean
  restos: string[]
  costUsd: number
}

/**
 * Gera a clean plate com juiz no loop: tenta até MAX_CLEAN_ATTEMPTS. Se
 * nenhuma passar, devolve a última mesmo assim com `approved: false` — o
 * humano decide no painel se aproveita ou reprova.
 */
export async function ensureCleanPlate(artUrl: string): Promise<CleanPlateResult> {
  let last: CleanPlateResult | null = null
  let cost = 0
  for (let attempt = 1; attempt <= MAX_CLEAN_ATTEMPTS; attempt++) {
    const clean = await editNanoBanana(CLEAN_PLATE_PROMPT, artUrl)
    cost += clean.costUsd
    const verdict = await judgeCleanPlate(clean.url)
    last = {
      url: clean.url,
      attempts: attempt,
      approved: verdict.limpa,
      restos: verdict.restos,
      costUsd: cost,
    }
    if (verdict.limpa) return last
  }
  return last as CleanPlateResult
}

export interface JulgamentoResultado {
  ok: boolean
  score: number
  aprovado: boolean
  problemas: string[]
  patchesAplicados: number
  spec?: FreePostSpec
  detalhe?: string
}

/**
 * Uma iteração do loop juiz-com-render: recebe o PNG do render (capturado
 * pelo chamador — painel ou harness), compara com o original, aplica os
 * patches no spec e persiste. Aprovou → pipeline_status "aprovada".
 * O chamador re-renderiza o spec devolvido e chama de novo até aprovar
 * (ou desistir — 3 iterações é o teto que os pilotos validaram).
 */
export async function julgarGeracao(
  genId: string,
  renderDataUrl: string,
): Promise<JulgamentoResultado> {
  const admin = createAdminClient()
  const { data: gen, error } = await admin
    .from("post_generations")
    .select("id, art_url, fal_art_url, conversion, pipeline_status")
    .eq("id", genId)
    .single()
  if (error || !gen) {
    return { ok: false, score: 0, aprovado: false, problemas: [], patchesAplicados: 0, detalhe: "geração não encontrada" }
  }
  const conv = (gen.conversion as ConversionRecord | null) ?? {}
  const spec = conv.spec
  const originalUrl: string | null = gen.art_url ?? gen.fal_art_url
  if (!spec || !originalUrl) {
    return { ok: false, score: 0, aprovado: false, problemas: [], patchesAplicados: 0, detalhe: "sem spec convertido ou sem original" }
  }

  let verdict: JudgeVerdict
  try {
    verdict = await julgarRender(originalUrl, renderDataUrl, spec)
  } catch (err) {
    return {
      ok: false, score: 0, aprovado: false, problemas: [], patchesAplicados: 0,
      detalhe: err instanceof Error ? err.message : String(err),
    }
  }

  const novoSpec = verdict.patches.length ? aplicarPatches(spec, verdict.patches) : spec
  conv.spec = novoSpec
  conv.judge_log = [
    ...(conv.judge_log ?? []),
    `juiz-auto: score ${verdict.score}${verdict.aprovado ? " APROVADO" : ""} — ${verdict.patches.length} patch(es)${verdict.problemas.length ? ` | ${verdict.problemas.join("; ")}` : ""}`,
  ]
  await admin
    .from("post_generations")
    .update({
      conversion: conv,
      ...(verdict.aprovado ? { pipeline_status: "aprovada" } : {}),
    })
    .eq("id", genId)

  return {
    ok: true,
    score: verdict.score,
    aprovado: verdict.aprovado,
    problemas: verdict.problemas,
    patchesAplicados: verdict.patches.length,
    spec: novoSpec,
  }
}

export interface ConversionRecord {
  items?: MeasuredText[]
  anchors?: Anchor[]
  spec?: FreePostSpec
  clean_attempts?: number
  clean_approved?: boolean
  clean_restos?: string[]
  cost_usd?: number
  error?: string
  judge_log?: string[]
}

type Admin = ReturnType<typeof createAdminClient>

async function setStatus(
  admin: Admin,
  genId: string,
  status: string,
  conversion?: ConversionRecord,
): Promise<void> {
  const patch: Record<string, unknown> = { pipeline_status: status }
  if (conversion !== undefined) patch.conversion = conversion
  const { error } = await admin
    .from("post_generations")
    .update(patch)
    .eq("id", genId)
  if (error) throw new Error(`update falhou: ${error.message}`)
}

export interface ConversaoResultado {
  ok: boolean
  status: string
  detalhe: string
}

/**
 * Converte uma geração capturada em spec editável e para em
 * `aguardando_revisao`. Erro técnico volta pra `capturada` com o motivo em
 * conversion.error — dá pra re-tentar do painel.
 */
export async function converterGeracao(genId: string): Promise<ConversaoResultado> {
  const admin = createAdminClient()
  const { data: gen, error } = await admin
    .from("post_generations")
    .select("id, user_id, content, art_url, fal_art_url, clean_url, conversion")
    .eq("id", genId)
    .single()
  if (error || !gen) return { ok: false, status: "?", detalhe: "geração não encontrada" }

  const artUrl: string | null = gen.art_url ?? gen.fal_art_url
  const content = gen.content as SkeletonContent | null
  if (!artUrl) return { ok: false, status: "capturada", detalhe: "sem arte" }
  if (!content) {
    await setStatus(admin, genId, "reprovada", {
      ...(gen.conversion as ConversionRecord | null),
      error: "geração sem content — não há textos conhecidos pra medir",
    })
    return { ok: false, status: "reprovada", detalhe: "sem content" }
  }

  const conv: ConversionRecord = { judge_log: [] }
  try {
    // 1) Clean plate com juiz + retry.
    await setStatus(admin, genId, "limpando")
    const clean = await ensureCleanPlate(artUrl)
    conv.clean_attempts = clean.attempts
    conv.clean_approved = clean.approved
    conv.clean_restos = clean.restos
    conv.cost_usd = clean.costUsd
    conv.judge_log?.push(
      clean.approved
        ? `clean plate aprovada na tentativa ${clean.attempts}`
        : `clean plate NÃO limpou em ${clean.attempts} tentativas (restos: ${clean.restos.join("; ")})`,
    )
    // Cópia permanente — a URL do Fal expira.
    const folder = (gen.user_id as string | null) ?? "fabrica"
    const cleanHosted = await rehostToStorage(admin, clean.url, folder, "clean")
    await admin
      .from("post_generations")
      .update({ fal_clean_url: clean.url, clean_url: cleanHosted })
      .eq("id", genId)

    // 2) Extração (mede o ORIGINAL) + âncoras (mede a clean).
    const items = await extractTextLayout(artUrl, content)
    conv.items = items
    await setStatus(admin, genId, "extraida", conv)

    let anchors: Anchor[] = []
    try {
      anchors = await detectAnchors(cleanHosted)
    } catch (err) {
      conv.judge_log?.push(
        `âncoras falharam (segue sem snap): ${err instanceof Error ? err.message : err}`,
      )
    }
    conv.anchors = anchors

    // 3) Composição com as regras do lote.
    const snapped = snapToAnchors(items, anchors)
    conv.spec = buildSpecFromLayout(cleanHosted, snapped)
    await setStatus(admin, genId, "aguardando_revisao", conv)
    return {
      ok: true,
      status: "aguardando_revisao",
      detalhe: `${conv.spec.blocks.length} camadas; clean em ${clean.attempts} tentativa(s)${clean.approved ? "" : " (NÃO aprovada)"}; ${anchors.length} âncora(s)`,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    conv.error = msg
    await setStatus(admin, genId, "capturada", conv).catch(() => {})
    return { ok: false, status: "capturada", detalhe: msg }
  }
}
