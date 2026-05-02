# 🚀 SESSÃO 2 — LAYOUTS FLEXÍVEIS + ENGINE DE IA
## Template Editorial SyncPost — Parte 2 de 3

> **Pré-requisito:** Sessão 1 completa
> **Tempo estimado:** 8-10 horas de Claude Code
> **Entregável:** 5 layouts flexíveis + IA gerando carrossel completo

---

## ⚠️ ANTES DE COMEÇAR

Cole no Claude Code:

```
Sessão 1 do Template Editorial está completa. 

Verifica:
1. git status na branch feature/template-editorial
2. Confirma que os 4 layouts rígidos renderizam em /test-editorial
3. Lista os arquivos criados na Sessão 1
4. Aguarda meu próximo prompt
```

Depois cole o prompt abaixo.

---

## 📋 CONTEXTO

Você (Claude Code) vai implementar a **SEGUNDA PARTE** do Template Editorial:
- ✅ 5 layouts FLEXÍVEIS com variantes
- ✅ Engine de IA (Anthropic Claude + Fal.ai)
- ✅ Sistema de sugestão de variante baseado na copy

Layouts a implementar nesta sessão:
- Layout 03 — Demo (3 variantes: single, comparison, process)
- Layout 04 — Novidade (4 variantes: text-only, single-large, pair, grid-three)
- Layout 05 — Prova (4 variantes: numeric, single-print, multiple-prints, logo-cloud)
- Layout 06 — Texto+Foto (4 variantes: text-only, image-bottom, image-middle, image-bg)
- Layout 09 — CTA (4 variantes: text-only, product-mockup, human-photo, composition)

---

## 🎯 ESCOPO DESTA SESSÃO

### Fase 3 — Layouts Flexíveis (5-6h)
Cada layout flexível precisa:
- Componente principal que aceita `variant` como prop
- Render condicional baseado na variante
- Posicionamento adaptativo de imagens
- Comportamento consistente (header, footer, tag, título)

### Fase 4 — Engine de IA (3-4h)
- Integração com Anthropic Claude (geração de roteiro)
- Integração com Fal.ai (geração de imagens)
- Função que sugere variante automaticamente
- Salvar carrossel no Supabase

---

## 🔓 LAYOUT 03 — DEMO (FLEXÍVEL)

**Variantes:**
- `single` — 1 imagem grande
- `comparison` — 2 imagens lado a lado
- `process` — 3 imagens em sequência

