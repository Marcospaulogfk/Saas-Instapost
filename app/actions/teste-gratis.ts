"use server"

import { createClient } from "@/lib/supabase/server"
import { lerEstadoTeste } from "@/lib/teste-gratis"
import type { EstadoTeste } from "@/lib/teste-gratis-regra"

/**
 * Estado do teste grátis da conta logada, pro wizard de criação (que é
 * client) ajustar a tela: teto de 5 slides e a regra no lugar do custo em
 * tokens. Só LÊ: quem reserva a peça é a rota de geração.
 */
export async function getEstadoTesteGratis(): Promise<EstadoTeste> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return lerEstadoTeste(supabase, user?.id)
}
