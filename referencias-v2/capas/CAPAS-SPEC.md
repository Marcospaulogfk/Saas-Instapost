# CAPAS-SPEC — Variantes de capa do `/teste` editorial

Documento técnico explicando **pixel-a-pixel** como cada variante de capa está posicionada. Mesma estrutura do `LAYOUT-SPEC.md`, só que focado em capas (slide 1).

> Arquivo da fonte: [`components/carousel/slide-preview.tsx`](components/carousel/slide-preview.tsx)
> Pasta de referência: `referencias-v2/capas/`
> Imagens originais devem estar salvas em `referencias-v2/capas/` com os nomes referenciados em cada variante.

---

## 1. Visão geral

Hoje existe 1 variante de capa: `cover` (a default). Este documento adiciona **6 novas variantes** baseadas em referências reais do Wesley Silva e @brandsdecoded__.

Cada variante representa um "estilo" diferente de capa pra carrossel editorial. A IA escolhe qual usar baseado no tema/contexto do conteúdo (regras em cada seção).

Todas as 6 variantes:
- Mantêm o canvas `aspect-[4/5]` rounded-xl overflow-hidden
- Mantêm a estrutura `header (top-4) + conteúdo + footer (bottom-4)`
- Suportam customização de: texto, imagem, cor de destaque (`accent`), fonte (`fontClass`), textos das pills
- NÃO permitem customização de: posição, estrutura das pills, gradient overlay, hierarquia visual

---

## 2. Tipo `EditorialVariant` atualizado

```ts
export type EditorialVariant =
  // existentes
  | "cover"
  | "image-top"
  | "image-bottom"
  | "image-bg"
  // novas capas
  | "cover-wesley-gemini"
  | "cover-wesley-internet"
  | "cover-wesley-labios"
  | "cover-wesley-churrasco"
  | "cover-brandsdecoded-massive"
  | "cover-brandsdecoded-portrait"
```

---

## 3. Lógica de escolha automática (IA decide)

Função no system prompt do Claude (geração do roteiro):

```
REGRA: A capa (slide 1) sempre usa uma das 6 variantes abaixo.
Escolha a variante baseado no tema/tom do carrossel:

cover-wesley-gemini:
  USE quando: tema é tutorial, passo-a-passo, "como fazer X"
  TOM: educativo, prático, didático
  EXEMPLO: "Como criar capas virais com Gemini"

cover-wesley-internet:
  USE quando: tema é mudança/novidade impactante na sociedade
  TOM: revelador, sociológico, alerta
  EXEMPLO: "A internet mudou para sempre"

cover-wesley-labios:
  USE quando: tema é benefício/lista numerada (3 dicas, 5 segredos)
  TOM: informativo, listagem, vendedor
  EXEMPLO: "03 Benefícios do Preenchimento Labial"

cover-wesley-churrasco:
  USE quando: tema é correção/erro comum/"você está fazendo errado"
  TOM: provocativo, correctivo, autoridade
  EXEMPLO: "Seu churrasco pode estar errado"

cover-brandsdecoded-massive:
  USE quando: tema é crítica forte, exposição, polêmica, denúncia
  TOM: agressivo, direto, contundente
  EXEMPLO: "O ChatGPT gosta muito de mentir"

cover-brandsdecoded-portrait:
  USE quando: tema é análise crítica longa, ensaio, reflexão profunda
  TOM: editorial, jornalístico, ensaístico
  EXEMPLO: "As redes sociais acabaram com o tédio"
```

A IA retorna no JSON: `slide.variant: "cover-wesley-gemini"`.

---

## 4. Componentes shared adicionais

### `Pill` (já existe — referência)

Mantém o que já existe no `LAYOUT-SPEC.md`. As 6 variantes usam pills nas duas variantes de cor:
- `dark` (bg preto translúcido) — em fundos escuros/foto
- `light` (bg branco translúcido) — em fundos claros

### `HighlightedText` (já existe — referência)

Componente que recebe `text + words[] + color` e renderiza palavras destacadas inline com a cor `accent`.

```tsx
<HighlightedText
  text="COMO CRIAR CAPAS VIRAIS COM GEMINI"
  words={["CAPAS", "GEMINI"]}
  color={accent}
/>
```

---

## 5. Variant `cover-wesley-gemini`