```typescript
// layouts/03-DemoLayout.tsx

'use client';

import { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Text } from 'react-konva';
import { EditorialSlide } from '../editorial.types';
import { CANVAS_CONFIG, EDITORIAL_SIZES, EDITORIAL_COLORS, EDITORIAL_FONTS } from '../editorial.config';
import { EditorialHeader } from '../shared/EditorialHeader';
import { EditorialFooter } from '../shared/EditorialFooter';
import { HighlightedTitle } from '../shared/HighlightedTitle';
import { Tag } from '../shared/Tag';
import { BodyText } from '../shared/BodyText';

interface DemoLayoutProps {
  slide: EditorialSlide;
  scale?: number;
}

export function DemoLayout({ slide, scale = 1 }: DemoLayoutProps) {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  
  useEffect(() => {
    if (!slide.images?.length) return;
    
    Promise.all(
      slide.images.map(url => 
        new Promise<HTMLImageElement>((resolve) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.src = url;
        })
      )
    ).then(setImages);
  }, [slide.images]);
  
  const isLight = slide.background === 'cream' || slide.background === 'white';
  const bgColor = isLight ? EDITORIAL_COLORS.bg.cream : EDITORIAL_COLORS.bg.dark;
  const textColor = isLight ? EDITORIAL_COLORS.text.dark : EDITORIAL_COLORS.text.white;
  const brandColor = slide.brandInfo.brandColor || EDITORIAL_COLORS.brand.primary;
  
  const variant = slide.variant || 'single';
  
  return (
    <Stage
      width={CANVAS_CONFIG.width * scale}
      height={CANVAS_CONFIG.height * scale}
      scaleX={scale}
      scaleY={scale}
    >
      <Layer>
        <Rect width={CANVAS_CONFIG.width} height={CANVAS_CONFIG.height} fill={bgColor} />
        
        <EditorialHeader
          brandName={slide.brandInfo.name}
          handle={slide.brandInfo.handle}
          textColor={textColor}
        />
        
        {slide.tag && (
          <Tag
            text={slide.tag}
            x={EDITORIAL_SIZES.footer.paddingX}
            y={150}
            color={textColor}
            opacity={0.5}
          />
        )}
        
        <HighlightedTitle
          lines={slide.title}
          highlightWords={slide.highlightWords}
          highlightColor={brandColor}
          defaultColor={textColor}
          x={EDITORIAL_SIZES.footer.paddingX}
          y={200}
          fontSize={EDITORIAL_SIZES.titleLarge.fontSize}
          lineHeight={EDITORIAL_SIZES.titleLarge.lineHeight}
        />
        
        {/* Renderização da imagem baseada na variante */}
        {variant === 'single' && images[0] && (
          <KonvaImage
            image={images[0]}
            x={EDITORIAL_SIZES.footer.paddingX}
            y={650}
            width={CANVAS_CONFIG.width - 200}
            height={400}
            cornerRadius={12}
          />
        )}
        
        {variant === 'comparison' && images.length >= 2 && (
          <>
            <KonvaImage
              image={images[0]}
              x={EDITORIAL_SIZES.footer.paddingX}
              y={650}
              width={(CANVAS_CONFIG.width - 220) / 2}
              height={400}
              cornerRadius={12}
            />
            <KonvaImage
              image={images[1]}
              x={EDITORIAL_SIZES.footer.paddingX + (CANVAS_CONFIG.width - 220) / 2 + 20}
              y={650}
              width={(CANVAS_CONFIG.width - 220) / 2}
              height={400}
              cornerRadius={12}
            />
          </>
        )}
        
        {variant === 'process' && images.length >= 3 && (
          <>
            {images.slice(0, 3).map((img, i) => (
              <KonvaImage
                key={i}
                image={img}
                x={EDITORIAL_SIZES.footer.paddingX + i * ((CANVAS_CONFIG.width - 240) / 3 + 20)}
                y={650}
                width={(CANVAS_CONFIG.width - 240) / 3}
                height={400}
                cornerRadius={12}
              />
            ))}
          </>
        )}
        
        {/* Body text */}
        {slide.body && (
          <BodyText
            text={slide.body}
            x={EDITORIAL_SIZES.footer.paddingX}
            y={CANVAS_CONFIG.height - 220}
            width={CANVAS_CONFIG.width - 200}
            color={textColor}
            size="medium"
          />
        )}
        
        <EditorialFooter
          pageNumber={slide.pageNumber}
          totalPages={slide.totalPages}
          textColor={isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)'}
          lineColor={isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}
        />
      </Layer>
    </Stage>
  );
}
```

---

## 🔓 LAYOUT 04 — NOVIDADE (FLEXÍVEL)

**Variantes:**
- `text-only` — sem imagens (anúncio textual forte)
- `single-large` — 1 mockup grande centralizado
- `pair` — 2 mockups lado a lado
- `grid-three` — 3 mockups em grid

Estrutura similar ao Layout 03, com diferenças:
- Sempre fundo claro (cream)
- Tag uppercase no topo ("A NOVIDADE")
- Título preto com palavras destacadas em roxo
- Callout preto opcional no rodapé

```typescript
// layouts/04-NovidadeLayout.tsx
// IMPLEMENTAR seguindo o padrão do Layout 03
// Diferenças principais:
// - bgColor sempre cream/white
// - Suporta variant 'text-only' (sem imagens)
// - Para 'single-large': imagem ocupa quase toda largura
// - Para 'grid-three': 3 mockups em proporção 4:5
// - Callout preto no rodapé com slide.callout
```

**Implementação:** Use o Layout 03 como base, mas:
1. Sempre fundo claro
2. Adicione branch `if (variant === 'text-only') { renderiza só título grande }`
3. Adicione `<Callout />` se `slide.callout` existir
4. Mockups em proporção 4:5 (não 16:9 como o 03)

---

## 🔓 LAYOUT 05 — PROVA (FLEXÍVEL)

