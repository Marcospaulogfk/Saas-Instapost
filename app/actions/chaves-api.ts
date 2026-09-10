"use server"

// =====================================================================
// app/actions/chaves-api.ts
// Criar e revogar a chave de integração da conta.
//
// A chave em claro existe UMA vez: no retorno de `criarChaveApi`. Depois
// disso só sobra o hash no banco, então não há tela, log nem suporte capaz
// de mostrar de novo — e é assim que tem que ser. Quem perde a chave gera
// outra e revoga a antiga.
//
// Quem ESCREVE na tabela é o service_role, nunca o client: é o servidor
// que calcula o hash, e deixar o browser inserir a linha permitiria gravar
// um hash sem chave correspondente (uma chave fantasma que nunca autentica)
// ou colar o hash de outra pessoa.
// =====================================================================

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { gerarChave } from "@/lib/chaves-api/chave"

/** Teto de chaves ATIVAS por conta. Passar disso é sinal de chave esquecida. */
const MAX_CHAVES_ATIVAS = 10

export type CriarChaveResultado =
  | { ok: true; chave: string; prefixo: string; id: string }
  | { ok: false; erro: string }

export async function criarChaveApi(nomeBruto: string): Promise<CriarChaveResultado> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, erro: "Faça login para gerar uma chave." }

  const nome = (nomeBruto || "").trim().slice(0, 60) || "Chave sem nome"

  const admin = createAdminClient()
  const { count, error: erroContagem } = await admin
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("revoked_at", null)
  if (erroContagem) {
    console.error("[chaves-api] falha ao contar chaves:", erroContagem.message)
    return { ok: false, erro: "Não consegui gerar a chave agora. Tente de novo." }
  }
  if ((count ?? 0) >= MAX_CHAVES_ATIVAS) {
    return {
      ok: false,
      erro: `Você já tem ${MAX_CHAVES_ATIVAS} chaves ativas. Revogue uma que não usa mais para criar outra.`,
    }
  }

  const nova = gerarChave()
  const { data, error } = await admin
    .from("api_keys")
    .insert({
      user_id: user.id,
      name: nome,
      prefix: nova.prefixo,
      key_hash: nova.hash,
    })
    .select("id")
    .single()

  if (error || !data) {
    console.error("[chaves-api] falha ao gravar a chave:", error?.message)
    return { ok: false, erro: "Não consegui gerar a chave agora. Tente de novo." }
  }

  revalidatePath("/dashboard/configuracoes")
  return { ok: true, chave: nova.chave, prefixo: nova.prefixo, id: data.id }
}

export type RevogarChaveResultado = { ok: true } | { ok: false; erro: string }

export async function revogarChaveApi(id: string): Promise<RevogarChaveResultado> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, erro: "Faça login para revogar uma chave." }

  const admin = createAdminClient()
  // O `eq("user_id")` é o que impede revogar a chave de outra conta com um
  // id chutado: o service_role não tem RLS pra segurar isso por nós.
  const { error } = await admin
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("revoked_at", null)

  if (error) {
    console.error("[chaves-api] falha ao revogar:", error.message)
    return { ok: false, erro: "Não consegui revogar a chave agora. Tente de novo." }
  }

  revalidatePath("/dashboard/configuracoes")
  return { ok: true }
}
