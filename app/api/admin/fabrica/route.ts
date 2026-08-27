import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  converterGeracao,
  julgarGeracao,
  type ConversionRecord,
} from "@/lib/fabrica/pipeline"
import { rehostToStorage } from "@/lib/fabrica/capture"
import { resolverDono } from "@/lib/websync/dono"
import type { FreePostSpec } from "@/lib/single-posts/free-spec"
import type { SkeletonContent } from "@/lib/single-posts/skeletons"

// =====================================================================
// Operações do painel da fábrica (/dashboard/admin/fabrica).
//
// Route handler (e não server action) porque `converter` roda o pipeline
// inteiro — clean plate com retries + 3 chamadas de visão — e passa fácil
// de 60s. Gate manual de admin: aqui não há redirect, só 404, igual às
// páginas admin.
// =====================================================================

export const runtime = "nodejs"
export const maxDuration = 300

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

interface Body {
  action: "converter" | "julgar" | "aprovar" | "reprovar" | "promover" | "rehost"
  genId?: string
  motivo?: string
  /** promover: PNG do render aprovado (data URL) — vira a thumb do template. */
  thumbDataUrl?: string
  /** julgar: PNG do render atual (data URL) capturado pelo painel. */
  renderDataUrl?: string
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email?.toLowerCase()
  if (!email || !adminEmails().has(email)) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }
  if (!body.genId) {
    return NextResponse.json({ error: "genId obrigatório" }, { status: 400 })
  }
  const admin = createAdminClient()

  try {
    if (body.action === "converter") {
      const r = await converterGeracao(body.genId)
      return NextResponse.json(r)
    }

    if (body.action === "julgar") {
      if (!body.renderDataUrl) {
        return NextResponse.json({ error: "renderDataUrl obrigatório" }, { status: 400 })
      }
      const r = await julgarGeracao(body.genId, body.renderDataUrl)
      return NextResponse.json(r)
    }

    if (body.action === "rehost") {
      // Recuperação: linha capturada cujo re-host adiado falhou.
      const { data: gen } = await admin
        .from("post_generations")
        .select("id, user_id, fal_art_url, art_url")
        .eq("id", body.genId)
        .single()
      if (!gen) return NextResponse.json({ error: "não encontrada" }, { status: 404 })
      if (gen.art_url) return NextResponse.json({ ok: true, detalhe: "já hospedada" })
      const hosted = await rehostToStorage(
        admin,
        gen.fal_art_url,
        (gen.user_id as string | null) ?? "fabrica",
        "ger",
      )
      await admin.from("post_generations").update({ art_url: hosted }).eq("id", gen.id)
      return NextResponse.json({ ok: true, detalhe: "re-hospedada" })
    }

    if (body.action === "aprovar" || body.action === "reprovar") {
      const { data: gen } = await admin
        .from("post_generations")
        .select("id, conversion")
        .eq("id", body.genId)
        .single()
      if (!gen) return NextResponse.json({ error: "não encontrada" }, { status: 404 })
      const conv = (gen.conversion as ConversionRecord | null) ?? {}
      conv.judge_log = [
        ...(conv.judge_log ?? []),
        `${body.action === "aprovar" ? "APROVADA" : "REPROVADA"} por ${email}${body.motivo ? `: ${body.motivo}` : ""}`,
      ]
      await admin
        .from("post_generations")
        .update({
          pipeline_status: body.action === "aprovar" ? "aprovada" : "reprovada",
          conversion: conv,
        })
        .eq("id", body.genId)
      return NextResponse.json({ ok: true })
    }

    if (body.action === "promover") {
      const { data: gen } = await admin
        .from("post_generations")
        .select("id, niche, briefing, content, skeleton_id, conversion, user_id")
        .eq("id", body.genId)
        .single()
      if (!gen) return NextResponse.json({ error: "não encontrada" }, { status: 404 })
      const conv = (gen.conversion as ConversionRecord | null) ?? {}
      const spec = conv.spec as FreePostSpec | undefined
      if (!spec) {
        return NextResponse.json({ error: "geração sem spec convertido" }, { status: 400 })
      }

      // O template entra na biblioteca da CASA: primeira brand do dono
      // (resolverDono impede promover pra brand de cliente por engano).
      const dono = await resolverDono(admin)
      if (!dono.ok) return NextResponse.json({ error: dono.motivo }, { status: 409 })
      const { data: brand } = await admin
        .from("brands")
        .select("id, user_id")
        .eq("user_id", dono.ownerId)
        .order("created_at", { ascending: true })
        .limit(1)
        .single()
      if (!brand) return NextResponse.json({ error: "dono sem brand" }, { status: 409 })

      let thumbUrl: string | null = null
      const m = body.thumbDataUrl?.match(/^data:image\/png;base64,(.+)$/)
      if (m) {
        const key = `${brand.user_id}/template-${gen.id.slice(0, 8)}-${Date.now()}.png`
        const { error: upErr } = await admin.storage
          .from("editorial-uploads")
          .upload(key, Buffer.from(m[1], "base64"), { contentType: "image/png" })
        if (!upErr) {
          thumbUrl = admin.storage
            .from("editorial-uploads")
            .getPublicUrl(key).data.publicUrl
        }
      }

      const content = gen.content as SkeletonContent | null
      const titulo = (content?.title ?? gen.briefing ?? "template").slice(0, 60)
      const { data: created, error: insErr } = await admin
        .from("single_posts")
        .insert({
          brand_id: brand.id,
          template_id: `free:${gen.skeleton_id ?? "auto"}`,
          title: `[Template] ${gen.niche ? `${gen.niche} — ` : ""}${titulo}`,
          raw_brief: gen.briefing,
          content: {
            _free_spec: spec,
            _font_preset: "editorial",
            _format: "post",
            _photo_url: spec.background.photo_url ?? null,
            _caption: "",
          },
          rendered_image_url: thumbUrl,
        })
        .select("id")
        .single()
      if (insErr || !created) {
        return NextResponse.json(
          { error: `insert falhou: ${insErr?.message ?? "?"}` },
          { status: 500 },
        )
      }
      conv.judge_log = [...(conv.judge_log ?? []), `PROMOVIDA por ${email} → ${created.id}`]
      await admin
        .from("post_generations")
        .update({
          pipeline_status: "promovida",
          promoted_post_id: created.id,
          conversion: conv,
        })
        .eq("id", body.genId)
      return NextResponse.json({
        ok: true,
        postId: created.id,
        editorPath: `/dashboard/editor/post-unico?post=${created.id}`,
      })
    }

    return NextResponse.json({ error: "action desconhecida" }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