**Imagem de referência:** `referencias-v2/capas/wesley-gemini.jpg`

**Conceito visual:** título grande no topo, foto média centralizada como "card", layout balanceado e arejado.

```
┌─────────────────────────────────┐
│ ┌─[Pill handle]──[Pill cat]──┐    │  ← top-4 (16px), left/right-4
│ │                              │    │     pills variant="dark"
│ │                              │    │
│ │  TÍTULO EM 3 LINHAS          │    │  ← top-[18%]
│ │  COM PALAVRAS DESTACADAS     │    │     text-[2.5rem] uppercase
│ │  EM ACCENT                   │    │     leading-[0.95] tracking-tight
│ │                              │    │
│ │  subtitle pequeno            │    │  ← logo abaixo do título
│ │                              │    │     text-sm text-white/80
│ │                              │    │
│ │  ┌────────────────────────┐  │    │  ← top-[58%]
│ │  │                        │  │    │     w-[88%] mx-auto
│ │  │   FOTO COMO CARD       │  │    │     aspect-[16/10]
│ │  │   (rounded-3xl)        │  │    │     rounded-3xl overflow-hidden
│ │  │                        │  │    │     box-shadow sutil
│ │  └────────────────────────┘  │    │
│ │                              │    │
│ │ ┌─[Pill]─[dots]─[arrasta]─┐  │    │  ← bottom-4
│ └──────────────────────────┘    │
└─────────────────────────────────┘
```

**Specs detalhadas:**

