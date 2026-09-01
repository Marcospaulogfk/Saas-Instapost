"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { BillingCycle } from "@/app/pricing/page"
import { tokenCostForCarousel } from "@/lib/tokens"
import {
  CYCLE_INFO,
  PLAN_LABEL,
  PLAN_PRICE_MONTHLY,
  isPaidPlan,
  priceFor,
  tokensFor,
  type PaidPlan,
} from "@/lib/billing/plans"
import { iniciarCheckout } from "@/app/actions/billing"
import { createClient } from "@/lib/supabase/client"
import { AssinarCartaoModal } from "@/components/billing/assinar-cartao-modal"

interface PricingCardsProps {
  billingCycle: BillingCycle
  /** ?plano= na URL: dispara o checkout sozinho (volta do cadastro). */
  autoStartPlan?: string | null
}

const MENSAGEM_ERRO: Record<string, string> = {
  plano_invalido: "Plano inválido. Recarregue a página.",
  cobranca_indisponivel: "A cobrança ainda não está ativa neste ambiente. Fale com a gente.",
  falha_provedor: "Não conseguimos abrir o checkout agora. Tente de novo em instantes.",
}

/**
 * Linha de tokens do card. Os tokens/mês são os MESMOS em qualquer ciclo
 * (decisão 22/08/2026: o anual desconta o preço, não o grant). O "≈" usa o
 * carrossel completo de 7 slides e o só-capa, pela tabela de lib/tokens.ts,
 * nunca número escrito à mão.
 */
function tokenFeature(id: PaidPlan): string {
  const tk = tokensFor(id)
  const completo = tokenCostForCarousel(7, { cover: true, slides: true })
  const soCapa = tokenCostForCarousel(7, { cover: true, slides: false })
  return `${tk.toLocaleString("pt-BR")} tokens/mês (≈ ${Math.floor(tk / completo)} carrosséis completos ou ${Math.floor(tk / soCapa)} só com capa)`
}

const plans = [
  {
    id: "starter" as const,
    name: "Starter",
    tagline: "Para criadores comecando",
    basePrice: PLAN_PRICE_MONTHLY.starter,
    popular: false,
    cta: "Comecar com Starter",
    ctaVariant: "outline" as const,
    features: [
      "1 marca configurada",
      "Templates basicos",
      "Capa em Nano Banana 2",
      "Marca d'agua no export",
      "Suporte por email",
    ],
    featurePrefix: "Inclui:",
  },
  {
    id: "pro" as const,
    name: "Pro",
    tagline: "Para criadores serios e agencias",
    basePrice: PLAN_PRICE_MONTHLY.pro,
    popular: true,
    cta: "Escolher Pro",
    ctaVariant: "default" as const,
    features: [
      "5 marcas configuradas",
      "Sem marca d'agua",
      "Templates exclusivos",
      "Suporte prioritario (12h)",
      "Export em lote",
    ],
    featurePrefix: "Tudo do Starter, mais:",
  },
  {
    id: "studio" as const,
    name: "Studio",
    tagline: "Para agencias e empresas",
    basePrice: PLAN_PRICE_MONTHLY.studio,
    popular: false,
    cta: "Escolher Studio",
    ctaVariant: "outline" as const,
    features: [
      "Marcas ilimitadas",
      "API para automacao",
      "Equipe de ate 3 usuarios",
      "Gerente de conta dedicado",
      "White-label disponivel",
    ],
    featurePrefix: "Tudo do Pro, mais:",
  },
]

function calculatePrice(plan: PaidPlan, cycle: BillingCycle) {
  const p = priceFor(plan, cycle)
  return {
    monthlyPrice: p.perMonth,
    totalPrice: p.total,
    savings: Math.round(p.savings),
  }
}

