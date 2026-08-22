import { Instagram } from "lucide-react"
import { MetricasClient } from "./metricas-client"

export const metadata = { title: "Instagram" }

/**
 * /dashboard/instagram — conexão + métricas da conta do Instagram.
 *
 * Tudo que é número vem da Meta em tempo real (GET /api/instagram/insights);
 * nada fica em cache nosso. A página também é a "casa" da conexão: é daqui
 * que o usuário conecta, vê a validade do token e desconecta.
 */
export default function InstagramPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8 space-y-5">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="nv-tile nv-tile-pink w-10 h-10">
            <Instagram className="w-5 h-5" strokeWidth={1.9} />
          </span>
          <h1 className="text-2xl font-bold" style={{ color: "var(--nv-text)" }}>
            Instagram
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--nv-text-muted)" }}>
          Conecte a conta profissional da marca pra publicar direto daqui e
          acompanhar o que cada post rendeu. Métricas dos últimos 30 dias.
        </p>
      </div>
      <MetricasClient />
    </div>
  )
}