- Background: `bg-black` (#0A0A0A sólido, sem foto fullbleed)
- Header (top-4): pills variant `dark` com `flex justify-between`
- Título (top-[18%], left/right-8):
  - `text-[2.5rem]` no preview (~96px no canvas 1080)
  - `uppercase` forçado
  - `font-weight: 800` (extrabold)
  - `leading-[0.95]` (linhas coladas)
  - `tracking-tight`
  - Cor base: `#FFFFFF`
  - Palavras destacadas: cor `accent`
  - Quebra: 3-4 linhas, manualmente
- Subtitle (margin-top do título: 16px):
  - `text-sm` (~28px no canvas)
  - `text-white/80`
  - `font-weight: 400`
- Imagem-card (top-[58%]):
  - Largura: `w-[88%]` centralizada (`mx-auto`)
  - Aspect: `aspect-[16/10]` (paisagem suave)
  - `rounded-3xl overflow-hidden`
  - `object-cover`
  - Box-shadow sutil: `0 8px 24px rgba(0,0,0,0.4)`
- Footer (bottom-4): pills variant `dark` + `PaginationDots`
  - Layout: `Pill` esquerda + `dots` centro + `Pill` direita
  - `flex justify-between items-center`

**Customizável:**
- Texto do título (`slide.title`)
- Palavras destacadas (`slide.highlight_words`)
- Subtitle (`slide.subtitle`)
- Imagem (`slide.image.url`)
- Cor accent (`brandColors[0]`)
- Fonte (`fontClass`)
- Texto das pills (`handle`, `categoryTag`)

**NÃO customizável:**
- Posição (top-[18%], top-[58%])
- Tamanho da imagem (88% width, 16/10 aspect)
- Background preto sólido (sem foto fullbleed)
- Estrutura das pills

---

## 6. Variant `cover-wesley-internet`

**Imagem de referência:** `referencias-v2/capas/wesley-internet.jpg`

**Conceito visual:** foto fullbleed, título médio na metade inferior, dramaticidade da cena. Mais cinematográfico que `cover-wesley-gemini`.

```
┌─────────────────────────────────┐
│ ┌─[Pill handle]──[Pill cat]──┐    │  ← top-4
│ │                              │    │     pills variant="dark"
│ │                              │    │
│ │     FOTO FULLBLEED           │    │  ← absolute inset-0
│ │     (object-cover)           │    │     gradient overlay bottom-up
│ │                              │    │     from-black/85 via-black/50 to-black/15
│ │                              │    │
│ │                              │    │
│ │  ┌────────────────────────┐  │    │  ← bottom-32 (128px do bottom)
│ │  │  TÍTULO 3 LINHAS       │  │    │     text-[2.2rem] uppercase
│ │  │  PALAVRAS EM ACCENT    │  │    │     leading-[0.95]
│ │  │  GIGANTES              │  │    │
│ │  └────────────────────────┘  │    │
│ │                              │    │
│ │  subtitle 2 linhas           │    │  ← bottom-20
│ │  pequeno e elegante          │    │     text-xs text-white/70
│ │                              │    │
│ │ ┌─[Pill]─[dots]─[arrasta]─┐  │    │  ← bottom-4
│ └──────────────────────────┘    │
└─────────────────────────────────┘
```

**Specs detalhadas:**

- Background: foto `<img>` cobrindo `inset-0`, `object-cover`
- Overlay gradient: `bg-gradient-to-t from-black/85 via-black/50 to-black/15`
  - Mais escuro embaixo pra contraste com texto
- Header (top-4): pills variant `dark`
- Título (bottom-32, left/right-6):
  - `text-[2.2rem]` (menor que wesley-gemini pra deixar respiro embaixo)
  - `uppercase`
  - `font-weight: 800`
  - `leading-[0.95]`
  - `tracking-tight`
  - Cor: `#FFFFFF`, palavras em `accent`
  - Quebra: 3 linhas
- Subtitle (bottom-20, left/right-6):
  - `text-xs` (~22px no canvas)
  - `text-white/70`
  - 1-2 linhas
- Footer (bottom-4): igual wesley-gemini

**Customizável:** mesma lista de wesley-gemini

**NÃO customizável:**
- Posição (bottom-32, bottom-20)
- Foto sempre fullbleed (não tem opção de card)
- Gradient overlay e direção
- Tamanho do título (2.2rem)

**Diferença vs wesley-gemini:**
- Background: foto fullbleed vs preto sólido + card
- Título: bottom (2.2rem) vs top (2.5rem)
- Vibe: cinematográfico vs estruturado

---

## 7. Variant `cover-wesley-labios`

**Imagem de referência:** `referencias-v2/capas/wesley-labios.jpg`

**Conceito visual:** capa "vendedora" com badge/avatar flutuante + título sobre fundo escuro embaixo, otimizada pra listas numeradas (3 benefícios, 5 segredos).

```
┌─────────────────────────────────┐
│                                  │
│                                  │     ← SEM pills no topo
│                                  │       (foto domina toda área superior)
│     FOTO FULLBLEED               │
│     (object-cover)               │     gradient overlay bottom-up
│                                  │     from-black/95 via-black/60 to-transparent
│                                  │
│                                  │
│  ┌──────────────────┐            │  ← bottom-44 (176px do bottom)
│  │ [avatar] @handle │            │     pill com avatar circular
│  └──────────────────┘            │     left-6
│                                  │
│  ┌────────────────────────────┐  │  ← bottom-20 (80px do bottom)
│  │ 03 Benefícios do           │  │     text-[2rem]
│  │ Preenchimento              │  │     PALAVRAS DESTACADAS em accent
│  │ Labial:                    │  │     leading-[1.05] (mais respiro)
│  └────────────────────────────┘  │     case mantido (não força UPPERCASE)
│                                  │
│  subtitle uma linha              │  ← bottom-12
│                                  │     text-xs text-white/85
│                                  │
│         ●●●●●                    │  ← bottom-4 (só dots, sem pills)
└─────────────────────────────────┘
```

**Specs detalhadas:**

- Background: foto fullbleed com overlay
- Overlay: `bg-gradient-to-t from-black/95 via-black/60 to-transparent`
  - Mais agressivo embaixo (95%), bem transparente em cima
- **SEM HEADER PILLS** — diferencial dessa variante
- Avatar pill (bottom-44, left-6):
  - Pill maior que o normal: `px-3 py-2`
  - Avatar circular `w-8 h-8 rounded-full` à esquerda
  - Texto `@handle` à direita do avatar
  - Background: `bg-white` sólido (não translúcido)
  - Texto preto `font-medium text-sm`
- Título (bottom-20, left/right-6):
  - `text-[2rem]` (~76px no canvas)
  - **NÃO força uppercase** — caso natural permitido
  - `font-weight: 700`
  - `leading-[1.05]` (linhas mais arejadas que wesley-internet)
  - Cor base: `#FFFFFF`, palavras em `accent`
  - Quebra: 3 linhas
- Subtitle (bottom-12, left/right-6):
  - `text-xs`
  - `text-white/85`
  - 1 linha
- Footer (bottom-4):
  - **APENAS dots no centro** (sem pills)
  - `PaginationDots` centralizado

**Customizável:** texto, palavras, imagem, accent, fonte
- Avatar URL (`slide.handle_avatar`) — campo novo no schema

**NÃO customizável:**
- Ausência de header pills
- Posição do avatar (bottom-44 left)
- Footer só com dots
- Background sempre fullbleed

**Diferença vs outras Wesley:**
- Não tem pills no topo (visual mais limpo no início)
- Tem avatar circular (humaniza)
- Subtítulo curto (1 linha)
- Footer minimalista (só dots)

---

## 8. Variant `cover-wesley-churrasco`

**Imagem de referência:** `referencias-v2/capas/wesley-churrasco.jpg`

**Conceito visual:** título cobrindo o slide inteiro como protagonista, foto cinematográfica de fundo, palavra-chave gigante destacada. Usado pra temas provocativos/correctivos.

```
┌─────────────────────────────────┐
│ ┌─[Pill handle]──[Pill cat]──┐    │  ← top-4
│ │                              │    │     pills variant="dark"
│ │                              │    │
│ │     FOTO FULLBLEED           │    │  ← absolute inset-0
│ │     (object-cover)           │    │     gradient mais agressivo
│ │                              │    │     from-black/95 via-black/60 to-black/30
│ │                              │    │
│ │  ┌────────────────────────┐  │    │  ← top-[42%] (centro-baixo)
│ │  │ SEU                    │  │    │     text-[2.3rem]
│ │  │ ACCENT-WORD            │  │    │     UPPERCASE
│ │  │ EM 3 LINHAS            │  │    │     leading-[0.95]
│ │  │ COM ACCENT GIGANTE     │  │    │     palavra do meio em accent
│ │  └────────────────────────┘  │    │
│ │                              │    │
│ │  subtitle 1 linha            │    │  ← bottom-20
│ │  curto e direto              │    │     text-xs text-white/85
│ │                              │    │
│ │ ┌─[Pill]─[dots]─[arrasta]─┐  │    │  ← bottom-4
│ └──────────────────────────┘    │
└─────────────────────────────────┘
```

**Specs detalhadas:**

- Background: foto fullbleed com overlay
- Overlay: `bg-gradient-to-t from-black/95 via-black/60 to-black/30`
  - Mantém escuro até no topo (30%) pra dar peso à imagem
- Header (top-4): pills variant `dark`
- Título (top-[42%], left/right-6):
  - `text-[2.3rem]`
  - `uppercase` forçado
  - `font-weight: 800`
  - `leading-[0.95]`
  - `tracking-tight`
  - Quebra: 3-4 linhas (geralmente palavra-chave fica isolada na linha 2)
  - Palavra de destaque em `accent` (geralmente substantivo central, ex: "CHURRASCO")
- Subtitle (bottom-20, left/right-6):
  - `text-xs`
  - `text-white/85`
  - 1 linha
- Footer (bottom-4): igual wesley-internet

**Customizável:** mesma lista padrão
**NÃO customizável:** posição (top-[42%]), gradient agressivo

**Diferença vs wesley-internet:**
- Título mais ao centro (top-[42%]) vs embaixo (bottom-32)
- Overlay mais escuro no topo
- Tom: provocativo vs revelador

---

## 9. Variant `cover-brandsdecoded-massive`

**Imagem de referência:** `referencias-v2/capas/brandsdecoded-chatgpt.jpg`

**Conceito visual:** título GIGANTE cobrindo metade inferior, headers minimalistas (sem pills tradicionais), múltiplas palavras destacadas, tipografia ultra-condensada. Usado pra temas agressivos/críticos.

```
┌─────────────────────────────────┐
│ CONTENT MACHINE        2026 ®     │  ← top-3 (12px) — TEXTO PURO, SEM PILL
│                                  │     text-[10px] uppercase tracking-wider
│                                  │     opacity-50
│                                  │
│     FOTO FULLBLEED               │
│     (object-cover)               │
│                                  │
│                                  │
│         [@handle pill mini]      │  ← top-[55%] (centro vertical)
│                                  │     pill pequena no centro
│                                  │
│  ┌────────────────────────────┐  │  ← bottom-20
│  │ TÍTULO MASSIVE EM 3-4      │  │     text-[3rem] (GIGANTE)
│  │ LINHAS COM MÚLTIPLAS       │  │     uppercase
│  │ PALAVRAS EM ACCENT         │  │     leading-[0.92]
│  │ ULTRA CONDENSADO           │  │     tracking-tight
│  └────────────────────────────┘  │     font-weight: 900
│                                  │
│  subtitle pequeno                │  ← bottom-12
│  com seta opcional               │     text-xs text-white/60
│                                  │
│ ────────────────────  1/9        │  ← bottom-3 — LINHA + paginação
└─────────────────────────────────┘     line h-px bg-white/20 + texto
```

**Specs detalhadas:**

- Background: foto fullbleed com overlay
- Overlay: `bg-gradient-to-t from-black/90 via-black/40 to-black/20`
- **HEADER NÃO USA PILLS** — diferencial:
  - Texto puro `text-[10px]` (ou `text-[11px]`)
  - `uppercase tracking-wider`
  - `opacity-50` (sutil)
  - Esquerda: nome da marca/categoria (ex: "CONTENT MACHINE")
  - Direita: ano/versão (ex: "2026 ®")
  - `flex justify-between` em `top-3 left-4 right-4`
- Avatar pill central (top-[55%], centralizada):
  - `flex justify-center`
  - Pill pequena com avatar + handle
  - Background `bg-white/10 backdrop-blur-md`
  - Padding: `px-3 py-1.5`
- Título (bottom-20, left/right-4):
  - `text-[3rem]` (GIGANTE — maior que todas outras)
  - `uppercase` forçado
  - `font-weight: 900` (black)
  - `leading-[0.92]` (linhas muito coladas)
  - `tracking-tight` (talvez `-tracking-[0.02em]`)
  - Quebra: 3-4 linhas
  - **Múltiplas palavras destacadas** (não só 1 — a IA pode escolher 2-3)
  - Palavras destacadas em `accent`
- Subtitle (bottom-12, left-4 right-4):
  - `text-xs`
  - `text-white/60` (mais sutil que wesley)
  - Pode começar com "→" como prefix
- Footer (bottom-3, left-4 right-4):
  - **NÃO USA PILLS NO FOOTER** — outra diferença
  - Linha horizontal: `<div className="h-px bg-white/20 flex-1" />`
  - Texto paginação à direita: `text-[10px] text-white/50`
  - Ex: `1/9`
  - `flex items-center gap-3`

**Customizável:**
- Texto, palavras destacadas, imagem, accent, fonte, handle
- Texto do header esquerdo (`brand_label`) e direito (`year_label`) — campos novos no schema

**NÃO customizável:**
- Ausência de pills no header (texto puro)
- Ausência de pills no footer (linha + texto)
- Tamanho gigante do título (3rem)
- Avatar pill no centro vertical (top-[55%])

**Diferença vs Wesley:**
- Header: texto puro vs pills
- Tipografia: ultra-condensada e maior (3rem) vs condensada (2-2.5rem)
- Footer: linha minimalista vs pills + dots
- Vibe: editorial agressivo vs vendedor estruturado

---

## 10. Variant `cover-brandsdecoded-portrait`

**Imagem de referência:** `referencias-v2/capas/brandsdecoded-instagram.jpg`

**Conceito visual:** retrato dramático fullbleed, título cobrindo metade inferior com palavra de destaque GRANDE, layout pra ensaios/análises críticas longas.

```
┌─────────────────────────────────┐
│ Powered by Content Machine      │  ← top-3 — texto puro 3 colunas
│       @handle           2026 // │     text-[10px] uppercase
│                                  │     opacity-60
│                                  │
│     FOTO RETRATO FULLBLEED      │
│     (figura humana frontal)     │
│                                  │
│                                  │
│                                  │
│                                  │
│  ┌────────────────────────────┐  │  ← bottom-32 (mais alto que massive)
│  │ FRASE INTRODUTÓRIA:        │  │     text-[1.6rem] (menor)
│  │ COMO O ACCENT-WORD         │  │     mistura case (intro normal +
│  │ FEZ ALGO IMPORTANTE NO     │  │     destaque uppercase)
│  │ ACCENT-WORD-2 ?            │  │     leading-[1] tracking-tight
│  └────────────────────────────┘  │     palavras destacadas em accent
│                                  │
│ ────────────────────  1/9        │  ← bottom-3 — linha + paginação
└─────────────────────────────────┘
```

**Specs detalhadas:**

- Background: foto retrato fullbleed (figura humana centralizada)
- Overlay: `bg-gradient-to-t from-black/85 via-black/30 to-black/40`
  - Levemente escuro no topo também (pra header texto ficar legível)
- Header (top-3, left/right-4):
  - 3 colunas via `flex justify-between`
  - Esquerda: brand label (ex: "Powered by Content Machine")
  - Centro: handle (`@user`) — diferente da massive (que tem só 2 cols)
  - Direita: ano (ex: "2026 //")
  - `text-[10px] uppercase tracking-wide opacity-60`
- **SEM AVATAR PILL CENTRAL** (diferença pra massive)
- Título (bottom-32, left/right-4):
  - `text-[1.6rem]` (menor que massive, mais elegante)
  - **NÃO força uppercase** — mistura case
  - Estrutura típica: pergunta com palavras-chave UPPERCASE no meio
  - Ex: "AS REDES SOCIAIS ACABARAM COM TÉDIO: COMO O **INSTAGRAM ROUBOU** O ÚNICO MOMENTO DO DIA EM QUE O **CÉREBRO APRENDE DE VERDADE**?"
  - `font-weight: 700-800`
  - `leading-[1]`
  - Quebra: 4-5 linhas
  - Palavras destacadas em `accent`, podendo ser MAIORES que o texto comum (ex: `text-[2rem]` vs `text-[1.6rem]`)
- Footer (bottom-3): igual brandsdecoded-massive (linha + paginação)

**Customizável:** lista padrão + brand_label, year_label
**NÃO customizável:** ausência de pills, layout 3 colunas no header

**Diferença vs brandsdecoded-massive:**
- Tamanho do título: menor (1.6rem vs 3rem)
- Case: misto (não força uppercase) vs uppercase total
- Header: 3 colunas (centro com handle) vs 2 colunas (sem handle)
- Sem avatar pill central
- Estrutura: pergunta longa vs declaração curta
- Vibe: ensaio jornalístico vs manifesto agressivo

---

## 11. Tipografia (todas as 6 capas)

A fonte vem da prop `fontClass` (escolhida pelo usuário no painel). Não fixamos fonte específica por template.

| Capa | Tamanho título | Peso | Tracking | Case |
|---|---|---|---|---|
| cover-wesley-gemini | 2.5rem | 800 | -tight | UPPERCASE |
| cover-wesley-internet | 2.2rem | 800 | -tight | UPPERCASE |
| cover-wesley-labios | 2rem | 700 | normal | natural (mistura) |
| cover-wesley-churrasco | 2.3rem | 800 | -tight | UPPERCASE |
| cover-brandsdecoded-massive | 3rem | 900 | -tight | UPPERCASE |
| cover-brandsdecoded-portrait | 1.6rem (+2rem destaque) | 700-800 | -tight | mistura |

**Recomendação de fontes (sugestão pro usuário):**
- Wesley styles: Anton, Inter Black, Bebas Neue
- Brandsdecoded styles: Bebas Neue, Druk Wide (se tiver), Anton
- Portrait: Playfair Display (serif), Inter Black

---

## 12. Cores e contraste

Todas as 6 capas usam:
- Texto base: `#FFFFFF` (branco puro)
- Palavras destacadas: cor `accent` (vem das `brandColors[0]`)
- Pills (quando existem): variant `dark` (bg preto translúcido)
- Background: foto fullbleed na maioria, exceto `cover-wesley-gemini` que usa preto sólido + foto-card

**Contraste mínimo:**
- Texto branco sobre overlay preto >= 50% opacity = OK
- Palavras `accent` sobre overlay = depende da cor accent escolhida
  - **Atenção:** se usuário escolher accent muito escuro/cinza, pode perder contraste. Adicionar validação no schema.

---

## 13. Schema do Claude — campos novos por variante

Algumas variantes precisam de campos adicionais no JSON do roteiro:

```ts
interface SlideCover {
  variant: EditorialVariant
  title: string
  subtitle?: string
  highlight_words: string[]
  image: { url: string, attribution?: string }
  
  // campos comuns
  handle: string
  cta_badge?: string  // categoria
  
  // novos campos opcionais por variante:
  
  // wesley-labios:
  handle_avatar?: string  // URL do avatar circular
  
  // brandsdecoded-massive e portrait:
  brand_label?: string  // ex: "Content Machine"
  year_label?: string   // ex: "2026 //"
}
```

---

## 14. Como adicionar mais capas no futuro

1. Salvar imagem de referência em `referencias-v2/capas/nome-da-variante.jpg`
2. Adicionar entrada na tabela do **§3** com regras de "quando usar"
3. Adicionar nova entrada no tipo `EditorialVariant`
4. Documentar no padrão das §5-§10 (diagrama ASCII + specs)
5. Implementar no `slide-preview.tsx` seguindo o template do `LAYOUT-SPEC.md` §10

---

## 15. Implementação no `slide-preview.tsx`

Cada variante segue o template do `LAYOUT-SPEC.md` §10. Diferenças por variante:

**cover-wesley-gemini:**
- Sem foto fullbleed (`bg-black` direto)
- Título com `top-[18%]`
- Imagem como card flutuante com `top-[58%] w-[88%] mx-auto aspect-[16/10] rounded-3xl`

**cover-wesley-internet:**
- Foto fullbleed + overlay padrão
- Título `bottom-32` com `text-[2.2rem]`

**cover-wesley-labios:**
- Sem header pills
- Avatar pill em `bottom-44 left-6`
- Footer só com dots centralizado

**cover-wesley-churrasco:**
- Título em `top-[42%]`
- Overlay mais agressivo (`from-black/95`)

**cover-brandsdecoded-massive:**
- Header com texto puro (não pills)
- Avatar pill em `top-[55%]` centralizado
- Título em `bottom-20` com `text-[3rem] font-weight-900`
- Footer com linha + paginação (sem pills)

**cover-brandsdecoded-portrait:**
- Header 3 colunas (texto puro)
- Sem avatar pill central
- Título `bottom-32` com `text-[1.6rem]` e palavras destacadas maiores (`text-[2rem]`)
- Footer igual massive

---

## 16. Checklist de implementação

Antes de considerar pronto:

- [ ] Salvar 6 imagens de referência em `referencias-v2/capas/`
- [ ] Atualizar tipo `EditorialVariant` com 6 nomes novos
- [ ] Adicionar 6 blocos `if (variant === "...") { ... }` no `slide-preview.tsx`
- [ ] Atualizar `pickVariant()` ou substituir por escolha da IA
- [ ] Atualizar system prompt do Claude com regras de §3
- [ ] Adicionar campos opcionais ao schema (handle_avatar, brand_label, year_label)
- [ ] Testar gerando 6 carrosséis (1 por variante) e validar visualmente
- [ ] Comparar resultado com imagens em `referencias-v2/capas/`
- [ ] Documentar diferenças encontradas e ajustar

---

## 17. Limites conhecidos

- **Foto vertical retrato necessária** para `cover-brandsdecoded-portrait`. Se a IA gerar foto landscape, vai cortar feio. Solução: forçar `aspectRatio: '4:5'` no Fal.ai pra essa variante.
- **Avatar circular** (`cover-wesley-labios`) precisa de URL específico. Se não tiver, usar fallback com inicial do handle.
- **Múltiplas palavras destacadas** (`cover-brandsdecoded-massive`): a IA pode exagerar e destacar tudo. Limitar a 2-3 palavras no prompt.
- **Tamanho título 3rem** (`cover-brandsdecoded-massive`): pode estourar se título tiver muitas palavras. Limitar título a max 8-10 palavras no prompt.
- **Subtitle opcional**: nem todas as variantes usam subtitle, mas o schema ainda permite. Se IA mandar subtitle pra `cover-brandsdecoded-massive`, ignorar.

---

## 18. Próximos passos depois das capas

Quando essas 6 capas estiverem implementadas e funcionando, repetir o processo pra:

1. **Splits** (slides de conteúdo) — adicionar variantes em `referencias-v2/splits/`
2. **Fullbleed-quebra** (slides de quebra visual) — adicionar variantes em `referencias-v2/fullbleed-quebra/`
3. **CTA finals** — eventualmente criar pasta `referencias-v2/ctas/`

A ideia é construir uma biblioteca robusta de templates fixos que a IA combina automaticamente, garantindo qualidade visual consistente em todos os carrosséis gerados.
