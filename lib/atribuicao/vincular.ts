// =====================================================================
// lib/atribuicao/vincular.ts
// Vincula um usuário recém-criado à origem de aquisição que ficou no
// cookie nx_ft (posto pelo middleware no primeiro hit). Serve pro login
// com Google, que não passa pelo signUp com metadata. Espelha o padrão de
// lib/indicacao/vincular.ts. Idempotente por natureza: só grava se
// first_touch ainda estiver null, então chamar de novo não sobrescreve.
// Nunca lança.
// =====================================================================

import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import { parsePrimeiroToqueCookie } from "@/lib/atribuicao/parse"

const FT_COOKIE = "nx_ft"

export async function vincularPrimeiroToquePeloCookie(userId: string): Promise<void> {
  try {
    const jar = await cookies()
    const dados = parsePrimeiroToqueCookie(jar.get(FT_COOKIE)?.value)
    if (!dados) return

    const admin = createAdminClient()
    const { error } = await admin
      .from("users")
      .update({ first_touch: dados })
      .eq("id", userId)
      .is("first_touch", null)
    if (error) {
      console.error("[atribuicao] falha ao gravar primeiro toque:", error.message)
    }
  } catch (e) {
    console.error("[atribuicao] vínculo pelo cookie falhou:", e)
  }
}
