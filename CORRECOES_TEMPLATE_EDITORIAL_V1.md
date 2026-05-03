# 🔧 CORREÇÕES TEMPLATE EDITORIAL — V1
## Patches críticos pra resolver problemas de paleta e renderização

> **Para:** Claude Code
> **Contexto:** Template Editorial gerou carrossel com paleta errada (azul ciano em vez de roxo SyncPost)
> **Causa provável:** Prompt de IA não força paleta com força suficiente

---

## 🎯 OBJETIVO

Resolver 4 problemas:

1. **IA inventa cores** (precisa forçar paleta SyncPost)
2. **Layouts não validados** (precisa fallback se IA retornar layout inválido)
3. **Falta debug** (precisa logs detalhados pra identificar problemas)
4. **Imagens podem falhar silenciosamente** (precisa retry e validação)

---

## 🔴 CORREÇÃO 1: System Prompt da IA (CRÍTICO)

### Arquivo: `lib/editorial/ai-content.ts`

Substitua o `SYSTEM_PROMPT` pelo conteúdo abaixo. Mudanças principais:
- Lista negra de cores proibidas
- Lista branca de paleta SyncPost
- Few-shot examples
- Instruções mais rígidas sobre layout

```typescript
const SYSTEM_PROMPT = `Você é um diretor criativo de carrosséis virais para Instagram do SyncPost.
Cria carrosséis em estilo editorial (estilo @brandsdecoded__).

================================================
🎨 PALETA SYNCPOST — REGRA INVIOLÁVEL
================================================

CORES PERMITIDAS (use APENAS estas):
- Preto profundo: #0A0A0F
- Navy escuro: #0F0F1F
- Bege claro: #F5F2EC
- Branco: #FFFFFF
- Sépia (apenas layout 07): #3A2818
- Roxo principal (highlight): #7C3AED
- Roxo claro (subtítulos): #A78BFA
- Roxo pálido (decoração): #DDD6FE

❌ CORES PROIBIDAS (NUNCA use):
- Azul (qualquer tom): #00ACC8, #2196F3, #1E88E5, #0277BD
- Verde, vermelho, amarelo, laranja, rosa
- Qualquer cor que não esteja na lista permitida acima

