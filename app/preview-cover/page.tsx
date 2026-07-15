/** PREVIEW ISOLADO — 1 card só, pra ver o CarouselCover renderizado. */
import "../dashboard/dashboard.css"
import { CarouselCover } from "@/components/carousel/carousel-cover"
import type { CarouselCoverData } from "@/components/carousel/slide-preview"

const IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1080' height='1350'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2a3646'/><stop offset='1' stop-color='#0c1017'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/></svg>`,
  )

const cover: CarouselCoverData = {
  slide: {
    order_index: 0,
    title: "SEU SITE EXISTE. SEUS CLIENTES, NÃO.",
    highlight_words: [],
    subtitle: "O problema não é o site estar no ar — é ele não trabalhar.",
    body: "",
    cta_badge: "DIAGNÓSTICO",
    image: { url: IMG, source: "ai", attribution: null, error: null },
  },
  totalSlides: 3,
  template: "editorial",
  editorialStyle: "wesley",
  colors: ["#7320E6", "#0A0A0F", "#FAF8F5"],
  handle: "@websyncsolutions",
  brandName: "WebSync Solutions",
  format: "feed",
}

export default function PreviewCoverPage() {
  return (
    <div className="dashboard-root dark min-h-screen bg-background flex items-center justify-center p-10">
      <div className="card-black relative aspect-[4/5] overflow-hidden w-[280px]">
        <CarouselCover cover={cover} />
        <span className="absolute top-2.5 left-2.5 z-10 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] text-white/90">
          3 slides
        </span>
      </div>
    </div>
  )
}
