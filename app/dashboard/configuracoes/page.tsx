import { getProfile } from "@/lib/data/queries"
import { planFromProfile, PLAN_TOKENS, type Plan } from "@/lib/tokens"
import { ConfiguracoesClient } from "./configuracoes-client"

const PLAN_LABEL: Record<Plan, string> = {
  trial: "Teste grátis",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
}

export default async function ConfiguracoesPage() {
  const { user, profile } = await getProfile()

  const plan = profile ? planFromProfile(profile) : "trial"
  // Tokens: grant mensal do plano (fallback pra tabela de planos) e uso no mês.
  const monthly =
    profile?.plan_credits_monthly && profile.plan_credits_monthly > 0
      ? profile.plan_credits_monthly
      : PLAN_TOKENS[plan]
  const used = Math.max(0, profile?.plan_credits_used_this_month ?? 0)
  const balance = Math.max(0, profile?.credits ?? 0)

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Você"

  return (
    <ConfiguracoesClient
      name={displayName}
      email={user.email ?? ""}
      planLabel={PLAN_LABEL[plan]}
      tokensUsed={used}
      tokensMonthly={monthly}
      tokensBalance={balance}
    />
  )
}