**Variantes:**
- `numeric` — sem imagens, foco em número grande
- `single-print` — 1 print de Instagram/depoimento
- `multiple-prints` — 2-3 prints
- `logo-cloud` — múltiplos logos em grid

```typescript
// layouts/05-ProvaLayout.tsx
// Estrutura específica:
// - Background sempre cream
// - Tag "POR QUE FUNCIONA" ou "PROVA"
// - Para 'numeric': título com NÚMERO GIGANTE em roxo (ex: "1.200")
// - Para 'single-print': um card branco com mockup de print Instagram
// - Para 'multiple-prints': 2-3 cards menores
// - Para 'logo-cloud': grid de 6-12 logos
```

**Detalhe importante:** o "print de Instagram" é renderizado como um card branco com bordas arredondadas, simulando a UI do Instagram (avatar circular + nome + texto + barras de loading).

---

## 🔓 LAYOUT 06 — TEXTO+FOTO (FLEXÍVEL)

**Variantes:**
- `text-only` — texto grande sem imagens
- `image-bottom` — 1 foto vertical embaixo (40% da altura)
- `image-middle` — 1 foto horizontal no meio
- `image-bg` — 1 foto background com overlay

```typescript
// layouts/06-TextoFotoLayout.tsx
// Estrutura:
// - Background pode ser white ou cream
// - Sem tag (slide narrativo)
// - Body text GRANDE (38px) é o protagonista
// - Highlight de palavras-chave em roxo no body
// - Para 'image-bottom': foto vertical embaixo do texto
// - Para 'image-middle': foto horizontal entre dois blocos de texto
// - Para 'image-bg': foto cobre todo canvas com overlay branco translúcido
```

**Detalhe técnico — Highlight no body:**

Para destacar palavras no body (não no título), precisa adaptar o `HighlightedTitle` ou criar `HighlightedBody`. Recomendação: criar `HighlightedBody` específico, similar mas com fonte body ao invés de display.

```typescript
// shared/HighlightedBody.tsx
// Igual HighlightedTitle, mas:
// - Usa fonte body (Space Grotesk)
// - Suporta peso 500/600 ao invés de 700
// - Quebra de linha automática (não baseada em array)
// - Word wrap baseado em width disponível
```

---

## 🔓 LAYOUT 09 — CTA FINAL (FLEXÍVEL)

**Variantes:**
- `text-only` — apenas título + botão (sem imagens)
- `product-mockup` — 1 mockup do app/produto
- `human-photo` — 1 foto humana inspiradora
- `composition` — múltiplos elementos compostos

```typescript
// layouts/09-CtaLayout.tsx
// Estrutura:
// - Background cream
// - Tag "SUA VEZ" ou "COMECE AGORA"
// - Título grande com palavra de destaque
// - Imagem (opcional, depende da variante)
// - BOTÃO ROXO destacado (sempre presente)
// - Callout abaixo do botão se houver
```

**Botão CTA — implementação:**

```typescript
// Função renderCtaButton dentro do Layout 09
function renderCtaButton(text: string, x: number, y: number, brandColor: string) {
  return (
    <Group x={x} y={y}>
      <Rect
        width={400}
        height={64}
        fill={brandColor}
        cornerRadius={8}
      />
      <Text
        text={text}
        x={0}
        y={20}
        width={400}
        fontSize={20}
        fontFamily={EDITORIAL_FONTS.bodyBold.family}
        fontStyle="600"
        fill="white"
        align="center"
        letterSpacing={1}
      />
    </Group>
  );
}
```

---

## 🤖 ENGINE DE IA — Anthropic Claude

### Arquivo: `lib/editorial/ai-content.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { EditorialCarousel, EditorialSlide, BrandInfo } from '@/components/templates/editorial/editorial.types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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
}`;

interface GenerateCarouselParams {
  topic: string;
  brandInfo: BrandInfo;
  tone: 'profissional' | 'casual' | 'direto';
  targetAudience: string;
  desiredSlides?: number;
}

export async function generateEditorialCarousel(
  params: GenerateCarouselParams
): Promise<EditorialCarousel> {
  const userPrompt = `Tema do carrossel: "${params.topic}"

Marca: ${params.brandInfo.name}
Handle: ${params.brandInfo.handle}
Tom de voz: ${params.tone}
Público-alvo: ${params.targetAudience}
Número de slides desejado: ${params.desiredSlides || '5-7 (você decide)'}

