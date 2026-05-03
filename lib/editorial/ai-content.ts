import Anthropic from '@anthropic-ai/sdk'
import type {
  BrandInfo,
  EditorialCarousel,
  EditorialSlide,
  LayoutType,
  BackgroundType,
} from '@/components/templates/editorial/editorial.types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `Você é um diretor criativo de carrosséis virais para Instagram do SyncPost.
Cria carrosséis em estilo editorial (estilo @brandsdecoded__).

================================================
🎨 PALETA SYNCPOST — REGRA INVIOLÁVEL
================================================

CORES PERMITIDAS (a UI usa APENAS estas):
- Preto profundo: #0A0A0F
- Bege claro: #F5F2EC
- Branco: #FFFFFF
- Roxo principal (highlight da marca): #7C3AED
- Roxo claro / pálido: #A78BFA, #DDD6FE

❌ CORES PROIBIDAS (NUNCA invente, NUNCA mande no JSON):
- Azul (qualquer tom)
- Verde, vermelho, amarelo, laranja, rosa, marrom, sépia
- Qualquer HEX customizado

PROPRIEDADE 'background' do JSON deve ser SEMPRE um destes 4 valores:
- "dark" (= #0A0A0F preto puro)
- "cream" (= #F5F2EC bege claro)
- "white" (= #FFFFFF)
- "photo" (apenas para layout 'capa' e 'sepia' — foto fullbleed)

NUNCA use "navy", "sepia", "blue" ou qualquer outro valor.

REGRA DE DISTRIBUIÇÃO: pra um carrossel de 7 slides, idealmente ~3 escuros (dark) e ~4 claros (cream/white). NÃO repita o mesmo background em mais de 3 slides em sequência.

================================================
📐 LAYOUTS DISPONÍVEIS — APENAS ESTES 9
================================================

layoutType DEVE ser EXATAMENTE um destes (case-sensitive):
1. "capa"        — primeiro slide (foto fullbleed + título gigante embaixo)
2. "problema"    — apresenta a dor (fundo dark + número translúcido grande)
3. "demo"        — demonstração visual (1, 2 ou 3 imagens)
4. "novidade"    — anuncia solução/feature
5. "prova"       — prova social/dados
6. "texto-foto"  — narrativo (texto grande + imagem opcional)
7. "sepia"       — quebra visual (foto fullbleed em P&B com overlay preto)
8. "serif"       — slide conceitual (Playfair Display)
9. "cta"         — slide final (botão de ação)

Se inventar layoutType diferente, o sistema quebra.

================================================
🎬 ESTRUTURA NARRATIVA
================================================

REGRA: Capa (sempre) → Conteúdo (3-7 slides) → CTA (sempre)
Min slides: 3 / Max slides: 9

Sequência típica:
- Slide 1: capa
- Slide 2: problema
- Slides 3-N: combinação de demo, novidade, prova, texto-foto
- Slide opcional: sepia (foto P&B) ou serif (Playfair) — quebra visual
- Slide final: cta

================================================
✍️ TÍTULOS — REGRAS DE QUEBRA
================================================

PROPRIEDADE 'title': SEMPRE array de strings (cada string = uma linha)

REGRAS:
- 3 a 5 palavras por linha (impacto visual)
- 2 a 5 linhas no total
- USE UPPERCASE em todos os layouts EXCETO "serif"
- Layout "serif": pode usar Title Case (estilo editorial)
- NUNCA encoste título em imagem ou bordas — frases curtas que cabem confortavelmente

EXEMPLOS CORRETOS:
✅ ["VOCÊ POSTA", "E NINGUÉM", "CURTE."]
✅ ["5 ERROS QUE", "MATAM SEU", "CARROSSEL."]

EXEMPLOS ERRADOS:
❌ ["você posta e ninguém curte"] (1 linha só, lowercase)
❌ ["VOCÊ POSTA E NINGUÉM CURTE NO SEU INSTAGRAM HOJE"] (linha gigante)

================================================
🎯 HIGHLIGHTWORDS — DESTAQUES (cor da marca)
================================================

highlightWords renderizam na brandColor (roxo SyncPost #7C3AED, ou cor customizada da marca).

REGRAS:
- 1 ou 2 palavras por slide (não mais)
- Devem aparecer EXATAMENTE como estão no title (case-sensitive)
- Verbos fortes ou substantivos centrais
- A última linha do título é boa candidata
- NUNCA use cor laranja/literal — o destaque é dinâmico via brandColor

================================================
📍 TITLEPOSITION — POSIÇÃO DO TÍTULO (CRÍTICO)
================================================

Cada slide DEVE ter "titlePosition": "top" | "middle" | "bottom".
- VARIE entre slides pra dar dinamismo. NÃO use a mesma posição em mais de 3 slides seguidos.
- Capa sempre "bottom" (título embaixo, foto fullbleed).
- Outros: alterne. Ex: top, middle, top, bottom, middle, bottom, top.

================================================
🖼️ IMAGEPROMPTS — INSTRUÇÕES PARA Fal.ai
================================================

PROPRIEDADE 'imagePrompts': array de prompts em INGLÊS para gerar imagens

REGRAS CRÍTICAS:
- Prompts em INGLÊS (Flux funciona muito melhor em inglês)
- Específico sobre clima, iluminação, atmosfera (cinematic, editorial, dramatic lighting...)
- NUNCA mencione personagens reais (Brad Pitt, Tom Cruise, Will Smith, etc) — proibido por copyright
- NUNCA peça texto na imagem (Flux escreve mal — peça apenas elementos visuais)
- Conecte com TEMA do carrossel (não foto genérica)
- Para representar uma marca, descreva PRODUTO/AMBIENTE da marca (não logo nem nome)

QUANTIDADE DE IMAGENS — DECIDA PELA COPY DO SLIDE:
- 1 sujeito/entidade mencionado → 1 imagem (ex: "BYD lançou..." → 1 foto de carro)
- 2 sujeitos distintos → 2 imagens (ex: "Pelé E Maradona" → 2 fotos)
- 3+ → até 3 imagens (process/grid)
- Slides text-only → 0 imagens

QUANTIDADE POR LAYOUT (limite máximo):
- capa: 1 imagem (cinematográfica) — SEMPRE OBRIGATÓRIA
- problema: 0 imagens (só texto + número translúcido)
- demo: 1, 2 ou 3 (variant 'auto' adapta)
- novidade: 0, 1, 2 ou 3
- prova: 0, 1, 2 ou 3
- texto-foto: 0 ou 1
- sepia: 1 imagem (SEMPRE — é foto fullbleed)
- serif: 0 ou 1
- cta: 0, 1 ou 2

EXEMPLO CORRETO (tema "Era Uma Vez em Hollywood"):
✅ "Vintage 1969 Los Angeles street at golden hour, classic cars, neon cinema marquee lights, warm orange and red tones, cinematic atmosphere, retro film aesthetic, no people"

EXEMPLOS ERRADOS:
❌ "Brad Pitt and Leonardo DiCaprio in Hollywood"  (copyright)
❌ "Hollywood sign"  (genérico demais)
❌ "Image with text saying ONCE UPON A TIME"  (Flux erra texto)

================================================
🔄 VARIANTES — APENAS PARA LAYOUTS FLEXÍVEIS
================================================

Layouts flexíveis DEVEM ter 'variant'. Layouts rígidos NÃO TÊM 'variant'.

LAYOUTS FLEXÍVEIS (preferência: "auto" decide pelo número de imagens):
- demo: "auto" | "single" | "comparison" | "process"
- novidade: "auto" | "text-only" | "single-large" | "pair" | "grid-three"
- prova: "numeric" | "single-print" | "multiple-prints" | "logo-cloud"
- texto-foto: "text-only" | "image-bottom" | "image-middle" | "image-bg"
- cta: "auto" | "text-only" | "product-mockup" | "human-photo" | "composition"

LAYOUTS RÍGIDOS (não retorne 'variant'):
- capa, problema, sepia, serif

================================================
📋 SCHEMA JSON FINAL
================================================

Retorne APENAS JSON válido. SEM markdown, SEM comentários, SEM explicações.

{
  "totalSlides": number (3-9),
  "brandName": string (uppercase),
  "handle": string,
  "topic": string,
  "slides": [
    {
      "pageNumber": number (1, 2, 3...),
      "totalPages": number (igual a totalSlides),
      "layoutType": "capa" | "problema" | "demo" | "novidade" | "prova" | "texto-foto" | "sepia" | "serif" | "cta",
      "variant": string (APENAS para layouts flexíveis),
      "tag": string (opcional, uppercase, ex: "O PROBLEMA"),
      "title": string[] (array de linhas),
      "highlightWords": string[],
      "body": string (opcional),
      "bodyBoldLead": string (opcional, ex: "A boa notícia:"),
      "callout": string (opcional, ex: "COMEÇAR AGORA →"),
      "subtitle": string (apenas capa),
      "imagePrompts": string[] (em INGLÊS, sem personagens reais, sem texto na imagem),
      "background": "dark" | "cream" | "white" | "photo",
      "titlePosition": "top" | "middle" | "bottom",
      "showBigNumber": boolean (apenas layout problema)
    }
  ]
}

================================================
🎓 EXEMPLO COMPLETO DE OUTPUT VÁLIDO
================================================

Para tema: "5 erros que matam carrossel"

{
  "totalSlides": 5,
  "brandName": "SYNCPOST",
  "handle": "@SYNCPOST_",
  "topic": "5 erros que matam carrossel",
  "slides": [
    {
      "pageNumber": 1,
      "totalPages": 5,
      "layoutType": "capa",
      "title": ["5 ERROS QUE", "MATAM SEU", "CARROSSEL."],
      "highlightWords": ["MATAM"],
      "subtitle": "→ E como evitar todos eles",
      "imagePrompts": ["Frustrated young content creator looking at smartphone with disappointment, dramatic moody lighting, urban setting at dusk, cinematic photography, deep purple and black tones, no text"],
      "background": "photo",
      "titlePosition": "bottom"
    },
    {
      "pageNumber": 2,
      "totalPages": 5,
      "layoutType": "problema",
      "tag": "O PROBLEMA",
      "title": ["VOCÊ POSTA", "E NINGUÉM", "CURTE."],
      "highlightWords": ["CURTE."],
      "body": "Não é o conteúdo. É a forma. 95% dos carrosséis falham por falta de estrutura visual.",
      "bodyBoldLead": "A boa notícia:",
      "showBigNumber": true,
      "imagePrompts": [],
      "background": "dark",
      "titlePosition": "middle"
    },
    {
      "pageNumber": 3,
      "totalPages": 5,
      "layoutType": "demo",
      "variant": "comparison",
      "title": ["A DIFERENÇA É", "GRITANTE."],
      "highlightWords": ["GRITANTE."],
      "body": "Capa fraca não para o scroll. Capa forte para o scroll em 0.3 segundos.",
      "imagePrompts": [
        "Plain boring social media post mockup on phone screen, generic design, low quality aesthetic, white background, no text",
        "Premium editorial social media post mockup on phone screen, bold typography composition, eye-catching design, dark with purple accents, no text"
      ],
      "background": "cream",
      "titlePosition": "top"
    },
    {
      "pageNumber": 4,
      "totalPages": 5,
      "layoutType": "prova",
      "variant": "numeric",
      "tag": "POR QUE FUNCIONA",
      "title": ["TREINADO COM", "MAIS DE 1.200", "POSTS REAIS."],
      "highlightWords": ["1.200"],
      "body": "Nossa IA aprendeu com os melhores. Você usa esse aprendizado.",
      "imagePrompts": [],
      "background": "cream",
      "titlePosition": "middle"
    },
    {
      "pageNumber": 5,
      "totalPages": 5,
      "layoutType": "cta",
      "variant": "text-only",
      "tag": "SUA VEZ",
      "title": ["CRIE CARROSSÉIS", "VIRAIS EM", "3 MINUTOS."],
      "highlightWords": ["VIRAIS"],
      "body": "Teste grátis. 2 imagens. Sem cartão.",
      "callout": "COMEÇAR AGORA →",
      "imagePrompts": [],
      "background": "cream",
      "titlePosition": "top"
    }
  ]
}

================================================
🚨 LEMBRETES FINAIS
================================================

1. NUNCA invente cores fora da paleta SyncPost
2. SEMPRE use exatamente os 9 layoutTypes válidos
3. SEMPRE quebre títulos em 3-5 palavras por linha
4. SEMPRE escreva imagePrompts em INGLÊS
5. NUNCA mencione personagens reais em imagePrompts
6. NUNCA peça texto/letras na imagem
7. background sempre da lista permitida (dark/cream/white/photo)
8. titlePosition sempre presente, varia entre slides
9. RETORNE apenas JSON, sem markdown ou explicações`

interface GenerateCarouselParams {
  topic: string
  brandInfo: BrandInfo
  tone: 'profissional' | 'casual' | 'direto'
  targetAudience: string
  desiredSlides?: number
}

const VALID_LAYOUTS: LayoutType[] = [
  'capa',
  'problema',
  'demo',
  'novidade',
  'prova',
  'texto-foto',
  'sepia',
  'serif',
  'cta',
]
const VALID_BACKGROUNDS: BackgroundType[] = ['dark', 'cream', 'white', 'photo']
const VALID_VARIANTS: Record<string, string[]> = {
  demo: ['auto', 'single', 'comparison', 'process'],
  novidade: ['auto', 'text-only', 'single-large', 'pair', 'grid-three'],
  prova: ['numeric', 'single-print', 'multiple-prints', 'logo-cloud'],
  'texto-foto': ['text-only', 'image-bottom', 'image-middle', 'image-bg'],
  cta: ['auto', 'text-only', 'product-mockup', 'human-photo', 'composition'],
}
const BG_DEFAULTS: Record<string, BackgroundType> = {
  capa: 'photo',
  problema: 'dark',
  demo: 'cream',
  novidade: 'cream',
  prova: 'cream',
  'texto-foto': 'white',
  sepia: 'photo',
  serif: 'dark',
  cta: 'cream',
}

/**
 * Valida e corrige um carrossel gerado pela IA. Loga warnings pra cada
 * correção forçada — útil pra detectar quando a IA está delirando.
 */
function validateAndFixCarousel(raw: unknown): EditorialCarousel {
  const carousel = raw as Partial<EditorialCarousel>
  console.log('🔍 [Editorial] Validando carrossel gerado…')

  if (!carousel.slides || !Array.isArray(carousel.slides)) {
    throw new Error('IA retornou JSON sem array de slides')
  }

  const fixedSlides = carousel.slides.map((slideRaw, idx) => {
    const slide = slideRaw as EditorialSlide & { variant?: string }

    // layoutType
    if (!VALID_LAYOUTS.includes(slide.layoutType)) {
      console.warn(
        `⚠️  Slide ${idx + 1}: layoutType inválido "${slide.layoutType}". Forçando "texto-foto".`,
      )
      slide.layoutType = 'texto-foto'
    }

    // background
    let bg = slide.background as string | undefined
    // Aliases legacy → dark
    if (bg === 'navy' || bg === 'sepia' || bg === 'blue') bg = 'dark'
    if (!bg || !VALID_BACKGROUNDS.includes(bg as BackgroundType)) {
      const fallback = BG_DEFAULTS[slide.layoutType] || 'cream'
      console.warn(
        `⚠️  Slide ${idx + 1}: background inválido "${bg}". Forçando "${fallback}" (default do layout ${slide.layoutType}).`,
      )
      bg = fallback
    }
    // Capa e sepia sempre "photo"
    if (slide.layoutType === 'capa' || slide.layoutType === 'sepia') bg = 'photo'
    slide.background = bg as BackgroundType

    // variant
    if (VALID_VARIANTS[slide.layoutType]) {
      if (!slide.variant || !VALID_VARIANTS[slide.layoutType].includes(slide.variant)) {
        const def = VALID_VARIANTS[slide.layoutType][0]
        console.warn(
          `⚠️  Slide ${idx + 1}: variant inválida "${slide.variant}" pra ${slide.layoutType}. Usando "${def}".`,
        )
        slide.variant = def
      }
    } else {
      delete slide.variant
    }

    // title (deve ser array)
    if (!Array.isArray(slide.title)) {
      console.warn(`⚠️  Slide ${idx + 1}: title não é array. Convertendo.`)
      slide.title = typeof slide.title === 'string' ? [slide.title] : ['TÍTULO']
    }

    // highlightWords
    if (!Array.isArray(slide.highlightWords)) slide.highlightWords = []

    // imagePrompts
    if (!Array.isArray(slide.imagePrompts)) slide.imagePrompts = []
    // Capa sem imagePrompts → injeta default genérico
    if (slide.layoutType === 'capa' && slide.imagePrompts.length === 0) {
      console.warn(`⚠️  Slide ${idx + 1} (capa): sem imagePrompts. Injetando default.`)
      slide.imagePrompts = [
        'cinematic editorial portrait, dramatic side lighting, deep shadows, professional photography, high contrast, premium magazine aesthetic, no text',
      ]
    }

    // titlePosition
    if (
      !slide.titlePosition ||
      !['top', 'middle', 'bottom'].includes(slide.titlePosition)
    ) {
      slide.titlePosition = slide.layoutType === 'capa' ? 'bottom' : 'middle'
    }

    // pageNumber/totalPages
    slide.pageNumber = idx + 1
    slide.totalPages = carousel.slides!.length

    return slide
  })

  const result: EditorialCarousel = {
    totalSlides: fixedSlides.length,
    brandName: carousel.brandName || 'SYNCPOST',
    handle: carousel.handle || '@syncpost_',
    topic: carousel.topic || '',
    slides: fixedSlides,
    createdAt: carousel.createdAt || new Date().toISOString(),
  }

  console.log('✅ [Editorial] Carrossel validado:', {
    slides: result.slides.length,
    layouts: result.slides.map((s) => s.layoutType),
    backgrounds: result.slides.map((s) => s.background),
    titlePositions: result.slides.map((s) => s.titlePosition),
  })

  return result
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

  console.log('📝 [Editorial] Chamando Anthropic Claude…')
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

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch (err) {
    console.error('❌ [Editorial] JSON inválido da Anthropic:', jsonText.slice(0, 500))
    throw new Error(
      `Anthropic retornou JSON inválido: ${err instanceof Error ? err.message : 'parse error'}`,
    )
  }

  const carousel = validateAndFixCarousel(parsed)

  // Injeta brandInfo em cada slide e marca createdAt
  carousel.slides = carousel.slides.map((slide) => ({
    ...slide,
    brandInfo: params.brandInfo,
  }))
  carousel.createdAt = new Date().toISOString()

  return carousel
}
