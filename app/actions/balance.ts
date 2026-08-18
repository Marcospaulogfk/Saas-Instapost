"use server"

import { getProfile } from "@/lib/data/queries"

/**
 * Saldo de tokens pro preview de custo do wizard.
 *
 * O wizard de criação é client component (o step vive na URL), então não dá
 * pra ler o perfil direto — e o preview de custo precisa do saldo pra mostrar
 * "Custo X · Saldo Y" e barrar antes de gerar, em vez de deixar o usuário
 * descobrir que não tinha token depois de escrever o briefing inteiro.
 *
 * Devolve `null` quando não há sessão: o preview some em vez de mostrar zero
 * (a geração sem login roda, só não debita).
 */
export async function getTokenBalance(): Promise<number | null> {
  try {
    const { profile } = await getProfile()
    return profile?.credits ?? null
  } catch {
    return null
  }
}
