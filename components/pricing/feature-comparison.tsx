"use client"

import { Fragment } from "react"
import { motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { PLAN_TOKENS, equivalenciaDoPlano } from "@/lib/tokens"

/**
 * Tokens e equivalência (carrosséis/roteiros) vêm de lib/tokens.ts, fonte
 * única compartilhada com a landing e o card de preço (10/09/2026): nunca
 * número escrito à mão.
 */
const featureGroups = [
  {
    name: "GERAÇÃO",
    features: [
      {
        name: "Tokens por mês",
        starter: PLAN_TOKENS.starter.toLocaleString("pt-BR"),
        pro: PLAN_TOKENS.pro.toLocaleString("pt-BR"),
        studio: PLAN_TOKENS.studio.toLocaleString("pt-BR"),
      },
      {
        name: "Equivalência do plano",
        starter: equivalenciaDoPlano(PLAN_TOKENS.starter),
        pro: equivalenciaDoPlano(PLAN_TOKENS.pro),
        studio: equivalenciaDoPlano(PLAN_TOKENS.studio),
      },
      { name: "Capa em Nano Banana 2", starter: true, pro: true, studio: true },
      { name: "Templates", starter: "5", pro: "20+ exclusivos", studio: "Todos + custom" },
    ],
  },
  {
    name: "MARCAS",
    features: [
      { name: "Marcas configuradas", starter: "1", pro: "5", studio: "Ilimitadas" },
      { name: "Brand kit IA", starter: true, pro: true, studio: true },
      { name: "Cores customizadas", starter: false, pro: true, studio: true },
    ],
  },
  {
    name: "EDITOR",
    features: [
      { name: "Editor de camadas", starter: true, pro: true, studio: true },
      { name: "Templates avançados", starter: false, pro: true, studio: true },
      { name: "Export sem marca d'água", starter: false, pro: true, studio: true },
    ],
  },
  {
    name: "EQUIPE",
    features: [
      { name: "Usuários", starter: "1", pro: "1", studio: "3" },
      { name: "Permissões", starter: false, pro: false, studio: true },
      { name: "White-label", starter: false, pro: false, studio: true },
    ],
  },
  {
    name: "INTEGRAÇÕES",
    features: [
      { name: "API", starter: false, pro: false, studio: true },
      { name: "Webhooks", starter: false, pro: false, studio: true },
      { name: "Zapier", starter: false, pro: false, studio: "Em breve" },
    ],
  },
  {
    name: "SUPORTE",
    features: [
      { name: "E-mail", starter: true, pro: true, studio: true },
      { name: "Tempo de resposta", starter: "48h", pro: "12h", studio: "4h" },
      { name: "Onboarding", starter: false, pro: false, studio: "1-on-1" },
    ],
  },
]

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="w-5 h-5 text-primary mx-auto" />
    ) : (
      <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
    )
  }
  return <span className="text-sm">{value}</span>
}

export function FeatureComparison() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto px-4 py-16"
    >
      <h2 className="text-3xl font-bold text-center mb-12">
        Compare todos os recursos
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 pr-4 font-medium text-muted-foreground">Recurso</th>
              <th className="text-center py-4 px-4 font-semibold">Starter</th>
              <th className="text-center py-4 px-4 font-semibold text-primary">Pro</th>
              <th className="text-center py-4 px-4 font-semibold">Studio</th>
            </tr>
          </thead>
          <tbody>
            {featureGroups.map((group) => (
              <Fragment key={group.name}>
                <tr>
                  <td
                    colSpan={4}
                    className="pt-8 pb-3 text-xs font-bold text-muted-foreground tracking-wider"
                  >
                    {group.name}
                  </td>
                </tr>
                {group.features.map((feature) => (
                  <tr key={feature.name} className="border-b border-border/50">
                    <td className="py-4 pr-4 text-sm text-foreground">{feature.name}</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">
                      <FeatureValue value={feature.starter} />
                    </td>
                    <td className="py-4 px-4 text-center text-foreground">
                      <FeatureValue value={feature.pro} />
                    </td>
                    <td className="py-4 px-4 text-center text-muted-foreground">
                      <FeatureValue value={feature.studio} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  )
}
