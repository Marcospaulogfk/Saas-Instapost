"use server"

// =====================================================================
// app/actions/afiliados.ts
// Server actions do programa de AFILIADOS.
//
// Candidatura: pública (funciona deslogado), via RPC security definer.
// Aprovar/rejeitar: só admin (ADMIN_EMAILS), escreve com service_role.
// Carteira: o próprio afiliado edita o walletId do Asaas.
// Nada aqui cria comissão: isso é exclusividade do webhook de pagamento
// (lib/billing/apply.ts -> lib/afiliados/comissao.ts).
// =====================================================================

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireUser } from "@/lib/data/queries"
import { isAdminUser } from "@/lib/admin"
import {
  COOKIE_AFILIADO,
  codigoAfiliadoValido,
  mensagemCandidatura,
  normalizarCodigoAfiliado,
  type ResultadoCandidatura,
} from "@/lib/afiliados/config"

export type ActionResult = { ok: boolean; mensagem: string }

const ERRO_GENERICO = "Não deu pra concluir agora. Tente de novo em instantes."

const candidaturaSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  instagram: z.string().trim().max(80).optional().or(z.literal("")),
  reason: z.string().trim().min(10, "Conte em pelo menos uma frase por que quer ser afiliado.").max(2000),
  ads_plan: z.string().trim().max(500).optional().or(z.literal("")),
  channels: z.string().trim().max(1000).optional().or(z.literal("")),
})

/**
 * Candidatura ao programa. Funciona logado ou não: se houver sessão, o
 * user_id vai junto e a linha já nasce vinculada à conta.
 */
export async function candidatarAfiliado(formData: FormData): Promise<ActionResult> {
  const parsed = candidaturaSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp") ?? "",
    instagram: formData.get("instagram") ?? "",
    reason: formData.get("reason"),
    ads_plan: formData.get("ads_plan") ?? "",
    channels: formData.get("channels") ?? "",
  })
  if (!parsed.success) {
    const primeiro = parsed.error.issues[0]?.message ?? mensagemCandidatura("dados_invalidos")
    return { ok: false, mensagem: primeiro }
  }
  const d = parsed.data

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase.rpc("candidatar_afiliado", {
      p_user_id: user?.id ?? null,
      p_name: d.name,
      p_email: d.email,
      p_whatsapp: d.whatsapp || null,
      p_instagram: d.instagram || null,
      p_reason: d.reason,
      p_ads_plan: d.ads_plan || null,
      p_channels: d.channels || null,
    })

    if (error) {
      console.error("[afiliados] candidatar_afiliado falhou:", error.message)
      return { ok: false, mensagem: ERRO_GENERICO }
    }

    const resultado = (data ?? "dados_invalidos") as ResultadoCandidatura
    if (resultado === "ok") {
      // TODO(e-mail): não existe provedor de e-mail no repo. Quando houver,
      // avisar o dono (nova candidatura) e o candidato (recebemos). Até lá,
      // a fila mora em /dashboard/admin/afiliados.
      revalidatePath("/dashboard/afiliados")
      revalidatePath("/dashboard/admin/afiliados")
    }
    return { ok: resultado === "ok", mensagem: mensagemCandidatura(resultado) }
  } catch (err) {
    console.error("[afiliados] erro inesperado na candidatura:", err)
    return { ok: false, mensagem: ERRO_GENERICO }
  }
}

const walletSchema = z.string().trim().max(120)

/** Admin: aprova a candidatura (com comissão e carteira opcionais). */
export async function aprovarAfiliado(
  id: string,
  opts: { commissionPct?: number; walletId?: string; notes?: string } = {},
): Promise<ActionResult> {
  if (!(await isAdminUser())) return { ok: false, mensagem: "Sem permissão." }
  const pct = opts.commissionPct
  if (pct != null && (!Number.isFinite(pct) || pct < 0 || pct > 100)) {
    return { ok: false, mensagem: "Comissão deve ficar entre 0 e 100." }
  }
  try {
    const admin = createAdminClient()
    const patch: Record<string, unknown> = {
      status: "approved",
      reviewed_at: new Date().toISOString(),
    }
    if (pct != null) patch.commission_pct = pct
    if (opts.walletId != null) patch.asaas_wallet_id = walletSchema.parse(opts.walletId) || null
    if (opts.notes != null) patch.notes = opts.notes.trim() || null

    const { error } = await admin.from("affiliates").update(patch).eq("id", id)
    if (error) {
      console.error("[afiliados] aprovar falhou:", error.message)
      return { ok: false, mensagem: ERRO_GENERICO }
    }
    // TODO(e-mail): avisar o afiliado que foi aprovado (sem provedor no repo).
    revalidatePath("/dashboard/admin/afiliados")
    revalidatePath("/dashboard/afiliados")
    return { ok: true, mensagem: "Afiliado aprovado." }
  } catch (err) {
    console.error("[afiliados] erro ao aprovar:", err)
    return { ok: false, mensagem: ERRO_GENERICO }
  }
}

/** Admin: rejeita a candidatura. */
export async function rejeitarAfiliado(id: string, notes?: string): Promise<ActionResult> {
  if (!(await isAdminUser())) return { ok: false, mensagem: "Sem permissão." }
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from("affiliates")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        notes: notes?.trim() || null,
      })
      .eq("id", id)
    if (error) {
      console.error("[afiliados] rejeitar falhou:", error.message)
      return { ok: false, mensagem: ERRO_GENERICO }
    }
    // TODO(e-mail): avisar o candidato (sem provedor no repo).
    revalidatePath("/dashboard/admin/afiliados")
    revalidatePath("/dashboard/afiliados")
    return { ok: true, mensagem: "Candidatura rejeitada." }
  } catch (err) {
    console.error("[afiliados] erro ao rejeitar:", err)
    return { ok: false, mensagem: ERRO_GENERICO }
  }
}

/** Afiliado (logado) salva o walletId da própria conta Asaas. */
export async function salvarCarteiraAfiliado(walletId: string): Promise<ActionResult> {
  const parsed = walletSchema.safeParse(walletId ?? "")
  if (!parsed.success) return { ok: false, mensagem: "walletId inválido." }
  try {
    const { user } = await requireUser()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("affiliates")
      .update({ asaas_wallet_id: parsed.data || null })
      .eq("user_id", user.id)
      .eq("status", "approved")
      .select("id")
    if (error) {
      console.error("[afiliados] salvar carteira falhou:", error.message)
      return { ok: false, mensagem: ERRO_GENERICO }
    }
    if (!data?.length) return { ok: false, mensagem: "Só afiliados aprovados podem cadastrar carteira." }
    revalidatePath("/dashboard/afiliados")
    return {
      ok: true,
      mensagem: parsed.data
        ? "Carteira salva. As próximas comissões saem por split automático."
        : "Carteira removida. As comissões ficam a pagar por Pix manual.",
    }
  } catch (err) {
    console.error("[afiliados] erro ao salvar carteira:", err)
    return { ok: false, mensagem: ERRO_GENERICO }
  }
}

/** Lê o código de afiliado gravado pelo middleware (`?af=`), ou null. */
export async function lerCodigoAfiliadoDoCookie(): Promise<string | null> {
  const jar = await cookies()
  const raw = jar.get(COOKIE_AFILIADO)?.value
  if (!raw) return null
  const code = normalizarCodigoAfiliado(raw)
  return codigoAfiliadoValido(code) ? code : null
}
