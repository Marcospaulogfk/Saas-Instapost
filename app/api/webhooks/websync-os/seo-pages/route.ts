import { NextResponse } from "next/server"
import {
  NICHOS,
  NICHOS_RESERVA,
  seoTitleNicho,
  seoDescriptionNicho,
  type NichoSeo,
} from "@/lib/seo/nichos"

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

const SECRET_HEADER = "x-websync-secret"
const BASE_URL = "https://nexuscontentai.com.br"

interface SeoPagePreview {
  slug: string
  url: string
  title: string
  description: string
  h1: string
  keyword_primaria: string
  ativo: boolean
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
  }
}

export async function GET(req: Request) {
  const expected = process.env.WEBSYNC_WEBHOOK_SECRET
  if (!expected) {
    console.error("[websync-os/seo-pages] WEBSYNC_WEBHOOK_SECRET ausente no ambiente")
    return NextResponse.json({ error: "webhook não configurado" }, { status: 503 })
  }
  const provided = req.headers.get(SECRET_HEADER)
  if (!provided || provided !== expected) {
    console.warn("[websync-os/seo-pages] secret inválido")
    return NextResponse.json({ error: "não autorizado" }, { status: 401 })
  }

  const pages: SeoPagePreview[] = [
    hubParaPreview(),
    ...NICHOS.map((n) => nichoParaPreview(n, true)),
    ...NICHOS_RESERVA.map((n) => nichoParaPreview(n, false)),
  ]

  console.log(`[websync-os/seo-pages] ${pages.length} página(s) devolvida(s)`)
  return NextResponse.json({ pages })
}