export function PricingCards({ billingCycle, autoStartPlan }: PricingCardsProps) {
  const [pending, startTransition] = useTransition()
  const [ativo, setAtivo] = useState<PaidPlan | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [logado, setLogado] = useState(false)
  const [logadoResolvido, setLogadoResolvido] = useState(false)
  const [modalPlano, setModalPlano] = useState<PaidPlan | null>(null)
  const [assinado, setAssinado] = useState<{ plan: PaidPlan; priceBr: string } | null>(null)
  const autoStarted = useRef(false)

  // Precisa saber se está logado ANTES de decidir entre abrir o modal de
  // cartão (checkout transparente) ou mandar pro /cadastro — o modal chama
  // uma rota autenticada, então oferecê-lo a quem não tem sessão só levaria
  // a um 401 depois de a pessoa já ter digitado o cartão. `logadoResolvido`
  // trava o auto-start (?plano= na volta do cadastro) até a checagem voltar,
  // senão a corrida manda até quem ACABOU de logar de volta pro /cadastro.
  useEffect(() => {
    let ativo = true
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!ativo) return
        setLogado(Boolean(data.user))
        setLogadoResolvido(true)
      })
      .catch(() => {
        if (ativo) setLogadoResolvido(true)
      })
    return () => {
      ativo = false
    }
  }, [])

  /** Deslogado: mesmo caminho de sempre (iniciarCheckout redireciona pro
   *  /cadastro?plano=&ciclo= e a página de preços retoma na volta). */
  function irParaCadastro(plan: PaidPlan) {
    setErro(null)
    setAtivo(plan)
    startTransition(async () => {
      const r = await iniciarCheckout(plan, billingCycle)
      // redirect() não retorna; se chegou aqui, deu erro.
      if (r && "erro" in r) {
        setErro(MENSAGEM_ERRO[r.erro] ?? "Algo deu errado.")
        setAtivo(null)
      }
    })
  }

  function assinar(plan: PaidPlan) {
    setErro(null)
    setAssinado(null)
    if (logado) {
      setModalPlano(plan)
      return
    }
    irParaCadastro(plan)
  }

  useEffect(() => {
    if (autoStarted.current) return
    if (!logadoResolvido) return
    if (isPaidPlan(autoStartPlan)) {
      autoStarted.current = true
      assinar(autoStartPlan)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartPlan, logadoResolvido])

  return (
    <div className="max-w-7xl mx-auto px-4">
    {erro && (
      <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
        {erro}
      </p>
    )}
    {assinado && (
      <p className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-center text-sm text-green-400">
        Assinatura {PLAN_LABEL[assinado.plan]} confirmada — {assinado.priceBr}. Seus tokens já estão liberados.
      </p>
    )}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan, index) => {
        const { monthlyPrice, totalPrice, savings } = calculatePrice(plan.id, billingCycle)
        const cycle = CYCLE_INFO[billingCycle]
        const hasDiscount = cycle.discount > 0
        const carregando = pending && ativo === plan.id

        return (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative rounded-2xl p-8 border transition-all duration-300 ${
              plan.popular
                ? "border-primary/50 bg-card shadow-[0_0_60px_-15px_rgba(0,212,255,0.3)]"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-bold">
                MAIS POPULAR
              </Badge>
            )}
            
            <div className="mb-6">
              <h3 className={`text-xl font-semibold ${plan.popular ? "text-foreground" : "text-muted-foreground"}`}>
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={monthlyPrice}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="text-5xl font-bold tabular-nums"
                  >
                    R$ {monthlyPrice}
                  </motion.span>
                </AnimatePresence>
                <span className="text-lg text-muted-foreground">{cycle.label}</span>
              </div>
              
              {hasDiscount && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 space-y-1"
                >
                  <p className="text-sm text-muted-foreground line-through">
                    R$ {plan.basePrice} x {cycle.months}
                  </p>
                  <p className="text-sm text-green-500 font-medium">
                    Economize R$ {savings}
                  </p>
                </motion.div>
              )}
              
              <p className="text-xs text-muted-foreground mt-3">
                {hasDiscount ? `Cobrado R$ ${totalPrice} ${cycle.suffix.toLowerCase().replace('cobrado ', '')}` : cycle.suffix}
              </p>
            </div>

            <Button
              variant={plan.ctaVariant}
              disabled={pending}
              onClick={() => assinar(plan.id)}
              className={`w-full mb-6 ${
                plan.popular
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:border-primary hover:text-primary"
              }`}
            >
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Abrindo checkout
                </>
              ) : (
                plan.cta
              )}
            </Button>

            <div className="border-t border-border pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-4">
                {plan.featurePrefix}
              </p>
              <ul className="space-y-3">
                {[tokenFeature(plan.id), ...plan.features].map(
                  (feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </motion.div>
        )
      })}
    </div>
    {modalPlano && (
      <AssinarCartaoModal
        open={Boolean(modalPlano)}
        onOpenChange={(v) => !v && setModalPlano(null)}
        plan={modalPlano}
        cycle={billingCycle}
        onSucesso={({ plan, priceBr }) => {
          setModalPlano(null)
          setAssinado({ plan, priceBr })
        }}
      />
    )}
    </div>
  )
}