PROPRIEDADE 'background' do JSON deve ser SEMPRE um destes valores:
- "dark" (= #0A0A0F)
- "navy" (= #0F0F1F apenas para layout 'serif')
- "cream" (= #F5F2EC)
- "white" (= #FFFFFF)
- "sepia" (apenas para layout 'sepia')
- "photo" (apenas para layout 'capa' e 'sepia')

NUNCA invente cores. NUNCA use HEX customizado no JSON.

================================================
📐 LAYOUTS DISPONÍVEIS — USE APENAS ESTES
================================================

layoutType DEVE ser EXATAMENTE um destes 9 valores (case-sensitive):
1. "capa"        — primeiro slide (foto + título gigante)
2. "problema"    — apresenta a dor (fundo dark + número translúcido)
3. "demo"        — demonstração visual (1, 2 ou 3 imagens)
4. "novidade"    — anuncia solução/feature
5. "prova"       — prova social/dados
6. "texto-foto"  — narrativo (texto + imagem opcional)
7. "sepia"       — quebra visual (foto sépia)
8. "serif"       — slide conceitual (tipografia serif)
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
- Slides 3-5: combinação de demo, novidade, prova, texto-foto
- Slide 6 (opcional): sepia ou serif (variação visual)
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

EXEMPLOS CORRETOS:
✅ ["VOCÊ POSTA", "E NINGUÉM", "CURTE."]
✅ ["5 ERROS QUE", "MATAM SEU", "CARROSSEL."]
✅ ["AGORA DÁ", "PRA CRIAR", "EM 3 MINUTOS."]

EXEMPLOS ERRADOS:
❌ ["você posta e ninguém curte"] (1 linha só, lowercase)
❌ ["AAAA", "B", "C"] (linhas muito curtas)
❌ ["VOCÊ POSTA E NINGUÉM CURTE NO SEU INSTAGRAM HOJE"] (linha gigante)

================================================
🎯 HIGHLIGHTWORDS — PALAVRAS DE DESTAQUE
================================================

PROPRIEDADE 'highlightWords': array de palavras que serão destacadas em ROXO

REGRAS:
- 1 ou 2 palavras por slide (não mais)
- Devem aparecer EXATAMENTE como estão no title
- Verbos fortes ou substantivos centrais
- Última palavra do título é boa candidata

EXEMPLOS CORRETOS:
✅ title: ["VOCÊ POSTA", "E NINGUÉM", "CURTE."]
   highlightWords: ["CURTE."]

✅ title: ["AGORA DÁ PRA", "CRIAR EM", "3 MINUTOS."]
   highlightWords: ["3 MINUTOS."]

✅ title: ["TREINADO COM", "MAIS DE 1.200", "POSTS REAIS."]
   highlightWords: ["1.200"]

================================================
🖼️ IMAGEM PROMPTS — INSTRUÇÕES PARA Fal.ai
================================================

PROPRIEDADE 'imagePrompts': array de prompts em INGLÊS para gerar imagens

REGRAS CRÍTICAS:
- Prompts em INGLÊS (Flux funciona melhor em inglês)
- Específico sobre clima, iluminação, atmosfera
- NUNCA mencione personagens reais (Brad Pitt, Tom Cruise, etc) — proibido por copyright
- NUNCA peça texto na imagem (Flux escreve mal)
- Conecte com TEMA do carrossel (não foto genérica)

EXEMPLO CORRETO (para tema "Era Uma Vez em Hollywood"):
✅ "Vintage 1969 Los Angeles street at golden hour, classic cars, neon cinema marquee lights, warm orange and red tones, cinematic atmosphere, retro film aesthetic, no people"

EXEMPLO ERRADO:
❌ "Brad Pitt and Leonardo DiCaprio in Hollywood"  (copyright)
❌ "Hollywood sign"  (genérico demais, sem clima)
❌ "Image with text saying ONCE UPON A TIME"  (Flux erra texto)

QUANTAS IMAGENS POR SLIDE:
- capa: 1 imagem (cinematográfica)
- problema: 0 imagens (só texto)
- demo: 1, 2 ou 3 (depende da variant)
- novidade: 0, 1, 2 ou 3 (depende da variant)
- prova: 0, 1, 2 ou 3 (depende da variant)
- texto-foto: 0 ou 1 (depende da variant)
- sepia: 1 imagem
- serif: 0 ou 1 imagem
- cta: 0 ou 1 imagem

================================================
🔄 VARIANTES — APENAS PARA LAYOUTS FLEXÍVEIS
================================================

Layouts flexíveis DEVEM ter propriedade 'variant'. 
Layouts rígidos NÃO TÊM 'variant'.

LAYOUTS FLEXÍVEIS:
- demo: variant = "single" | "comparison" | "process"
- novidade: variant = "text-only" | "single-large" | "pair" | "grid-three"
- prova: variant = "numeric" | "single-print" | "multiple-prints" | "logo-cloud"
- texto-foto: variant = "text-only" | "image-bottom" | "image-middle" | "image-bg"
- cta: variant = "text-only" | "product-mockup" | "human-photo" | "composition"

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
      "bodyBoldLead": string (opcional),
      "callout": string (opcional),
      "subtitle": string (apenas capa),
      "imagePrompts": string[] (em inglês, sem personagens reais),
      "background": "dark" | "cream" | "white" | "navy" | "sepia" | "photo",
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
      "imagePrompts": ["Frustrated young content creator looking at smartphone with disappointment, dramatic moody lighting, urban setting at dusk, cinematic photography, deep purple and black tones"],
      "background": "photo"
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
      "background": "dark"
    },
    {
      "pageNumber": 3,
      "totalPages": 5,
      "layoutType": "demo",
      "variant": "comparison",
      "tag": "ANTES E DEPOIS",
      "title": ["A DIFERENÇA É", "GRITANTE."],
      "highlightWords": ["GRITANTE."],
      "body": "Capa fraca não para o scroll. Capa forte para o scroll em 0.3 segundos.",
      "imagePrompts": [
        "Plain boring social media post mockup, generic design, low quality aesthetic, on white background",
        "Premium editorial social media post mockup, bold typography, eye-catching design, dark with purple accents"
      ],
      "background": "cream"
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
      "background": "cream"
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
      "background": "cream"
    }
  ]
}

================================================
🚨 LEMBRETES FINAIS
================================================

1. NUNCA invente cores fora da paleta SyncPost
2. SEMPRE use exatamente os 9 layoutTypes válidos
3. SEMPRE quebre títulos em 3-5 palavras por linha
4. SEMPRE escreva imagePrompts em inglês
5. NUNCA mencione personagens reais em imagePrompts
6. RETORNE apenas JSON, sem markdown ou explicações
7. background sempre da lista permitida (dark/cream/white/navy/sepia/photo)`;
```

---

## 🔴 CORREÇÃO 2: Validação de schema (CRÍTICO)

### Arquivo: `lib/editorial/ai-content.ts`

Adicione função de validação após o parse do JSON:

```typescript
// Após o JSON.parse, ANTES de retornar o carousel:

const VALID_LAYOUTS = ['capa', 'problema', 'demo', 'novidade', 'prova', 'texto-foto', 'sepia', 'serif', 'cta'];
const VALID_BACKGROUNDS = ['dark', 'cream', 'white', 'navy', 'sepia', 'photo'];
const VALID_VARIANTS: Record<string, string[]> = {
  demo: ['single', 'comparison', 'process'],
  novidade: ['text-only', 'single-large', 'pair', 'grid-three'],
  prova: ['numeric', 'single-print', 'multiple-prints', 'logo-cloud'],
  'texto-foto': ['text-only', 'image-bottom', 'image-middle', 'image-bg'],
  cta: ['text-only', 'product-mockup', 'human-photo', 'composition'],
};

function validateAndFixCarousel(carousel: any): EditorialCarousel {
  console.log('🔍 [Editorial] Validando carrossel gerado...', carousel);
  
  if (!carousel.slides || !Array.isArray(carousel.slides)) {
    throw new Error('IA retornou JSON sem array de slides');
  }
  
  carousel.slides = carousel.slides.map((slide: any, idx: number) => {
    // Validar layoutType
    if (!VALID_LAYOUTS.includes(slide.layoutType)) {
      console.warn(`⚠️  Slide ${idx + 1}: layoutType inválido "${slide.layoutType}". Forçando "texto-foto"`);
      slide.layoutType = 'texto-foto';
    }
    
    // Validar background
    if (!VALID_BACKGROUNDS.includes(slide.background)) {
      console.warn(`⚠️  Slide ${idx + 1}: background inválido "${slide.background}". Forçando default por layout.`);
      
      // Default por layout
      const bgDefaults: Record<string, string> = {
        capa: 'photo',
        problema: 'dark',
        demo: 'cream',
        novidade: 'cream',
        prova: 'cream',
        'texto-foto': 'white',
        sepia: 'sepia',
        serif: 'navy',
        cta: 'cream',
      };
      
      slide.background = bgDefaults[slide.layoutType] || 'cream';
    }
    
    // Validar variant em layouts flexíveis
    if (VALID_VARIANTS[slide.layoutType]) {
      if (!slide.variant || !VALID_VARIANTS[slide.layoutType].includes(slide.variant)) {
        console.warn(`⚠️  Slide ${idx + 1}: variant inválida "${slide.variant}" para ${slide.layoutType}. Usando default.`);
        slide.variant = VALID_VARIANTS[slide.layoutType][0]; // primeira variante como default
      }
    } else {
      // Layouts rígidos não devem ter variant
      delete slide.variant;
    }
    
    // Validar title (deve ser array)
    if (!Array.isArray(slide.title)) {
      console.warn(`⚠️  Slide ${idx + 1}: title não é array. Convertendo.`);
      slide.title = typeof slide.title === 'string' ? [slide.title] : ['TÍTULO'];
    }
    
    // Validar highlightWords
    if (!Array.isArray(slide.highlightWords)) {
      slide.highlightWords = [];
    }
    
    // Validar imagePrompts
    if (!Array.isArray(slide.imagePrompts)) {
      slide.imagePrompts = [];
    }
    
    // Garantir page numbers corretos
    slide.pageNumber = idx + 1;
    slide.totalPages = carousel.slides.length;
    
    return slide;
  });
  
  carousel.totalSlides = carousel.slides.length;
  
  console.log('✅ [Editorial] Carrossel validado com sucesso');
  return carousel as EditorialCarousel;
}

// USAR NO export async function generateEditorialCarousel:
// const carousel: EditorialCarousel = JSON.parse(jsonText);
// const validated = validateAndFixCarousel(carousel);
// validated.slides = validated.slides.map(...) // adicionar brandInfo
// return validated;
```

---

## 🟡 CORREÇÃO 3: Logs detalhados (IMPORTANTE)

### Arquivo: `lib/editorial/generator.ts`

Adicione logs em cada etapa pra você ver o que está acontecendo:

```typescript
export async function generateCompleteCarousel(params: GenerateParams): Promise<EditorialCarousel> {
  console.log('🚀 [Editorial] Iniciando geração:', params.topic);
  const startTime = Date.now();
  
  // Step 1: Gerar roteiro
  console.log('📝 [Editorial] Gerando roteiro com Claude...');
  params.onProgress?.('Criando roteiro com IA...', 0, 100);
  
  const carousel = await generateEditorialCarousel({
    topic: params.topic,
    brandInfo: params.brandInfo,
    tone: params.tone,
    targetAudience: params.targetAudience,
  });
  
  console.log('✅ [Editorial] Roteiro gerado:', {
    slides: carousel.slides.length,
    layouts: carousel.slides.map(s => s.layoutType),
    backgrounds: carousel.slides.map(s => s.background),
  });
  
  params.onProgress?.('Roteiro pronto. Gerando imagens...', 30, 100);
  
  // Step 2: Gerar imagens
  const totalImages = carousel.slides.reduce((acc, s) => acc + (s.imagePrompts?.length || 0), 0);
  console.log(`🖼️  [Editorial] Total de imagens a gerar: ${totalImages}`);
  
  let generatedImages = 0;
  let failedImages = 0;
  
  for (let i = 0; i < carousel.slides.length; i++) {
    const slide = carousel.slides[i];
    
    if (slide.imagePrompts?.length) {
      console.log(`🎨 [Editorial] Slide ${i + 1}: gerando ${slide.imagePrompts.length} imagens`);
      
      try {
        const images = await generateImagesForSlide(slide);
        slide.images = images;
        generatedImages += images.length;
        console.log(`✅ [Editorial] Slide ${i + 1}: ${images.length} imagens OK`);
      } catch (error) {
        console.error(`❌ [Editorial] Slide ${i + 1}: ERRO gerando imagens`, error);
        failedImages += slide.imagePrompts.length;
        slide.images = []; // fallback vazio
      }
      
      const progress = 30 + Math.floor(((generatedImages + failedImages) / totalImages) * 60);
      params.onProgress?.(
        `Gerando imagem ${generatedImages + failedImages} de ${totalImages}...`,
        progress,
        100
      );
    }
  }
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`🎉 [Editorial] Geração completa em ${totalTime}s. Imagens: ${generatedImages} OK / ${failedImages} falharam`);
  
  if (failedImages > 0) {
    console.warn(`⚠️  ATENÇÃO: ${failedImages} imagens falharam. Slides podem aparecer sem imagem.`);
  }
  
  params.onProgress?.('Carrossel pronto!', 100, 100);
  
  return carousel;
}
```

---

## 🟡 CORREÇÃO 4: Retry automático em imagens (IMPORTANTE)

### Arquivo: `lib/editorial/ai-images.ts`

Adicione retry com backoff:

```typescript
export async function generateEditorialImage(params: GenerateImageParams): Promise<string> {
  const MAX_RETRIES = 3;
  let lastError: any;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`  🎨 Tentativa ${attempt}/${MAX_RETRIES}: ${params.prompt.slice(0, 60)}...`);
      
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
      
      console.log(`  ✅ Imagem OK (tentativa ${attempt})`);
      return result.data.images[0].url;
      
    } catch (error: any) {
      lastError = error;
      console.warn(`  ⚠️  Falha tentativa ${attempt}:`, error.message);
      
      if (attempt < MAX_RETRIES) {
        const delay = 1000 * attempt; // 1s, 2s, 3s
        console.log(`  ⏳ Aguardando ${delay}ms antes de tentar de novo...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Falhou após ${MAX_RETRIES} tentativas: ${lastError?.message}`);
}
```

---

## 🟢 CORREÇÃO 5: Aplicação correta de cores nos componentes (IMPORTANTE)

### Verificar componentes de Layout

Em cada arquivo de layout (`01-CapaLayout.tsx`, `02-ProblemaLayout.tsx`, etc), verificar que está usando **EDITORIAL_COLORS** corretamente, não cores hardcoded.

**Exemplo do problema potencial:**

```typescript
// ❌ ERRADO (hardcoded):
<Rect fill="#00ACC8" />

// ❌ ERRADO (cor da prop sem validação):
<Rect fill={slide.backgroundColor} />  // pode ser qualquer cor

// ✅ CERTO (usa enum):
const bgColor = getBackgroundColor(slide.background);
<Rect fill={bgColor} />

function getBackgroundColor(bg: BackgroundType): string {
  const map: Record<string, string> = {
    dark: EDITORIAL_COLORS.bg.dark,
    cream: EDITORIAL_COLORS.bg.cream,
    white: EDITORIAL_COLORS.bg.white,
    navy: EDITORIAL_COLORS.bg.navy,
    sepia: EDITORIAL_COLORS.bg.sepia,
    photo: EDITORIAL_COLORS.bg.dark, // fallback
  };
  return map[bg] || EDITORIAL_COLORS.bg.cream;
}
```

**AÇÃO:** Audita todos os 9 layouts. Confirma que NENHUM usa cor hardcoded fora da paleta SyncPost.

---

## ✅ COMO TESTAR APÓS APLICAR CORREÇÕES

### Teste 1: Verificar logs

1. Aplica todas as correções
2. Roda `npm run dev`
3. Abre DevTools (F12) → aba Console
4. Gera um carrossel pelo `/dashboard/criar/editorial`

**Você deve ver no console:**
```
🚀 [Editorial] Iniciando geração: <tema>
📝 [Editorial] Gerando roteiro com Claude...
🔍 [Editorial] Validando carrossel gerado... {totalSlides: X, slides: [...]}
✅ [Editorial] Roteiro gerado: {slides: 5, layouts: ["capa", "problema", ...], backgrounds: ["photo", "dark", ...]}
🖼️  [Editorial] Total de imagens a gerar: 4
🎨 [Editorial] Slide 1: gerando 1 imagens
  🎨 Tentativa 1/3: Vintage 1969 Los Angeles street...
  ✅ Imagem OK (tentativa 1)
✅ [Editorial] Slide 1: 1 imagens OK
... (continua)
🎉 [Editorial] Geração completa em 87.3s. Imagens: 4 OK / 0 falharam
```

### Teste 2: Validar paleta

Gera 3 carrosséis com temas diferentes:
- Cinema/filmes
- Marketing digital
- Saúde/bem-estar

**Confirma que TODOS:**
- [ ] Fundos são apenas: preto, navy, bege, branco, sépia, ou foto
- [ ] Highlights são em roxo `#7C3AED`
- [ ] Sem azul, verde, vermelho, amarelo
- [ ] Layouts batem com os 9 implementados

### Teste 3: Verificar imagens

- [ ] Imagens geradas pela Fal.ai são relacionadas ao tema
- [ ] Sem personagens reais (Brad Pitt, etc)
- [ ] Sem texto na imagem (Flux escreve mal)
- [ ] Estilo cinematográfico/editorial

---

## 🚨 SE AINDA DER ERRADO

### Cenário 1: IA continua inventando cores

**Solução:** Adicionar validação ainda mais forte. No `validateAndFixCarousel`, **forçar** background válido SEMPRE, mesmo que o JSON da IA diga outra coisa.

### Cenário 2: Imagens não fazem sentido com o tema

**Solução:** Melhorar o prompt enviado pra Claude. Adicionar exemplos de bons imagePrompts no system prompt.

### Cenário 3: Geração trava ou demora demais

**Solução:** Verificar saldo Fal.ai (pode ter acabado). Considerar usar `flux/schnell` (mais rápido e barato) em vez de `flux-pro`.

### Cenário 4: Logs não aparecem no console

**Solução:** Confirma que `console.log` não está sendo bloqueado por alguma config. Tenta `console.warn` em vez de `console.log` (alguns navegadores escondem logs por default).

---

## 📋 CHECKLIST DE APLICAÇÃO

Antes de testar:

- [ ] Substitui SYSTEM_PROMPT em `lib/editorial/ai-content.ts`
- [ ] Adiciona função `validateAndFixCarousel` e usa antes de retornar
- [ ] Adiciona logs detalhados em `lib/editorial/generator.ts`
- [ ] Adiciona retry em `lib/editorial/ai-images.ts`
- [ ] Audita os 9 layouts pra garantir uso de `EDITORIAL_COLORS`
- [ ] Faz commit: `git commit -m "fix(editorial): força paleta SyncPost + validação + logs"`
- [ ] Testa gerando 3 carrosséis com temas diferentes
- [ ] Valida visual (paleta correta, layouts corretos)

---

**Se após aplicar tudo isso ainda houver problema, manda o JSON do console + screenshot do resultado que eu analiso ponto a ponto.**
