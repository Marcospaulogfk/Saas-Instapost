"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Inter } from "next/font/google"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { POST_TEMPLATES, CATEGORY_LABELS } from "@/lib/single-posts/catalog"
import {
  SlidePreview,
  type EditorialStyle,
  type PreviewSlide,
} from "@/components/carousel/slide-preview"

const inter = Inter({ subsets: ["latin"], weight: ["900"] })

// Categorias reais derivadas do catálogo (ordem estável).
const CATEGORY_ORDER = [
  "profissional",
  "informativo",
  "comercial",
  "fitness",
  "beauty",
  "empresa",
]

// Estilos de carrossel (mesmo motor do editor). "devem ficar todos" na galeria.
const CAROUSEL_STYLES: {
  style: EditorialStyle
  name: string
  desc: string
}[] = [
  { style: "gradient", name: "Gradiente", desc: "Dark vibrante com glow" },
  { style: "seamless", name: "Seamless", desc: "Panorâmico contínuo" },
  { style: "minimal", name: "Minimal", desc: "Branco clean / suíço" },
  { style: "wesley", name: "Wesley", desc: "Dark de impacto" },
  { style: "brandsdecoded", name: "Brandsdecoded", desc: "Editorial" },
  { style: "bolo", name: "Bolo", desc: "Lista cream" },
  { style: "mypostflow", name: "MyPostFlow", desc: "Clean com CTA" },
  { style: "auto", name: "Auto", desc: "Alternado dark/light" },
]

// Slide de capa mock só pra montar o thumbnail de cada estilo.
const DEMO_COVER: PreviewSlide = {
  order_index: 0,
  title: "3 erros que travam o seu crescimento",
  highlight_words: ["travam"],
  subtitle:
    "O que separa quem cresce de quem estaciona — e como virar o jogo hoje.",
  cta_badge: "Viral",
  image: {
    url: "https://picsum.photos/seed/syncpost-cover/800/500",
    source: "ai",
    attribution: null,
    error: null,
  },
}

// Thumbnail ao vivo: renderiza a capa numa largura de design fixa (pra manter
// as proporções das fontes) e escala pra caber no card.
function CarouselStyleCard({
  style,
  name,
  desc,
}: {
  style: EditorialStyle
  name: string
  desc: string
}) {
  const DESIGN_W = 440
  const THUMB_W = 220
  const scale = THUMB_W / DESIGN_W
  return (
    <Link
      href="/dashboard/criar"
      className="group relative rounded-xl overflow-hidden border border-border hover:border-primary/40 transition-all bg-black"
      style={{ width: THUMB_W, height: THUMB_W * 1.25 }}
    >
      <div
        className="pointer-events-none absolute top-0 left-0 origin-top-left"
        style={{ width: DESIGN_W, transform: `scale(${scale})` }}
      >
        <SlidePreview
          slide={DEMO_COVER}
          totalSlides={5}
          template="editorial"
          brandColors={["#7320E6", "#1A1A1A", "#FAF8F5"]}
          fontClass={inter.className}
          showDevBadges={false}
          editorialStyle={style}
          handle="@suamarca"
          brandLabel="Sua Marca"
        />
      </div>
      <Badge
        variant="secondary"
        className="absolute top-2 left-2 z-10 bg-black/50 backdrop-blur-sm text-white border-0 text-xs"
      >
        {name}
      </Badge>
      <div className="absolute inset-0 z-10 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center px-3">
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-[11px] text-white/70 mt-0.5">{desc}</p>
        <span className="text-xs font-medium text-white mt-2">
          Usar estilo &rarr;
        </span>
      </div>
    </Link>
  )
}

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("todos")
  const [query, setQuery] = useState("")

  const categories = useMemo(() => {
    const present = CATEGORY_ORDER.filter((c) =>
      POST_TEMPLATES.some((t) => t.category === c),
    )
    return ["todos", ...present]
  }, [])

  const filtered = POST_TEMPLATES.filter((t) => {
    const matchesCategory =
      activeCategory === "todos" || t.category === activeCategory
    const matchesQuery = t.label.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  })

  const filteredStyles = CAROUSEL_STYLES.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground mt-1">
          Comece com um modelo testado e personalize com a sua identidade.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar templates..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      {/* Estilos de carrossel */}
      {filteredStyles.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Estilos de carrossel</h2>
            <p className="text-sm text-muted-foreground">
              Capa, tipografia e composição prontas — aplicadas em todos os
              slides.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            {filteredStyles.map((s) => (
              <CarouselStyleCard
                key={s.style}
                style={s.style}
                name={s.name}
                desc={s.desc}
              />
            ))}
          </div>
        </section>
      )}

      {/* Posts únicos */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Posts únicos</h2>
          <p className="text-sm text-muted-foreground">
            Modelos de imagem 4:5 pra comunicados, ofertas, autoridade e mais.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => {
            const isActive = cat === activeCategory
            const label =
              cat === "todos" ? "Todos" : CATEGORY_LABELS[cat] ?? cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">Nenhum template encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((template) => (
              <Link
                key={template.id}
                href="/dashboard/criar"
                className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all cursor-pointer bg-black"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.reference_image}
                  alt={template.label}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <Badge
                  variant="secondary"
                  className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white border-0 text-xs"
                >
                  {CATEGORY_LABELS[template.category] ?? template.category}
                </Badge>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4">
                  <h3 className="font-semibold text-white leading-tight">
                    {template.label}
                  </h3>
                  {template.use_when?.[0] && (
                    <p className="text-xs text-white/60 mt-0.5 line-clamp-2">
                      {template.use_when[0]}
                    </p>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    Usar template &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
