// =====================================================================
// lib/indicacao/vincular.ts
// Vincula um usuário recém-criado ao código de indicação que ficou no
// cookie nx_ref (posto em /cadastro?ref=). Serve pro login com Google, que
// não carrega metadata no signUp, e como segunda chance pro cadastro por
// e-mail. Idempotente: registrar_indicacao devolve 'ja_vinculado' se o
// trigger já fez o trabalho. Nunca lança.
// =====================================================================

import { createAdminClient } from "@/lib/supabase/admin"
import { codigoTemFormatoValido, normalizarCodigo } from "@/lib/indicacao/config"

export async function vincularIndicacaoPeloCookie(
  userId: string,
  codigoBruto: string,
): Promise<string> {
  const codigo = normalizarCodigo(codigoBruto)
  if (!codigoTemFormatoValido(codigo)) return "codigo_invalido"
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc("registrar_indicacao", {
      p_referred_id: userId,
      p_code: codigo,
    })
    if (error) return `erro:${error.message}`
    return String(data ?? "erro")
  } catch (e) {
    return `erro:${e instanceof Error ? e.message : String(e)}`
  }
}
