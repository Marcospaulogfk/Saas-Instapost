"use server"

// =====================================================================
// app/actions/inspiracoes.ts
// CRUD das fontes próprias de inspiração.
//
// A GERAÇÃO de ideias NÃO está aqui de propósito: ela chama o Claude com
// busca web e pode passar de 30s, então vive em /api/inspiracoes/gerar, que
// pode declarar `maxDuration`. Aqui ficam só as operações curtas.
// =====================================================================

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { extractFromUrl } from "@/lib/extract-url"
import {
  normalizarPalavraChave,
  normalizarUrlDeFonte,
} from "@/lib/inspiracoes/validacao"
import { sanitizarConteudoExterno } from "@/lib/inspiracoes/gerar-ideias"
import type { FonteKindImplementada, FontePayload } from "@/lib/inspiracoes/tipos"

type Result<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string }

const ROTA = "/dashboard/inspiracoes"

/** Teto de fontes por marca — segura custo e mantém a tela legível. */
const MAX_FONTES_POR_MARCA = 12

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

/**
 * Cadastra uma fonte de inspiração numa marca.
 *
 * Pra fonte de URL a gente já lê a página na hora do cadastro. Custa um fetch
 * a mais, mas: (1) valida na cara do usuário que o link é legível, em vez de
 * ele descobrir só quando clicar em gerar, e (2) dá um rótulo de verdade pro
 * card em vez de mostrar a URL crua.
 */
export async function adicionarFonte(input: {
  brandId: string
  kind: FonteKindImplementada
  value: string
}): Promise<Result<{ id: string }>> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: "Você precisa estar logado." }

  if (input.kind !== "url" && input.kind !== "keyword") {
    return { ok: false, error: "Esse tipo de fonte ainda não está disponível." }
  }

  const validado =
    input.kind === "url"
      ? normalizarUrlDeFonte(input.value)
      : normalizarPalavraChave(input.value)
  if (!validado.ok) return { ok: false, error: validado.erro }

  // Ownership explícito (a RLS já barraria, mas o erro fica claro).
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("id", input.brandId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!brand) return { ok: false, error: "Marca não encontrada." }

  const { count } = await supabase
    .from("inspiration_sources")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", input.brandId)
  if ((count ?? 0) >= MAX_FONTES_POR_MARCA) {
    return {
      ok: false,
      error: `Limite de ${MAX_FONTES_POR_MARCA} fontes por marca. Remova uma pra cadastrar outra.`,
    }
  }

  let label: string | null =
    input.kind === "keyword" ? validado.valor : null
  let payload: FontePayload = {}

  if (input.kind === "url") {
    try {
      const extraido = await extractFromUrl(validado.valor)
      // Conteúdo de terceiro: sanitizado ANTES de encostar no banco, pra que
      // nada bruto chegue no prompt depois (ver gerar-ideias.ts).
      const texto = sanitizarConteudoExterno(
        [extraido.title, extraido.description, extraido.text]
          .filter(Boolean)
          .join("\n"),
      )
      label = extraido.title?.trim() || null
      payload = {
        title: extraido.title || undefined,
        description: extraido.description || undefined,
        text: texto,
        fetched_at: new Date().toISOString(),
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "erro desconhecido"
      return {
        ok: false,
        error: `Não consegui abrir essa página (${msg}). Confira o link.`,
      }
    }
  }

  if (!label) {
    try {
      label = new URL(validado.valor).hostname.replace(/^www\./, "")
    } catch {
      label = validado.valor
    }
  }

  const { data, error } = await supabase
    .from("inspiration_sources")
    .insert({
      brand_id: input.brandId,
      kind: input.kind,
      value: validado.valor,
      label: label.slice(0, 200),
      payload,
    })
    .select("id")
    .single()

  if (error) {
    // 23505 = unique (brand_id, kind, value) da migration 0016.
    if (error.code === "23505") {
      return { ok: false, error: "Essa fonte já está cadastrada nesta marca." }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath(ROTA)
  return { ok: true, data: { id: data.id as string } }
}

/** Remove a fonte (e, por cascade, as ideias que saíram dela). */
export async function removerFonte(fonteId: string): Promise<Result> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: "Você precisa estar logado." }

  const { error } = await supabase
    .from("inspiration_sources")
    .delete()
    .eq("id", fonteId)
  if (error) return { ok: false, error: error.message }

  revalidatePath(ROTA)
  return { ok: true }
}

/** Descarta uma pauta que não serviu. Não devolve cota (ver custo.ts). */
export async function descartarIdeia(ideiaId: string): Promise<Result> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: "Você precisa estar logado." }

  const { error } = await supabase
    .from("inspiration_ideas")
    .delete()
    .eq("id", ideiaId)
  if (error) return { ok: false, error: error.message }

  revalidatePath(ROTA)
  return { ok: true }
}

/**
 * Marca a pauta como usada quando ela vira briefing no wizard.
 * Best-effort: se falhar, o usuário segue pra criação do mesmo jeito.
 */
export async function marcarIdeiaUsada(ideiaId: string): Promise<Result> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: "Você precisa estar logado." }

  const { error } = await supabase
    .from("inspiration_ideas")
    .update({ used_at: new Date().toISOString() })
    .eq("id", ideiaId)
  if (error) return { ok: false, error: error.message }

  revalidatePath(ROTA)
  return { ok: true }
}
