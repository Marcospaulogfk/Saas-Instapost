"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

const featureGroups = [
  {
    name: "GERACAO",
    features: [
      { name: "Imagens por mes", starter: "50", pro: "200", studio: "800" },
      { name: "Modelos de IA", starter: "Flux Schnell", pro: "Flux + Nano Banana 2", studio: "Nano Banana 2 + Pro" },
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
      { name: "Templates avancados", starter: false, pro: true, studio: true },
      { name: "Export sem marca d'agua", starter: false, pro: true, studio: true },
    ],
  },
  {
    name: "EQUIPE",
    features: [
      { name: "Usuarios", starter: "1", pro: "1", studio: "3" },
      { name: "Permissoes", starter: false, pro: false, studio: true },
      { name: "White-label", starter: false, pro: false, studio: true },
    ],
  },
  {
    name: "INTEGRACOES",
    features: [
      { name: "API", starter: false, pro: false, studio: true },
      { name: "Webhooks", starter: false, pro: false, studio: true },
      { name: "Zapier", starter: false, pro: false, studio: "Em breve" },
    ],
  },
  {
    name: "SUPORTE",
    features: [
      { name: "Email", starter: true, pro: true, studio: true },
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
        <table className="w-full min-w-[600px]">
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
              <>
                <tr key={group.name}>
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
              </>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  )
}
