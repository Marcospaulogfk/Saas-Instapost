import type { SupabaseClient } from "@supabase/supabase-js"

// =====================================================================
// QUEM É O DONO DAS BRANDS QUE O WEBSYNC-OS ENXERGA.
//
// Isto existe por um motivo concreto, descoberto em 12/08/2026: este
// projeto do Supabase tem brands de MAIS DE UMA PESSOA. Além das do
// Marcos, há brands de clientes (Culturize-se, e uma segunda conta com
// Studio Ideação). Com a service_role, uma consulta sem filtro devolve
// TODAS.
//
// Se o CRM enxergasse todas, duas coisas ruins ficariam a um clique de
// distância: o seletor da tela de Marcas mostraria a brand de um cliente,
// e um post do Marcos poderia cair no calendário editorial de outra
// empresa. Nenhuma das duas dá erro na hora, e é isso que as torna
// perigosas.
//
// Por isso TODA rota da integração passa por aqui, inclusive a que só lê.
// =====================================================================

export type ResolucaoDono =
  | { ok: true; ownerId: string }
  | { ok: false; motivo: string }

/**
 * O dono, na ordem: a variável de ambiente manda; sem ela, se houver um
 * único dono entre as brands existentes, é ele. Com zero ou com mais de
 * um, recusa — adivinhar dono é o tipo de esperteza que só aparece depois,
 * no lugar errado.
 */
export async function resolverDono(admin: SupabaseClient): Promise<ResolucaoDono> {
  const doAmbiente = (process.env.WEBSYNC_BRAND_OWNER_ID ?? "").trim()
  if (doAmbiente) return { ok: true, ownerId: doAmbiente }

  const { data, error } = await admin.from("brands").select("user_id")
  if (error) return { ok: false, motivo: `falha ao descobrir o dono: ${error.message}` }

  const donos = [...new Set((data ?? []).map((b) => b.user_id).filter(Boolean))]
  if (donos.length === 1) {
    console.log("[websync-os] WEBSYNC_BRAND_OWNER_ID ausente, usando o único dono existente")
    return { ok: true, ownerId: donos[0] as string }
  }
  return {
    ok: false,
    motivo:
      donos.length === 0
        ? "não há nenhuma brand ainda e WEBSYNC_BRAND_OWNER_ID não está definido: não sei de quem seria a brand nova. Defina a variável com o seu UUID de auth.users."
        : "este projeto tem brands de mais de um dono e WEBSYNC_BRAND_OWNER_ID não está definido. Defina a variável, senão o CRM enxergaria brand de cliente.",
  }
}