Gere um carrossel editorial completo no formato JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userPrompt }
    ],
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('Resposta inválida da Anthropic');
  }

  // Limpar markdown se houver
  let jsonText = textContent.text.trim();
  if (jsonText.startsWith('```json')) jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
  if (jsonText.startsWith('```')) jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');

  const carousel: EditorialCarousel = JSON.parse(jsonText);
  
  // Adicionar brandInfo em cada slide
  carousel.slides = carousel.slides.map(slide => ({
    ...slide,
    brandInfo: params.brandInfo,
  }));
  
  carousel.createdAt = new Date().toISOString();
  
  return carousel;
}
```

---

## 🖼️ ENGINE DE IMAGENS — Fal.ai

### Arquivo: `lib/editorial/ai-images.ts`

```typescript
import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY!,
});

interface GenerateImageParams {
  prompt: string;
  style?: 'cinematic' | 'editorial' | 'minimal' | 'sepia';
  aspectRatio?: '4:5' | '1:1' | '16:9' | '9:16';
}

const STYLE_PROMPTS = {
  cinematic: 'cinematic photography, dramatic lighting, deep shadows, moody atmosphere, professional editorial photo, high contrast',
  editorial: 'magazine editorial photography, clean composition, premium feel, sharp details, professional studio lighting',
  minimal: 'minimalist composition, lots of negative space, simple and clean, soft natural light',
  sepia: 'sepia tone, warm brown colors, vintage aesthetic, film photography look, slight grain',
};

const ASPECT_TO_SIZE = {
  '4:5': 'portrait_4_3',
  '1:1': 'square_hd',
  '16:9': 'landscape_16_9',
  '9:16': 'portrait_16_9',
};

export async function generateEditorialImage(params: GenerateImageParams): Promise<string> {
  const style = params.style || 'cinematic';
  const enhancedPrompt = `${params.prompt}, ${STYLE_PROMPTS[style]}, high quality, 4k`;
  
  const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt: enhancedPrompt,
      image_size: ASPECT_TO_SIZE[params.aspectRatio || '4:5'],
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: true,
    },
  });
  
  if (!result.data?.images?.[0]?.url) {
    throw new Error('Fal.ai não retornou imagem válida');
  }
  
  return result.data.images[0].url;
}

export async function generateImagesForSlide(slide: any): Promise<string[]> {
  if (!slide.imagePrompts?.length) return [];
  
  // Determinar style baseado no layout
  const style = 
    slide.layoutType === 'sepia' ? 'sepia' :
    slide.layoutType === 'capa' ? 'cinematic' :
    slide.layoutType === 'texto-foto' ? 'editorial' :
    'minimal';
  
  // Determinar aspect ratio baseado na variante
  const aspectRatio = 
    slide.layoutType === 'capa' ? '4:5' :
    slide.layoutType === 'sepia' ? '4:5' :
    (slide.variant === 'single' || slide.variant === 'image-bg') ? '4:5' :
    (slide.variant === 'comparison' || slide.variant === 'pair') ? '1:1' :
    (slide.variant === 'process' || slide.variant === 'grid-three') ? '4:5' :
    '4:5';
  
  // Gerar imagens em paralelo
  const imagePromises = slide.imagePrompts.map((prompt: string) =>
    generateEditorialImage({ prompt, style, aspectRatio })
  );
  
  return await Promise.all(imagePromises);
}
```

---

## 🎬 ORQUESTRADOR PRINCIPAL

### Arquivo: `lib/editorial/generator.ts`

```typescript
import { generateEditorialCarousel } from './ai-content';
import { generateImagesForSlide } from './ai-images';
import { EditorialCarousel, BrandInfo } from '@/components/templates/editorial/editorial.types';

interface GenerateParams {
  topic: string;
  brandInfo: BrandInfo;
  tone: 'profissional' | 'casual' | 'direto';
  targetAudience: string;
  onProgress?: (step: string, current: number, total: number) => void;
}

