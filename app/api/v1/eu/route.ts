import { NextResponse } from "next/server"
import { autenticar } from "@/lib/chaves-api/autenticar"
import { erroJson } from "@/lib/calendario/resposta"
import { planFromProfile, PLAN_TOKENS, type Plan } from "@/lib/tokens"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// =====================================================================
// GET /api/v1/eu
//
// A primeira chamada de quem está plugando um sistema: "a chave que eu
// colei funciona, e é da conta certa?". Responder isso em uma chamada sem
// efeito colateral é o que transforma "não funcionou" em "ah, colei a
// chave errada".
//
// Também é a rota de teste da tela de Integração: o exemplo de "Como usar"
// é esta chamada, de propósito — ela não cria nada.
// =====================================================================

const NOME_DO_PLANO: Record<Plan, string> = {
  trial: "Teste grátis",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
}

export async function GET(req: Request) {
  const auth = await autenticar(req)
  if (!auth.ok) return auth.resposta
  const { admin, userId } = auth.conta

  const { data, error } = await admin
    .from("users")
    .select(
      "email, credits, topup_credits, referral_credits, subscription_status, plan_credits_monthly, plan_credits_used_this_month",
    )
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("[api/v1/eu] falha ao ler o perfil:", error.message)
    return erroJson(500, "falha_interna", "falha ao ler os dados da conta")
  }
  if (!data) {
    return erroJson(404, "nao_encontrado", "a conta desta chave não existe mais")
  }

  const plano = planFromProfile(data)
  const mensal =
    data.plan_credits_monthly && data.plan_credits_monthly > 0
      ? data.plan_credits_monthly
      : PLAN_TOKENS[plano]

  return NextResponse.json({
    ok: true,
    id: userId,
    email: data.email ?? null,
    plano: { id: plano, nome: NOME_DO_PLANO[plano], status: data.subscription_status ?? "trial" },
    tokens: {
      // Três baldes, somados: é o que a pessoa pode gastar agora.
      disponivel:
        Math.max(0, data.credits ?? 0) +
        Math.max(0, data.topup_credits ?? 0) +
        Math.max(0, data.referral_credits ?? 0),
      plano: Math.max(0, data.credits ?? 0),
      avulso: Math.max(0, data.topup_credits ?? 0),
      bonus: Math.max(0, data.referral_credits ?? 0),
      mensal,
      usado_no_mes: Math.max(0, data.plan_credits_used_this_month ?? 0),
    },
  })
}
