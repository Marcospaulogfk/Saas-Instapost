"use client"

import Image from "next/image"
import { useState } from "react"
import { POST_TEMPLATES, CATEGORY_LABELS, templatesByCategory } from "@/lib/single-posts/catalog"
import { DEMO_BRAND, DEMO_CONTENT } from "@/lib/single-posts/demo"
import { PostPreview } from "@/components/single-posts/post-preview"
import type { PostBrand } from "@/lib/single-posts/types"

const BRAND_PRESETS: Record<string, PostBrand> = {
  "Eriosvaldo Diniz": {
    id: "demo-eriosvaldo",
    name: "ERIOSVALDO DINIZ",
    monogram: "ED",
    profession: "ADVOGADO",
    brand_colors: ["#1F1F1F", "#C9A572", "#F0EFEC"],
    logo_url: null,
    phone: "(11) 99999-9999",
    website: "eriosvaldodiniz.com.br",
    instagram_handle: "eriosvaldodiniz",
    tagline: null,
  },
  "Dra. Maria Silva": {
    id: "demo-maria",
    name: "DRA. MARIA SILVA",
    monogram: "MS",
    profession: "MÉDICA",
    brand_colors: ["#0F2A4A", "#A8C5E0", "#F4F6F9"],
    logo_url: null,
    phone: "(11) 4444-5555",
    website: "drmariasilva.com",
    instagram_handle: "drmariasilva",
    tagline: null,
  },
  "SyncPost (roxo+lime)": {
    id: "demo-syncpost",
    name: "SYNCPOST",
    monogram: "SP",
    profession: "PRODUTO",
    brand_colors: ["#0A0A0A", "#7C3AED", "#D1FE17"],
    logo_url: null,
    phone: null,
    website: "syncpost.com.br",
    instagram_handle: "syncpost",
    tagline: null,
  },
  "Marca sem contato": {
    id: "demo-minimal",
    name: "JOÃO PEREIRA",
    monogram: "JP",
    profession: "CONSULTOR",
    brand_colors: ["#1A1A1A", "#E8B14A", "#F5F1EA"],
    logo_url: null,
    phone: null,
    website: null,
    instagram_handle: "joaopereira",
    tagline: null,
  },
  "Real Estética": {
    id: "demo-realestetica",
    name: "REAL ESTÉTICA",
    monogram: "RE",
    profession: "ESTÉTICA",
    brand_colors: ["#2A2520", "#D4A574", "#F5EDE3"],
    logo_url: null,
    phone: null,
    website: "realestetica.com.br",
    instagram_handle: "realestetica",
    tagline: "MADE IN REAL ESTÉTICA",
  },
  "SafeGuard (roxo)": {
    id: "demo-safeguard",
    name: "SAFEGUARD",
    monogram: "SG",
    profession: "SEGURANÇA",
    brand_colors: ["#2D1B5E", "#7C3AED", "#FFFFFF"],
    logo_url: null,
    phone: null,
    website: "safeguard.com.br",
    instagram_handle: "safeguard",
    tagline: "VIGILÂNCIA CONFIÁVEL",
  },
  "Apple-style (clean)": {
    id: "demo-apple",
    name: "APPLE",
    monogram: "AP",
    profession: "TECNOLOGIA",
    brand_colors: ["#1D1D1F", "#FF453A", "#F5F5F7"],
    logo_url: null,
    phone: null,
    website: "apple.com",
    instagram_handle: "apple",
    tagline: null,
  },
  "Avante Capital (verde)": {
    id: "demo-avante",
    name: "AVANTE CAPITAL",
    monogram: "AC",
    profession: "consultoria financeira",
    brand_colors: ["#0F4C3A", "#D4A574", "#FFFFFF"],
    logo_url: null,
    phone: null,
    website: "avantecapital.com.br",
    instagram_handle: "avantecapital",
    tagline: "AVANTE CAPITAL",
  },
  "Power Academy (lime)": {
    id: "demo-power",
    name: "POWER ACADEMY",
    monogram: "PA",
    profession: "ACADEMIA",
    brand_colors: ["#0A0A0A", "#1A1A1A", "#C9F031"],
    logo_url: null,
    phone: "(11) 0000-0000",
    website: "www.powaracademy.com.br",
    instagram_handle: "poweracademy",
    tagline: "AVENIDA RIO BRANCO, 2095",
  },
}

export default function PreviewPostsUnicosPage() {
  const [brandKey, setBrandKey] = useState<keyof typeof BRAND_PRESETS>("Eriosvaldo Diniz")
  const [showReference, setShowReference] = useState(false)
  const brand = BRAND_PRESETS[brandKey]
  const grouped = templatesByCategory()
  const implementedCategories = Object.keys(grouped)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Posts Únicos — Validação</h1>
            <p className="text-sm text-zinc-400">
              {POST_TEMPLATES.length} de 24 templates implementados ·{" "}
              {implementedCategories.length} categoria{implementedCategories.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setShowReference((v) => !v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                showReference
                  ? "bg-lime text-zinc-950"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {showReference ? "Esconder ref" : "Comparar com ref"}
            </button>
            {Object.entries(BRAND_PRESETS).map(([k, b]) => (
              <button
                key={k}
                onClick={() => setBrandKey(k as keyof typeof BRAND_PRESETS)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  brandKey === k
                    ? "bg-purple-600 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {k}
                <span className="ml-2 inline-flex gap-0.5">
                  {b.brand_colors.slice(0, 3).map((c, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ background: c }}
                    />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </header>

        {Object.entries(grouped).map(([category, templates]) => (
          <section key={category} className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {CATEGORY_LABELS[category]}
              <span className="text-xs text-zinc-500 font-normal">
                ({templates.length} templates)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {templates.map((tpl) => (
                <div key={tpl.id} className="space-y-2">
                  {showReference && (
                    <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-zinc-900 relative">
                      <Image
                        src={`/refs-posts-unicos/${getRefPath(tpl.id)}`}
                        alt="referência"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                  <PostPreview
                    templateId={tpl.id}
                    brand={brand}
                    content={DEMO_CONTENT[tpl.id] ?? {}}
                  />
                  <div className="px-1">
                    <p className="text-sm font-semibold">{tpl.label}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                      {tpl.id}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function getRefPath(templateId: string): string {
  // profissional-01-retrato-titulo-bottom → Profissional/01/referencia.jpg
  const match = templateId.match(/^(profissional|beauty|comercial|empresa|fitness|informativo)-(\d{2})-/)
  if (!match) return ""
  const cat = match[1]
  const num = match[2]
  const folderCat = cat === "profissional" ? "Profissional" : cat
  return `${folderCat}/${num}/referencia.jpg`
}