export async function generateCompleteCarousel(params: GenerateParams): Promise<EditorialCarousel> {
  // Step 1: Gerar roteiro com Claude
  params.onProgress?.('Criando roteiro com IA...', 0, 100);
  const carousel = await generateEditorialCarousel({
    topic: params.topic,
    brandInfo: params.brandInfo,
    tone: params.tone,
    targetAudience: params.targetAudience,
  });
  
  params.onProgress?.('Roteiro pronto. Gerando imagens...', 30, 100);
  
  // Step 2: Gerar imagens pra cada slide
  const totalImages = carousel.slides.reduce((acc, s) => acc + (s.imagePrompts?.length || 0), 0);
  let generatedImages = 0;
  
  for (let i = 0; i < carousel.slides.length; i++) {
    const slide = carousel.slides[i];
    
    if (slide.imagePrompts?.length) {
      const images = await generateImagesForSlide(slide);
      slide.images = images;
      generatedImages += images.length;
      
      const progress = 30 + Math.floor((generatedImages / totalImages) * 60);
      params.onProgress?.(
        `Gerando imagem ${generatedImages} de ${totalImages}...`,
        progress,
        100
      );
    }
  }
  
  params.onProgress?.('Carrossel pronto!', 100, 100);
  
  return carousel;
}
```

---

## 🗄️ PERSISTÊNCIA NO SUPABASE

### Migration:

Crie `supabase/migrations/0006_editorial_carousels.sql`:

```sql
CREATE TABLE editorial_carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  brand_name TEXT,
  handle TEXT,
  carousel_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_editorial_carousels_user_id ON editorial_carousels(user_id);
CREATE INDEX idx_editorial_carousels_created_at ON editorial_carousels(created_at DESC);

ALTER TABLE editorial_carousels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own carousels"
  ON editorial_carousels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own carousels"
  ON editorial_carousels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own carousels"
  ON editorial_carousels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own carousels"
  ON editorial_carousels FOR DELETE
  USING (auth.uid() = user_id);
```

### Funções de save/load:

```typescript
// lib/editorial/persistence.ts

import { createClient } from '@/lib/supabase/server';
import { EditorialCarousel } from '@/components/templates/editorial/editorial.types';

export async function saveCarousel(carousel: EditorialCarousel, userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('editorial_carousels')
    .insert({
      user_id: userId,
      topic: carousel.topic,
      brand_name: carousel.brandName,
      handle: carousel.handle,
      carousel_data: carousel,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function loadCarousel(carouselId: string, userId: string): Promise<EditorialCarousel> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('editorial_carousels')
    .select('*')
    .eq('id', carouselId)
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data.carousel_data as EditorialCarousel;
}
```

---

## 🧪 ROTA DE TESTE — `/test-editorial-ai`

Crie uma rota pra testar a geração end-to-end:

```typescript
// app/api/test-editorial/route.ts

import { NextResponse } from 'next/server';
import { generateCompleteCarousel } from '@/lib/editorial/generator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const carousel = await generateCompleteCarousel({
      topic: body.topic || '5 erros que matam carrossel no Instagram',
      brandInfo: {
        name: 'SYNCPOST',
        handle: '@SYNCPOST_',
      },
      tone: 'direto',
      targetAudience: 'criadores de conteúdo',
    });
    
    return NextResponse.json({ success: true, carousel });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

E uma página simples pra testar:

