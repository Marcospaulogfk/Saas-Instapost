import { NextResponse } from "next/server"
import { conferirSegredoDoDono } from "@/lib/websync/dono"
import {
  NICHOS,
  NICHOS_RESERVA,
  seoTitleNicho,
  seoDescriptionNicho,
  type NichoSeo,
} from "@/lib/seo/nichos"
import { TEMPLATES_NICHO, templatesDoNicho } from "@/lib/seo/templates-nicho"

export const runtime = "nodejs"

// =====================================================================
// GET /api/webhooks/websync-os/seo-pages   (01/09/2026)
//
// O WebSync-OS (CRM) usa isso pra renderizar um preview de SERP estilo
// Yoast das páginas de SEO programático (hub + /modelos/carrossel/[nicho]),
// sem precisar abrir cada página em produção. Sem query params: sempre
// devolve o hub, os nichos ATIVOS e os de reserva (ativo: false), pra o
// CRM também mostrar o que está fora do piloto no momento.
//
// title/description saem de seoTitleNicho/seoDescriptionNicho (mesma fonte
// que o generateMetadata da página real usa), então o preview nunca diverge
// do que o Google de fato indexa.
//
// Mesma autenticação dos outros webhooks desta pasta: segredo próprio no
// header, sem sessão.
// =====================================================================

const BASE_URL = "https://nexuscontentai.com.br"

interface SeoPageTemplatePreview {
  id: string
  nome: string
  estilo: string
  nicho: string
}

interface SeoPagePreview {
  slug: string
  url: string
  title: string
  description: string
  h1: string
  keyword_primaria: string
  ativo: boolean
  templates: SeoPageTemplatePreview[]
}

function templatePreview(t: (typeof TEMPLATES_NICHO)[number]): SeoPageTemplatePreview {
  return { id: t.id, nome: t.nome, estilo: t.estilo, nicho: t.nichoSlug }
}

function nichoParaPreview(nicho: NichoSeo, ativo: boolean): SeoPagePreview {
  return {
    slug: nicho.slug,
    url: `${BASE_URL}/modelos/carrossel/${nicho.slug}`,
    title: seoTitleNicho(nicho),
    description: seoDescriptionNicho(nicho),
    // Mesmo texto do H1 renderizado em app/modelos/carrossel/[nicho]/page.tsx.
    h1: `Carrossel para ${nicho.nome.toLowerCase()}: pronto em segundos`,
    keyword_primaria: nicho.keywordPrimaria,
    ativo,
    // Nichos de reserva ainda não têm template curado, só a ficha de SEO.
    templates: ativo ? templatesDoNicho(nicho.slug).map(templatePreview) : [],
  }
}

function hubParaPreview(): SeoPagePreview {
  return {
    slug: "hub",
    url: `${BASE_URL}/modelos/carrossel`,
    // Mesmo TITLE/DESCRIPTION de app/modelos/carrossel/page.tsx.
    title: "Modelos de Carrossel para Instagram: Crie o Seu em Segundos com IA",
    description:
      "Escolha sua profissão, descreva o tema e a IA monta seu carrossel completo em segundos: copy, design e arte prontos pra editar. Comece grátis, sem cartão.",
    // Mesmo texto do H1 renderizado em app/modelos/carrossel/page.tsx.
    h1: "Modelos de carrossel para Instagram",
    keyword_primaria: "modelos de carrossel para instagram",
    ativo: true,
    templates: TEMPLATES_NICHO.map(templatePreview),
  }
}

export async function GET(req: Request) {
  // Paginas de SEO do proprio SyncPost, nao de cliente: so o WebSync-OS.
  // O conferirSegredoDoDono ja loga a tentativa; antes este caso era mudo.
  const auth = conferirSegredoDoDono(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.erro }, { status: auth.status })
  }

  const pages: SeoPagePreview[] = [
    hubParaPreview(),
    ...NICHOS.map((n) => nichoParaPreview(n, true)),
    ...NICHOS_RESERVA.map((n) => nichoParaPreview(n, false)),
  ]

  console.log(`[websync-os/seo-pages] ${pages.length} página(s) devolvida(s)`)
  return NextResponse.json({ pages })
}
