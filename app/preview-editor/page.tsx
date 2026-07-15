/** PREVIEW SEM LOGIN — layout do editor de carrossel redesenhado (mock).
 *  Renderiza a sidebar de NAV do dashboard ATRÁS pra provar que o editor a
 *  cobre (uma sidebar só, não duas). */
import "../dashboard/dashboard.css"
import { CarouselEditor } from "@/components/carousel/carousel-editor"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import type { PreviewSlide } from "@/components/carousel/slide-preview"

const IMG = (c: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1080' height='1350'><rect width='100%' height='100%' fill='${c}'/></svg>`,
  )

const mk = (i: number, title: string, sub: string, color: string): PreviewSlide => ({
  order_index: i,
  title,
  highlight_words: [],
  subtitle: sub,
  body: "",
  cta_badge: "DIAGNÓSTICO",
  image: { url: IMG(color), source: "ai", attribution: null, error: null },
})

const SLIDES: PreviewSlide[] = [
  mk(0, "SEU SITE EXISTE. SEUS CLIENTES, NÃO.", "O problema não é o site estar no ar.", "#22303f"),
  mk(1, "SUA EQUIPE PERDE HORAS TODA SEMANA NISTO", "E o relógio corre.", "#2a2320"),
]

export default function PreviewEditorPage() {
  return (
    <div className="dashboard-root dark flex h-screen bg-background overflow-hidden">
      {/* Sidebar de NAV atrás — deve ficar COBERTA pelo editor */}
      <DashboardSidebar
        userName="Marcos Paulo"
        userEmail="marcos@websync.com.br"
        userInitials="MP"
        userAvatarUrl={null}
        credits={82}
        subscriptionStatus="active"
        planCreditsMonthly={1000}
        creditsUsedThisMonth={160}
        activeBrand={{ id: "b1", name: "WebSync", logo_url: null }}
        brands={[{ id: "b1", name: "WebSync", logo_url: null }]}
      />
      <CarouselEditor
        initialSlides={SLIDES}
        initialTitle="WebSync — Diagnóstico 2026"
        caption={"O futuro do trabalho já começou.\n\n#IA #produtividade"}
        brandName="WebSync Solutions"
        handle="@websyncsolutions"
        colors={["#7320E6", "#0A0A0F", "#FAF8F5"]}
        template="editorial"
        editorialStyle="wesley"
        initialFormat="feed"
        initialCarouselId="mock-preview"
      />
    </div>
  )
}
