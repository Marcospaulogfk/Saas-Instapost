import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// =====================================================================
// lib/teste-gratis.ts
// A regra do teste grátis por PEÇA (decisão do Marcos, 10/09/2026):
// a conta grátis gera UM carrossel de até 5 slides OU até 3 posts únicos.
//
// Quem decide é o banco (RPC reservar_peca_teste, migration 0029), numa
// transação com lock na linha do usuário. Aqui só fica o jeito de as rotas
// perguntarem e a resposta de upgrade que a tela já sabe mostrar (toda tela
// de geração exibe o `error` de uma resposta não-ok).
//
// ONDE a peça conta: onde a peça NASCE de verdade.
//   - carrossel: no roteiro (generate-script, generate-stream,
//     projects/generate, teste-gerar). Regerar o roteiro é outro carrossel;
//     se não fosse, dava pra fazer 2 carrosséis "regerando" o primeiro.
//   - post único: na ARTE (free-generate nos modos aprovado e completo, e
//     post-unico/generate). O rascunho de texto não conta, pra pessoa poder
//     tentar de novo a copy antes de gastar a peça; ele segue cobrando os
//     4 tokens de sempre, então não vira porta aberta.
//
// Tokens no teste: a arte de uma peça reservada NÃO debita, porque 3 posts
// custam 87 pela tabela e o trial tem 45. Quem limita é o contador. Os 45
// continuam pagando o resto (rascunhos, imagens do carrossel, trocar foto),
// o que também põe teto em regeração de imagem.
//
// Se a RPC falhar (banco fora, migration não aplicada), a rota SEGUE sem a
// regra e loga: mesma decisão antiga de "cobrança nunca trava o usuário".
// O pior caso é o comportamento de antes (45 tokens), nunca um bloqueio
// injusto de quem pagou.
// =====================================================================

export type TipoPeca = "carrossel" | "post_unico"

/** Teto de slides de um carrossel gerado no teste grátis. */
export const MAX_SLIDES_TESTE = 5

export const MENSAGEM_TESTE_ESGOTADO =
  "Seu teste grátis já foi usado: ele inclui 1 carrossel de até 5 slides ou até 3 posts únicos. Para continuar criando, escolha um plano em /pricing."

export type Reserva =
  /** Fora da regra (assinante, saldo comprado, conta antiga): segue livre. */
  | { ok: true; noTeste: false }
  /** Peça do teste reservada. Guarde o id pra liberar se a geração falhar. */
  | { ok: true; noTeste: true; id: string }
  /** Teste esgotado: devolva `resposta` (402 com o aviso de upgrade). */
  | { ok: false; resposta: NextResponse; mensagem: string }

interface RespostaRpc {
  ok?: boolean
  no_teste?: boolean
  id?: string
  erro?: string
}

export async function reservarPecaTeste(
  userId: string | null | undefined,
  tipo: TipoPeca,
  origem: string,
): Promise<Reserva> {
  if (!userId) return { ok: true, noTeste: false }
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc("reservar_peca_teste", {
      p_user_id: userId,
      p_tipo: tipo,
      p_origem: origem,
    })
    if (error) {
      console.error(`[teste-gratis] RPC falhou (${origem}), seguindo sem a regra:`, error.message)
      return { ok: true, noTeste: false }
    }
    const r = (data ?? {}) as RespostaRpc
    if (r.ok && r.no_teste && r.id) return { ok: true, noTeste: true, id: r.id }
    if (r.ok) return { ok: true, noTeste: false }
    if (r.erro === "teste_esgotado") {
      return {
        ok: false,
        mensagem: MENSAGEM_TESTE_ESGOTADO,
        resposta: NextResponse.json(
          {
            error: MENSAGEM_TESTE_ESGOTADO,
            code: "teste_esgotado",
            upgrade_url: "/pricing",
          },
          { status: 402 },
        ),
      }
    }
    console.error(`[teste-gratis] resposta inesperada (${origem}), seguindo sem a regra:`, r)
    return { ok: true, noTeste: false }
  } catch (err) {
    console.error(`[teste-gratis] erro (${origem}), seguindo sem a regra:`, err)
    return { ok: true, noTeste: false }
  }
}

/** Devolve a peça quando a geração falhou depois da reserva. Nunca lança. */
export async function liberarPecaTeste(reserva: Reserva): Promise<void> {
  if (!reserva.ok || !reserva.noTeste) return
  try {
    const admin = createAdminClient()
    const { error } = await admin.rpc("liberar_peca_teste", { p_id: reserva.id })
    if (error) console.error("[teste-gratis] não consegui liberar a peça:", error.message)
  } catch (err) {
    console.error("[teste-gratis] não consegui liberar a peça:", err)
  }
}

/** Slides permitidos: no teste o carrossel para em MAX_SLIDES_TESTE. */
export function slidesPermitidos(reserva: Reserva, pedidos: number): number {
  if (reserva.ok && reserva.noTeste) return Math.min(pedidos, MAX_SLIDES_TESTE)
  return pedidos
}

/** A arte desta peça sai do contador do teste, não do saldo de tokens. */
export function artePagaPeloTeste(reserva: Reserva): boolean {
  return reserva.ok && reserva.noTeste
}
