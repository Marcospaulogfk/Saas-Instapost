import Anthropic from '@anthropic-ai/sdk'
import type {
  BrandInfo,
  EditorialCarousel,
} from '@/components/templates/editorial/editorial.types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `Você é um diretor criativo de carrosséis virais para Instagram.
Cria carrosséis em estilo editorial (estilo @brandsdecoded__).

REGRAS CRÍTICAS:
1. Cada carrossel tem 3-9 slides
2. Use a sequência natural: Capa → Problema → Demo → Novidade → Prova → Texto+Foto → Sépia (opcional) → Serif (opcional) → CTA
3. Mínimo: Capa + Problema + CTA (3 slides)
4. Máximo: todos os 9 layouts

TÍTULOS:
- Quebre em 3-5 palavras por linha
- Use UPPERCASE em layouts não-serif
- Destaque 1-2 palavras-chave por slide
- A última linha do título geralmente recebe o destaque

PALAVRAS DE DESTAQUE (highlightWords):
- Verbos fortes: GOSTA, MATAM, ROUBOU, EXPLODE
- Substantivos centrais: MENTIR, INSTAGRAM, IA, CARROSSEL
- Frases curtas de impacto: "É MESTRE NISSO", "EM 3 MINUTOS"

LAYOUTS RÍGIDOS (estrutura fixa):
- 01 capa: foto + título gigante + subtítulo
- 02 problema: tag + título + body + número translúcido (sem imagens)
- 07 sepia: foto sépia + título com múltiplos destaques
- 08 serif: título serif (Playfair) + subtítulo roxo claro

LAYOUTS FLEXÍVEIS (você escolhe variante):
- 03 demo: 'single' | 'comparison' | 'process'
- 04 novidade: 'text-only' | 'single-large' | 'pair' | 'grid-three'
- 05 prova: 'numeric' | 'single-print' | 'multiple-prints' | 'logo-cloud'
- 06 texto-foto: 'text-only' | 'image-bottom' | 'image-middle' | 'image-bg'
- 09 cta: 'text-only' | 'product-mockup' | 'human-photo' | 'composition'

OUTPUT:
Retorne APENAS um JSON válido seguindo o schema. Sem comentários, sem markdown, sem explicações.

Schema esperado:
{
  "totalSlides": number,
  "brandName": string,
  "handle": string,
  "topic": string,
  "slides": [
    {
      "pageNumber": number,
      "totalPages": number,
      "layoutType": "capa" | "problema" | "demo" | "novidade" | "prova" | "texto-foto" | "sepia" | "serif" | "cta",
      "variant": string (opcional, apenas pra layouts flexíveis),
      "tag": string (opcional),
      "title": string[] (array de linhas),
      "highlightWords": string[],
      "body": string (opcional),
      "bodyBoldLead": string (opcional),
      "callout": string (opcional),
      "subtitle": string (opcional, apenas capa),
      "imagePrompts": string[] (prompts pra gerar imagens via Fal.ai),
      "background": "dark" | "cream" | "white" | "navy" | "sepia" | "photo",
      "showBigNumber": boolean (apenas layout problema)
    }
  ]
}`

interface GenerateCarouselParams {
  topic: string
  brandInfo: BrandInfo
  tone: 'profissional' | 'casual' | 'direto'
  targetAudience: string
  desiredSlides?: number
}

export async function generateEditorialCarousel(
  params: GenerateCarouselParams,
): Promise<EditorialCarousel> {
  const userPrompt = `Tema do carrossel: "${params.topic}"

Marca: ${params.brandInfo.name}
Handle: ${params.brandInfo.handle}
Tom de voz: ${params.tone}
Público-alvo: ${params.targetAudience}
Número de slides desejado: ${params.desiredSlides || '5-7 (você decide)'}

Gere um carrossel editorial completo no formato JSON.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('Resposta inválida da Anthropic')
  }

  // Limpar markdown se houver
  let jsonText = textContent.text.trim()
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
  }

  const carousel: EditorialCarousel = JSON.parse(jsonText)

  // Adicionar brandInfo em cada slide
  carousel.slides = carousel.slides.map((slide) => ({
    ...slide,
    brandInfo: params.brandInfo,
  }))

  carousel.createdAt = new Date().toISOString()

  return carousel
}
