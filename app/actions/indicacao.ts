"use server"

// =====================================================================
// app/actions/indicacao.ts
// Server actions do programa INDIQUE E GANHE.
//
// Nada aqui credita token. Crédito é EXCLUSIVIDADE do webhook de
// pagamento (app/api/webhooks/asaas → lib/billing/apply.ts), via RPC que só o service_role pode
// executar. Aqui só se cria o código e se registra o VÍNCULO (pending).
// =====================================================================

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/data/queries"
import {
  codigoTemFormatoValido,
  mensagemVinculo,
  normalizarCodigo,
  type ResultadoVinculo,
} from "@/lib/indicacao/config"

export type AplicarConviteResult = {
  ok: boolean
  /** Mensagem já em PT-BR, pronta pra UI. */
  mensagem: string
}

/**
 * Vincula a conta logada a um código de convite.
 *
 * Existe por dois caminhos de entrada:
 *  1. quem já tinha conta e recebeu o link depois — o link cai em
 *     /dashboard/indicacao/convite/[codigo], que chama esta action;
 *  2. quem cadastrou sem o `?ref=` e digita o código na mão na página.
 *
 * Todas as guardas de fraude (auto-indicação, já vinculado, já pagante,
 * janela de 30 dias) vivem na função SQL `registrar_indicacao` — a action
 * só traduz o retorno. Regra: a validação nunca depende do cliente.
 */
export async function aplicarCodigoConvite(
  codigoBruto: string,
): Promise<AplicarConviteResult> {
  const codigo = normalizarCodigo(codigoBruto ?? "")

  // Checagem de formato só pra evitar round-trip inútil; a de verdade é no SQL.
  if (!codigoTemFormatoValido(codigo)) {
    return { ok: false, mensagem: mensagemVinculo("codigo_invalido") }
  }

  try {
    const { supabase, user } = await requireUser()
    const { data, error } = await supabase.rpc("registrar_indicacao", {
      p_referred_id: user.id,
      p_code: codigo,
    })

    if (error) {
      console.error("[indicacao] registrar_indicacao falhou:", error.message)
      return {
        ok: false,
        mensagem: "Não deu pra aplicar o convite agora. Tente de novo em instantes.",
      }
    }

    const resultado = (data ?? "codigo_invalido") as ResultadoVinculo
    if (resultado === "ok") revalidatePath("/dashboard/indicacao")
    return { ok: resultado === "ok", mensagem: mensagemVinculo(resultado) }
  } catch (err) {
    console.error("[indicacao] erro inesperado:", err)
    return {
      ok: false,
      mensagem: "Não deu pra aplicar o convite agora. Tente de novo em instantes.",
    }
  }
}
