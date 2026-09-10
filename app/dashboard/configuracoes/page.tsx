import { headers } from "next/headers"
import { getProfile, tokensDisponiveis } from "@/lib/data/queries"
import { createClient } from "@/lib/supabase/server"
import { planFromProfile, PLAN_TOKENS, type Plan } from "@/lib/tokens"
import { ConfiguracoesClient } from "./configuracoes-client"
import type { ChaveListada } from "./integracao-client"

const PLAN_LABEL: Record<Plan, string> = {
  trial: "Teste grátis",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
}

/**
 * Base absoluta pros exemplos de chamada da aba Integração. Vem do host da
 * requisição pra o exemplo copiado funcionar onde a pessoa está de fato
 * (localhost em dev, o domínio do app em produção).
 */
async function baseDaRequisicao(): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https")
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://app.nexuscontentai.com.br"
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
  const balance = tokensDisponiveis(profile)

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Você"

  // Chaves de integração: RLS já limita ao dono, então a leitura vai pelo
  // client da sessão mesmo (o service_role só entra pra escrever o hash).
  // Revogadas ficam de fora: a lista é "o que está valendo agora".
  const supabase = await createClient()
  const { data: chavesRaw } = await supabase
    .from("api_keys")
    .select("id, name, prefix, created_at, last_used_at")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })

  const chaves: ChaveListada[] = (chavesRaw ?? []).map((c) => ({
    id: c.id,
    nome: c.name,
    prefixo: c.prefix,
    criada_em: c.created_at,
    ultimo_uso: c.last_used_at,
  }))

  return (
    <ConfiguracoesClient
      name={displayName}
      email={user.email ?? ""}
      planLabel={PLAN_LABEL[plan]}
      tokensUsed={used}
      tokensMonthly={monthly}
      tokensBalance={balance}
      chaves={chaves}
      baseUrl={await baseDaRequisicao()}
    />
  )
}