```typescript
// app/test-editorial-ai/page.tsx

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Imports dinâmicos dos layouts
const layouts: Record<string, any> = {
  capa: dynamic(() => import('@/components/templates/editorial/layouts/01-CapaLayout').then(m => m.CapaLayout), { ssr: false }),
  problema: dynamic(() => import('@/components/templates/editorial/layouts/02-ProblemaLayout').then(m => m.ProblemaLayout), { ssr: false }),
  demo: dynamic(() => import('@/components/templates/editorial/layouts/03-DemoLayout').then(m => m.DemoLayout), { ssr: false }),
  novidade: dynamic(() => import('@/components/templates/editorial/layouts/04-NovidadeLayout').then(m => m.NovidadeLayout), { ssr: false }),
  prova: dynamic(() => import('@/components/templates/editorial/layouts/05-ProvaLayout').then(m => m.ProvaLayout), { ssr: false }),
  'texto-foto': dynamic(() => import('@/components/templates/editorial/layouts/06-TextoFotoLayout').then(m => m.TextoFotoLayout), { ssr: false }),
  sepia: dynamic(() => import('@/components/templates/editorial/layouts/07-SepiaLayout').then(m => m.SepiaLayout), { ssr: false }),
  serif: dynamic(() => import('@/components/templates/editorial/layouts/08-SerifLayout').then(m => m.SerifLayout), { ssr: false }),
  cta: dynamic(() => import('@/components/templates/editorial/layouts/09-CtaLayout').then(m => m.CtaLayout), { ssr: false }),
};

export default function TestEditorialAIPage() {
  const [topic, setTopic] = useState('5 erros que matam carrossel no Instagram');
  const [carousel, setCarousel] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/test-editorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      setCarousel(data.carousel);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">Test Editorial AI</h1>
      
      <div className="mb-6 max-w-2xl">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Tema do carrossel"
          className="w-full p-3 border rounded mb-2"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-purple-600 text-white px-6 py-3 rounded disabled:opacity-50"
        >
          {loading ? 'Gerando...' : 'Gerar Carrossel'}
        </button>
      </div>
      
      {carousel && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {carousel.slides.map((slide: any, idx: number) => {
            const Layout = layouts[slide.layoutType];
            if (!Layout) return null;
            return (
              <div key={idx} className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-2">
                  Slide {slide.pageNumber} — {slide.layoutType} {slide.variant && `(${slide.variant})`}
                </p>
                <Layout slide={slide} scale={0.4} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

---

## ✅ VALIDAÇÃO FINAL DA SESSÃO 2

Após implementar tudo:

1. **Testa geração de IA:**
```bash
# Acessa http://localhost:3000/test-editorial-ai
# Digita um tema
# Clica "Gerar Carrossel"
# Aguarda 30-60s
# Vê todos os slides renderizados
```

2. **Valida visualmente:**
   - [ ] IA gerou 5-7 slides coerentes
   - [ ] Cada slide tem layoutType correto
   - [ ] Variantes dos layouts flexíveis fazem sentido
   - [ ] Imagens da Fal.ai aparecem nos slides
   - [ ] Highlights de palavras em roxo funcionam

3. **Console do navegador:**
   - [ ] Sem erros de Konva
   - [ ] Sem erros de fontes
   - [ ] Sem erros de CORS nas imagens

4. **Rede (Network tab):**
   - [ ] Chamada pra Anthropic completou (status 200)
   - [ ] Chamadas pra Fal.ai completaram (status 200)

5. **Tira screenshots de um carrossel completo** e me reporta:
   - Como ficou
   - O que precisa ajustar
   - Algum bug encontrado

---

## 🚨 PROBLEMAS COMUNS

### Anthropic retorna JSON inválido
**Causa:** Modelo às vezes adiciona texto antes/depois do JSON
**Solução:** Já tratado no código (limpa ```json blocks)

### Fal.ai retorna 402 (créditos)
**Causa:** Saldo da conta acabou
**Solução:** Recarrega na conta Fal.ai. Pra testes, considere usar `fal-ai/flux/schnell` (mais barato)

### Imagens da Fal.ai não carregam no Konva
**Causa:** CORS bloqueia
**Solução:** No `next.config.js`:
```javascript
images: {
  domains: ['images.unsplash.com', 'fal.media', 'storage.fal.media', 'v3.fal.media'],
}
```

### Variantes não renderizam corretamente
**Causa:** A IA pode retornar variant diferente do esperado
**Solução:** Adiciona fallback default no componente:
```typescript
const variant = slide.variant || 'single';  // sempre tem default
```

### TypeError: Cannot read property 'images' of undefined
**Causa:** Slide veio sem images mas componente tenta acessar
**Solução:** `slide.images?.[0]` em todos os acessos

---

## 🎯 COMMIT FINAL DA SESSÃO 2

```bash
git add .
git commit -m "feat(editorial): layouts flexíveis + engine de IA"
```

---

**Quando terminar, volta aqui e me reporta:**
1. Screenshot de um carrossel completo gerado pela IA
2. Tempo total da geração (Claude + Fal.ai)
3. Custo aproximado em Fal.ai (verifica no dashboard)
4. Bugs encontrados

Aí mando a Sessão 3 (Interface + Export).
