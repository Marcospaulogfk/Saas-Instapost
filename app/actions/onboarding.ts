"use server"

// =====================================================================
// app/actions/onboarding.ts
// Etapa "como você vai usar o Nexus?" (estilo Canva), pós-cadastro.
// Skippable por design: não chamar esta action (botão "Pular") é uma opção
// válida — o valor fica null pra sempre, sem bloquear nada.
// =====================================================================

import { createClient } from "@/lib/supabase/server"
import { isObjetivoUsoValido } from "@/lib/onboarding/objetivo"

export async function salvarObjetivoUso(objetivo: string): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }
  if (!isObjetivoUsoValido(objetivo)) return { ok: false }

  const { error } = await supabase.from("users").update({ objetivo_uso: objetivo }).eq("id", user.id)
  if (error) {
    console.error("[onboarding] salvarObjetivoUso:", error.message)
    return { ok: false }
  }
  return { ok: true }
}
