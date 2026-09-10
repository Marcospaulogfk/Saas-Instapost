import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import { erroJson } from "@/lib/calendario/resposta"
import { hashChave, pareceChave, PREFIXO_CHAVE } from "./chave"

// =====================================================================
// lib/chaves-api/autenticar.ts
// A porta de entrada de TODA rota /api/v1/*.
//
// A regra que não pode ser quebrada: quem é o dono da conta sai DA CHAVE.
// Nunca de variável de ambiente, nunca do resolverDono (que responde
// "o dono do servidor" e por isso não serve pra chave de cliente).
//
// Chave inexistente, malformada e revogada respondem a MESMA coisa: 401
// "chave inválida". Distinguir os casos entregaria de graça a informação
// de que um determinado prefixo já existiu.
//
// `last_used_at` é carimbado em toda chamada, mas sem esperar o banco: é
// telemetria pro dono ("essa integração ainda roda?"), e fazer a resposta
// esperar por um update dobra a latência de um GET que só lê.
// =====================================================================

const HEADER = "authorization"

/** Teto de chamadas por chave, por minuto. */
const LIMITE_POR_MINUTO = 60
const JANELA_MS = 60_000

interface Balde {
  contagem: number
  reiniciaEm: number
}

// Em memória de propósito: com uma instância só, resolve o caso real (um
// laço no n8n disparando mil vezes). Se um dia houver várias instâncias,
// isto vira Redis — e até lá seria complexidade paga adiantado.
const baldes = new Map<string, Balde>()

/** Deixa passar? Devolve também quantos segundos faltam pra liberar. */
export function dentroDoLimite(chaveId: string, agora = Date.now()) {
  const balde = baldes.get(chaveId)
  if (!balde || agora >= balde.reiniciaEm) {
    baldes.set(chaveId, { contagem: 1, reiniciaEm: agora + JANELA_MS })
    return { ok: true as const }
  }
  if (balde.contagem >= LIMITE_POR_MINUTO) {
    return {
      ok: false as const,
      esperarSegundos: Math.max(1, Math.ceil((balde.reiniciaEm - agora) / 1000)),
    }
  }
  balde.contagem += 1
  return { ok: true as const }
}

export interface Conta {
  chaveId: string
  userId: string
  admin: SupabaseClient
}

export type Autenticacao =
  | { ok: true; conta: Conta }
  | { ok: false; resposta: Response }

/** Lê o "Bearer nxc_live_..." do header. Aceita o valor cru também. */
function lerChave(req: Request): string | null {
  const bruto = (req.headers.get(HEADER) ?? "").trim()
  if (!bruto) return null
  const semBearer = bruto.replace(/^Bearer\s+/i, "").trim()
  return semBearer || null
}

export async function autenticar(req: Request): Promise<Autenticacao> {
  const chave = lerChave(req)
  if (!chave) {
    return {
      ok: false,
      resposta: erroJson(
        401,
        "chave_ausente",
        `envie a sua chave no cabeçalho: Authorization: Bearer ${PREFIXO_CHAVE}...`,
      ),
    }
  }

  const invalida = () => ({
    ok: false as const,
    resposta: erroJson(
      401,
      "chave_invalida",
      "chave inválida ou revogada. Gere outra em Configurações > Integração.",
    ),
  })

  if (!pareceChave(chave)) return invalida()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("api_keys")
    .select("id, user_id, revoked_at")
    .eq("key_hash", hashChave(chave))
    .maybeSingle()

  if (error) {
    console.error("[api/v1] falha ao ler a chave:", error.message)
    return {
      ok: false,
      resposta: erroJson(500, "falha_interna", "falha ao validar a chave"),
    }
  }
  if (!data || data.revoked_at) return invalida()

  const limite = dentroDoLimite(data.id)
  if (!limite.ok) {
    return {
      ok: false,
      resposta: erroJson(
        429,
        "limite_excedido",
        `esta chave passou de ${LIMITE_POR_MINUTO} chamadas por minuto. Tente de novo em ${limite.esperarSegundos}s.`,
      ),
    }
  }

  // Sem await: o dono quer saber se a chave é usada, não quer pagar
  // latência por isso. Falha de update não pode derrubar a chamada.
  void admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(({ error: erroUso }) => {
      if (erroUso) console.warn("[api/v1] last_used_at não gravado:", erroUso.message)
    })

  return { ok: true, conta: { chaveId: data.id, userId: data.user_id, admin } }
}
