# SPLITS-SPEC — Variantes de slides de conteúdo do `/teste` editorial

Documento técnico explicando **pixel-a-pixel** como cada família de splits está posicionada. Mesma estrutura do `LAYOUT-SPEC.md` e `CAPAS-SPEC.md`, focado em slides de **conteúdo** (slides 2 a N-1, antes do CTA).

> Arquivo da fonte: [`components/carousel/slide-preview.tsx`](components/carousel/slide-preview.tsx)
> Pasta de referência: `referencias-v2/splits/`
> Imagens originais devem estar salvas em `referencias-v2/splits/` com os nomes referenciados em cada família.

---

## 1. Visão geral

Hoje existem 3 variantes de splits: `image-top`, `image-bottom` e `image-bg` (do `LAYOUT-SPEC.md`). Este documento adiciona **5 famílias novas**, cada uma com 2-4 modificadores que controlam onde a imagem aparece (ou se aparece).

Diferente das capas (1 variante por imagem), aqui usamos **família + modificador** pra reduzir redundância. Exemplo:

```
Variante completa: split-wesley-dark.composition-top
              família.modificador
```

Isso resulta em **15 combinações reais** com apenas 5 famílias + sistema de modificadores.

Todas as 5 famílias:
- Mantêm o canvas `aspect-[4/5] rounded-xl overflow-hidden`
- Suportam customização de: texto, imagem(s), cor de destaque (`accent`), fonte (`fontClass`), textos das pills/headers
- NÃO permitem customização de: posição, estrutura, hierarquia visual, modificador de imagem (escolhido pela IA)

---

## 2. Tipo `EditorialVariant` atualizado

```ts
export type SplitFamily =
  | "split-wesley-dark"
  | "split-brandsdecoded-light"
  | "split-brandsdecoded-dark-serif"
  | "split-bolo-cream"
  | "split-mypostflow-cta"

export type SplitModifier = {
  imageSlot: "none" | "single-bottom" | "single-top" | "comparison-bottom" | "comparison-top" | "composition-top" | "bottom-card" | "bottom-large"
  titleSize?: "medium" | "large" | "massive"
}

export type EditorialVariant =
  // existentes (do LAYOUT-SPEC.md)
  | "cover" | "image-top" | "image-bottom" | "image-bg"
  // capas (do CAPAS-SPEC.md)
  | "cover-wesley-gemini" | "cover-wesley-internet" | "cover-wesley-labios"
  | "cover-wesley-churrasco" | "cover-brandsdecoded-massive" | "cover-brandsdecoded-portrait"
  // splits (novo)
  | SplitFamily

// Slide com modificador opcional
interface SlideContent {
  variant: EditorialVariant
  modifier?: SplitModifier
  // ... resto dos campos
}
```

---

## 3. Lógica de escolha automática (IA decide)

Função no system prompt do Claude (geração do roteiro):

```
REGRA: Slides de conteúdo (não-capa, não-CTA) devem usar uma das 5 famílias
de splits abaixo. A IA escolhe família + modificador baseado em 2 fatores:

1. ESTILO VISUAL DO CARROSSEL (continuar coerente com a capa escolhida):
   - Se capa é cover-wesley-* → preferir split-wesley-dark
   - Se capa é cover-brandsdecoded-massive → preferir split-brandsdecoded-light
                                            ou split-brandsdecoded-dark-serif
   - Se capa é cover-brandsdecoded-portrait → preferir split-brandsdecoded-dark-serif
                                              ou split-brandsdecoded-light
   - Excepcionalmente, alternar família pra criar contraste visual

2. CONTEÚDO DO SLIDE (decide o modificador):
   - Slide explica conceito sem precisar mostrar exemplo → imageSlot: "none"
   - Slide mostra UMA tela/screenshot/produto → imageSlot: "single-bottom" ou "single-top"
   - Slide compara antes/depois ou 2 opções → imageSlot: "comparison-bottom"
   - Slide combina UI screenshot com elementos visuais → imageSlot: "composition-top"
   - Slide é "chamada" pra recurso visual destacado → imageSlot: "bottom-card"
   - Slide CTA com produto em destaque → imageSlot: "bottom-large"

REGRA DE OURO: cada carrossel deve ter NO MÁXIMO 2 famílias diferentes pra
manter coerência visual. Variar só o modificador entre slides.
```

A IA retorna no JSON:
```json
{
  "variant": "split-wesley-dark",
  "modifier": { "imageSlot": "composition-top", "titleSize": "large" }
}
```

---

## 4. Componentes shared adicionais

### `Pill` (já existe — referência)

Usado em: `split-bolo-cream`. Demais famílias não usam pills no header.

### `HighlightedText` (já existe — referência)

Usado em todas as 5 famílias pra destacar palavras com cor `accent`.

### `AvatarPill` (novo)

Pill com avatar circular à esquerda + handle.

```tsx
<AvatarPill avatar="url" handle="@user" variant="dark" />
```

**Specs:**
- Container: `flex items-center gap-2 rounded-full px-3 py-1.5`
- Avatar: `w-7 h-7 rounded-full object-cover`
- Handle: `text-sm font-medium`
- Variants:
  - `dark`: bg `rgba(0,0,0,0.3)` + backdrop-blur + texto branco
  - `light`: bg `#FFFFFF` + texto preto
  - `transparent`: sem bg, só avatar + texto sobre fundo escuro

### `SectionTag` (novo)

Tag de seção tipo "IDEIA 01:" usado em `split-bolo-cream`.

```tsx
<SectionTag prefix="IDEIA" number="01" suffix="BOLO DE POTE" prefixColor={accent} />
```

**Specs:**
- Container: inline `text-2xl uppercase tracking-tight`
- Prefix + number: cor `accent`
- Resto: cor base (preto em fundo claro)

### `BrandsdecodedHeader` (novo)

Header texto puro 3 colunas usado em famílias `brandsdecoded-*`.

```tsx
<BrandsdecodedHeader
  left="Powered by Content Machine"
  center="@brandsdecoded_"  // opcional
  right="2026 //"
  textColor="rgba(0,0,0,0.6)"  // ou "rgba(255,255,255,0.6)"
/>
```

**Specs:**
- Container: `flex justify-between items-center px-6 pt-5`
- 3 spans: `text-[10px] uppercase tracking-wider`
- Center span: opcional (algumas variantes não usam)

### `BrandsdecodedFooter` (novo)

Footer com linha + paginação minimalista.

```tsx
<BrandsdecodedFooter pageNumber={3} totalPages={9} textColor="rgba(0,0,0,0.5)" lineColor="rgba(0,0,0,0.2)" />
```

**Specs:**
- Container: `flex items-center gap-3 px-6 pb-4`
- Linha: `flex-1 h-px`
- Texto: `text-[10px]` formato "X/Y"

---

## 5. Família `split-wesley-dark`

**Imagens de referência:**
- `referencias-v2/splits/wesley-ia-custo.jpg` (composition-top)
- `referencias-v2/splits/wesley-gemini-feed.jpg` (none)
- `referencias-v2/splits/wesley-ia-imagens.jpg` (comparison-bottom)
- `referencias-v2/splits/wesley-cta.jpg` (composition-top + CTA)

**Conceito visual:** fundo preto, avatar pill no topo, título grande UPPERCASE com palavra destacada em accent (geralmente amarelo), body branco, e imagem(s) opcional(is) embaixo ou compostas.

**Layout base (sem imagem):**

```
┌─────────────────────────────────┐
│                                  │
│  [@avatar @handle]               │  ← top-12 (48px), left-6
│                                  │     AvatarPill variant="transparent"
│  TÍTULO COM PALAVRA              │  ← top-24 (~96px), left-6 right-6
│  EM ACCENT                       │     text-[2.5rem] uppercase
│                                  │     leading-[0.95] font-weight-800
│                                  │     palavra(s) em accent
│                                  │
│  Body text em 4-6 linhas         │  ← logo abaixo do título (margin 24px)
│  com **bold inline** se          │     text-base text-white/85
│  necessário, mantendo            │     leading-[1.4]
│  legibilidade alta.              │     suporta **bold** (palavras em font-weight-700)
│                                  │
│                                  │     [SLOT DE IMAGEM AQUI - depende do modifier]
│                                  │
│                                  │
└─────────────────────────────────┘
```

### Modificador `imageSlot`

Define onde e como a(s) imagem(ns) aparece(m):

#### `imageSlot: "none"` (sem imagem)

Layout puro de texto. Body pode ter mais linhas (até 8-10).

```
┌──────────────────────────────────┐
│ [@avatar @handle]                │
│                                  │
│ TÍTULO GRANDE                    │
│ COM ACCENT                       │
│                                  │
│ Body text longo, várias          │
│ linhas, bold inline em           │
│ palavras-chave. Permite          │
│ desenvolver argumento sem        │
│ pressa. Pode ter 2 parágrafos    │
│ separados por linha em branco.   │
│                                  │
└──────────────────────────────────┘
```

**Quando usar:** slide explica conceito sem precisar mostrar exemplo (ex: definição, lista de princípios, manifesto).

#### `imageSlot: "single-bottom"` (uma imagem embaixo)

Imagem retangular ocupando 35% da altura, abaixo do body.

```
┌──────────────────────────────────┐
│ [@avatar @handle]                │
│                                  │
│ TÍTULO COM ACCENT                │
│                                  │
│ Body em 3-4 linhas no máximo.    │
│                                  │
│ ┌────────────────────────────┐   │  ← bottom-12, left-6 right-6
│ │                            │   │     aspect-[16/9] rounded-2xl
│ │       IMAGEM ÚNICA         │   │     object-cover
│ │                            │   │     box-shadow sutil
│ └────────────────────────────┘   │
└──────────────────────────────────┘
```

**Quando usar:** mostrar 1 screenshot, produto, exemplo concreto.

#### `imageSlot: "comparison-bottom"` (duas imagens lado a lado)

Duas imagens em grid 2 colunas, abaixo do body.

```
┌──────────────────────────────────┐
│ [@avatar @handle]                │
│                                  │
│ TÍTULO COM ACCENT                │
│                                  │
│ Body em 3-4 linhas explicando    │
│ a comparação entre as duas.      │
│                                  │
│ ┌──────────────┐ ┌──────────────┐│  ← bottom-12, gap-3
│ │              │ │              ││     ambas aspect-[3/4] rounded-xl
│ │   IMAGEM 1   │ │   IMAGEM 2   ││     object-cover
│ │              │ │              ││
│ └──────────────┘ └──────────────┘│
└──────────────────────────────────┘
```

**Quando usar:** comparar antes/depois, opção A vs B, ruim vs bom.

#### `imageSlot: "composition-top"` (imagem composta acima do título)

Card de imagem flutuante acima do título, geralmente mostrando UI screenshot + imagem complementar.

```
┌──────────────────────────────────┐
│                                  │
│ ┌────────────────────────────┐   │  ← top-8, left-6 right-6
│ │  ┌──────────┐ ┌──────────┐ │   │     container interno com 2 sub-cards:
│ │  │ UI/INPUT │ │  OUTPUT  │ │   │     - sub-card 1: 40% largura, screenshot/UI
│ │  └──────────┘ └──────────┘ │   │     - sub-card 2: 60% largura, imagem real
│ └────────────────────────────┘   │     gap-2 entre eles
│                                  │     ambos rounded-lg
│ [@avatar @handle]                │  ← top do bloco texto (~top-[55%])
│                                  │
│ TÍTULO COM ACCENT                │  ← títu maior, font-weight-900
│                                  │
│ Body em 3-4 linhas.              │
│                                  │
└──────────────────────────────────┘
```

**Quando usar:** demonstrar input + output, antes do prompt + depois do resultado, UI + resultado visual.

### Specs detalhadas (família inteira)

- Background: `bg-black` (#0A0A0A sólido)
- Avatar pill (top-12, left-6):
  - `AvatarPill variant="transparent"` (sem background, só avatar + texto)
  - Avatar `w-7 h-7 rounded-full`
  - Handle `text-sm text-white font-medium`
- Título:
  - `text-[2.5rem]` (large), `text-[2.8rem]` (massive)
  - `uppercase` forçado
  - `font-weight: 800-900`
  - `leading-[0.95]`
  - `tracking-tight`
  - Cor base: `#FFFFFF`
  - Palavras destacadas: `accent` (amarelo `#FBBF24` no exemplo, mas vem da brandColors)
- Body:
  - `text-base` (~16px)
  - `text-white/85`
  - `leading-[1.4]`
  - Suporta `**bold**` inline (renderiza palavras em `font-weight-700`)
- Imagem(ns):
  - `single-bottom`: aspect 16/9, rounded-2xl
  - `comparison-bottom`: aspect 3/4 cada, rounded-xl
  - `composition-top`: container com 2 sub-cards, rounded-lg
- **SEM HEADER PILLS** — visual limpo
- **SEM FOOTER** — visual limpo

**Customizável:** texto, body, palavras destacadas, imagem(ns), accent, fonte, avatar, handle
**NÃO customizável:** posição dos elementos, ausência de header/footer pills, fundo preto

**Diferencial:** vibe tech/dark/agressiva. Combina com capas Wesley.

---

## 6. Família `split-brandsdecoded-light`

**Imagens de referência:**
- `referencias-v2/splits/brandsdecoded-passo.jpg` (single-top)
- `referencias-v2/splits/brandsdecoded-novidade.jpg` (bottom-card com 3 mockups)
- `referencias-v2/splits/brandsdecoded-texto-foto.jpg` (single-middle)

**Conceito visual:** fundo bege/cream, header texto puro 3 colunas, título GIGANTE preto com palavra destacada em accent, imagem grande arredondada como protagonista, footer linha + paginação.

**Layout base:**

```
┌──────────────────────────────────┐
│ CONTENT MACHINE   @user_   2026//│  ← BrandsdecodedHeader (texto puro)
│                                  │
│ TÍTULO MUITO                     │  ← top-16, left-6 right-6
│ GRANDE COM                       │     text-[3rem] (massive) ou [2.5rem] (large)
│ PALAVRAS EM                      │     uppercase
│ ACCENT                           │     leading-[0.92] font-weight-900
│                                  │     tracking-tight
│                                  │     palavras destacadas em accent
│ [SLOT DE IMAGEM - depende do modifier]
│                                  │
│ ────────────────────  3/9        │  ← BrandsdecodedFooter
└──────────────────────────────────┘
```

### Modificador `imageSlot`

#### `imageSlot: "single-bottom"`

Imagem grande retangular embaixo, ocupando 50% da altura.

```
┌──────────────────────────────────┐
│ HEADER TEXTO                     │
│                                  │
│ TÍTULO MASSIVE                   │
│ EM 2 LINHAS                      │
│                                  │
│ ┌────────────────────────────┐   │  ← top-[40%], left-6 right-6
│ │                            │   │     aspect-[4/3] rounded-2xl
│ │   IMAGEM GRANDE            │   │     box-shadow sutil
│ │                            │   │
│ └────────────────────────────┘   │
│                                  │
│ ────────────  3/9                │
└──────────────────────────────────┘
```

#### `imageSlot: "single-top"`

Título no topo (menor) + imagem grande abaixo + body curto.

```
┌──────────────────────────────────┐
│ HEADER TEXTO                     │
│                                  │
│ TÍTULO LARGE                     │  ← text-[2.5rem]
│ EM 2 LINHAS                      │
│                                  │
│ ┌────────────────────────────┐   │  ← imagem domina o slide
│ │                            │   │     aspect-[16/10]
│ │   SCREENSHOT/MOCKUP        │   │     rounded-2xl
│ │   GRANDE                   │   │
│ │                            │   │
│ └────────────────────────────┘   │
│                                  │
│ Body de 2 linhas explicando     │  ← abaixo da imagem
│ o que está sendo mostrado.       │
│                                  │
│ ────────────  3/9                │
└──────────────────────────────────┘
```

#### `imageSlot: "single-middle"`

Texto em cima + imagem horizontal no meio + texto embaixo.

```
┌──────────────────────────────────┐
│ HEADER TEXTO                     │
│                                  │
│ Body large 3-4 linhas explicando│  ← text-[1.4rem] leading-[1.4]
│ o conceito principal antes da    │     suporta bold inline
│ imagem como suporte visual.      │
│                                  │
│ ┌────────────────────────────┐   │  ← imagem aspect-[16/9]
│ │   IMAGEM HORIZONTAL        │   │     rounded-xl
│ └────────────────────────────┘   │
│                                  │
│ Body continua aqui em 3-4        │  ← text continuation
│ linhas após a imagem.            │
│                                  │
│ ────────────  6/9                │
└──────────────────────────────────┘
```

#### `imageSlot: "bottom-card"` (3 mini-cards lado a lado)

Mostra grid de 3 mockups/screenshots como destaque visual.

```
┌──────────────────────────────────┐
│ HEADER TEXTO                     │
│                                  │
│ TÍTULO MASSIVE                   │  ← text-[3rem]
│ EM VÁRIAS LINHAS                 │
│ COM ACCENT                       │
│                                  │
│ ┌──────┐ ┌──────┐ ┌──────┐       │  ← 3 sub-cards rounded-xl
│ │      │ │      │ │      │       │     aspect-[3/4] cada
│ │  M1  │ │  M2  │ │  M3  │       │     gap-3
│ │      │ │      │ │      │       │
│ └──────┘ └──────┘ └──────┘       │
│                                  │
│ ┌──────────────────────────────┐ │  ← Callout preto opcional
│ │ Texto callout em destaque    │ │     bg-black text-white px-4 py-2 rounded-md
│ └──────────────────────────────┘ │
│                                  │
│ ────────────  4/9                │
└──────────────────────────────────┘
```

### Specs detalhadas

- Background: `bg-[#F5F2EC]` ou `bg-[#FAF8F5]` (cream)
- Header: `BrandsdecodedHeader` com `textColor="rgba(0,0,0,0.5)"`
- Título:
  - Tamanho varia por `titleSize`:
    - `medium`: `text-[2rem]`
    - `large`: `text-[2.5rem]`
    - `massive`: `text-[3rem]`
  - `uppercase` (com exceção: `single-middle` pode usar caso natural)
  - `font-weight: 900`
  - `leading-[0.92]`
  - `tracking-tight`
  - Cor: `#0A0A0A` (preto)
  - Palavras destacadas: `accent`
- Imagem(ns):
  - `single-bottom`: aspect 4/3, rounded-2xl
  - `single-top`: aspect 16/10, rounded-2xl
  - `single-middle`: aspect 16/9, rounded-xl
  - `bottom-card` (grid 3): aspect 3/4 cada, rounded-xl, gap-3
- Footer: `BrandsdecodedFooter` com `textColor="rgba(0,0,0,0.5)"` e `lineColor="rgba(0,0,0,0.2)"`
- Callout opcional (apenas em `bottom-card`):
  - `bg-black text-white px-4 py-2 rounded-md text-sm`

**Customizável:** texto, body, palavras destacadas, imagem(ns), accent, fonte, callout
**NÃO customizável:** background cream, posição dos elementos, header texto puro, footer linha+paginação

**Diferencial:** vibe editorial premium, magazine. Combina com capas brandsdecoded-massive e portrait.

---

## 7. Família `split-brandsdecoded-dark-serif`

**Imagens de referência:**
- `referencias-v2/splits/brandsdecoded-cerebro-default.jpg` (single-bottom)

**Conceito visual:** fundo navy escuro, **tipografia serif** (Playfair) — diferencial único, subtítulo amarelo claro como suporte, imagem grande arredondada embaixo. Uso restrito (1 slide por carrossel).

**Layout base:**

```
┌──────────────────────────────────┐
│ Powered by Content Machine  @user_  2026 //  │  ← header texto branco/translúcido
│                                  │
│ Quando a atenção se solta de     │  ← top-16, left-6 right-6
│ uma tarefa, o cérebro não        │     text-[1.7rem] FONTE SERIF (Playfair)
│ desliga. Ele ativa uma rede      │     leading-[1.15]
│ específica de regiões, chamada   │     font-weight-700
│ de Default Mode Network.         │     cor: #FFFFFF
│                                  │     mistura case (NÃO força UPPERCASE)
│                                  │
│ Subtítulo de suporte em duas     │  ← logo abaixo, margin 16px
│ linhas explicando o conceito.    │     text-base text-yellow-200 (#FDE68A)
│                                  │     font-weight-500
│                                  │
│ ┌────────────────────────────┐   │  ← bottom-8, left-6 right-6
│ │                            │   │     aspect-[16/10] rounded-2xl
│ │   IMAGEM CINEMATOGRÁFICA   │   │     object-cover
│ │                            │   │
│ └────────────────────────────┘   │
└──────────────────────────────────┘
```

### Modificador `imageSlot`

#### `imageSlot: "single-bottom"` (default)

Layout descrito acima — texto serif em cima + imagem embaixo.

#### `imageSlot: "none"`

Sem imagem. Texto serif ocupa mais espaço, suporta corpo serif maior + subtítulo.

```
┌──────────────────────────────────┐
│ HEADER                           │
│                                  │
│ Texto serif principal pode       │
│ ocupar 7-8 linhas em fonte       │
│ Playfair, com leading mais       │
│ arejado pra dar respiro          │
│ editorial. Pode ter aspas        │
│ ornamentais "abrindo e           │
│ fechando" citações importantes.  │
│                                  │
│ — Atribuição opcional em itálico │
│                                  │
│ Subtítulo em amarelo claro       │  ← amarelo (#FDE68A)
│ como cita ção de fonte ou        │
│ contexto adicional.              │
└──────────────────────────────────┘
```

### Specs detalhadas

- Background: `bg-[#0F0F1F]` (navy muito escuro)
- Header: `BrandsdecodedHeader` com `textColor="rgba(255,255,255,0.6)"`
- Título principal:
  - `text-[1.7rem]` (serif fica menor que sans-serif pra se ajustar visualmente)
  - **Fonte forçada: Playfair Display** (mesmo que `fontClass` do usuário seja outra)
  - `font-weight: 700`
  - `leading-[1.15]` (mais arejado que sans)
  - `tracking-tight`
  - Cor: `#FFFFFF`
  - **NÃO usa highlight em palavras** (serif não combina com destaques agressivos)
  - Pode usar itálico em palavras-chave (`<em>`)
- Subtítulo:
  - `text-base`
  - `text-[#FDE68A]` (amarelo claro hardcoded — diferencial dessa família)
  - `font-weight: 500`
  - Suporta sans-serif (volta pra `fontClass` do usuário ou fallback)
- Imagem (quando presente):
  - `aspect-[16/10] rounded-2xl object-cover`
  - Bottom-8 com left/right-6
- **SEM FOOTER** — visual limpo

**Customizável:** texto, subtítulo, imagem
**NÃO customizável:** background navy, fonte serif (forçada), cor amarela do subtítulo, ausência de footer

**IMPORTANTE — Restrição de uso:**
- **MAX 1 slide por carrossel** com essa família
- IA deve usar como "respiro intelectual" no meio do carrossel, não em sequência
- Se carrossel tem 5+ slides, considerar usar 1 dessa família como quebra

**Diferencial:** vibe editorial/jornalística/conceitual. Quebra visual cinematográfica.

---

## 8. Família `split-bolo-cream`

**Imagens de referência:**
- `referencias-v2/splits/bolo-pote.jpg` (bottom-card)

**Conceito visual:** fundo cream claro, pills no header E footer (variant light), tag de seção colorida com numeração, body text + imagem card abaixo, dots de paginação centralizados.

**Layout base:**

```
┌──────────────────────────────────┐
│ ┌─[@handle]──────[Categoria]──┐ │  ← top-4, pills variant="light"
│ │                              │ │
│ │ IDEIA 01: BOLO DE POTE       │ │  ← top-16
│ │                              │ │     SectionTag (prefix accent + resto preto)
│ │                              │ │     text-[1.5rem] uppercase
│ │                              │ │
│ │ Body text em parágrafos.     │ │  ← top-28
│ │ Pode ter múltiplos blocos    │ │     text-base text-black/80
│ │ separados por linha em       │ │     leading-[1.5]
│ │ branco. Suporta bold inline. │ │     suporta **bold**
│ │                              │ │
│ │ Outro parágrafo continuando  │ │
│ │ a explicação ou listando     │ │
│ │ pontos importantes.          │ │
│ │                              │ │
│ │ ┌────────────────────────┐   │ │  ← bottom-20, left-4 right-4
│ │ │                        │   │ │     aspect-[16/10] rounded-3xl
│ │ │   IMAGEM CARD          │   │ │     object-cover
│ │ │                        │   │ │     box-shadow sutil
│ │ └────────────────────────┘   │ │
│ │                              │ │
│ │ ┌─[Categoria]──●●●──[arrasta]┐│  ← bottom-4
│ │                              │ │     pills + dots centralizados
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

### Modificador `imageSlot`

#### `imageSlot: "bottom-card"` (default)

Layout descrito acima — body com tag + imagem card embaixo.

#### `imageSlot: "none"`

Sem imagem. Body ocupa toda área disponível.

```
┌──────────────────────────────────┐
│ ┌─[@handle]──────[Categoria]──┐ │
│ │                              │ │
│ │ IDEIA 01: TÍTULO             │ │
│ │                              │ │
│ │ Body longo em 8-12 linhas    │ │
│ │ explicando todos os detalhes │ │
│ │ da ideia/conceito.           │ │
│ │                              │ │
│ │ Pode ter listas:             │ │
│ │ • Item 1 com explicação      │ │
│ │ • Item 2 com explicação      │ │
│ │ • Item 3 com explicação      │ │
│ │                              │ │
│ │ Conclusão final em parágrafo │ │
│ │ destacado em **bold**.       │ │
│ │                              │ │
│ │ ┌─[Categoria]─●●●─[arrasta]┐ │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

### Specs detalhadas

- Background: `bg-[#F5F2EC]` (cream claro)
- Header (top-4, left-4 right-4):
  - 2 pills variant `light` (bg branco translúcido)
  - `flex justify-between`
- SectionTag (top-16, left-4):
  - Prefix: cor `accent` (ex: "IDEIA")
  - Number: cor `accent` (ex: "01:")
  - Suffix: cor preta (ex: "BOLO DE POTE")
  - `text-[1.5rem] uppercase tracking-tight font-weight-800`
- Body (top-28, left-4 right-4):
  - `text-base` (~15px)
  - `text-black/80`
  - `leading-[1.5]`
  - Suporta `**bold**` inline (font-weight-700)
  - Suporta listas com `•`
  - Múltiplos parágrafos separados por linha em branco
- Imagem (quando presente):
  - `aspect-[16/10] rounded-3xl`
  - Position: bottom-20 (acima do footer)
  - left-4 right-4
- Footer (bottom-4):
  - 2 pills variant `light` + `PaginationDots` centralizado
  - Pills: handle/categoria à esquerda, "arrasta →" à direita
  - Dots no meio (5 dots `h-1 w-1 gap-1.5`)

**Customizável:** texto, body, imagem, accent (cor do prefix da SectionTag), categoria nas pills, fonte
**NÃO customizável:** background cream, posição dos elementos, estrutura das pills, dots no footer

**Diferencial:** vibe vendedor estruturado, lista numerada, foco em "ideias" (ex: "Ideia 01", "Dica 02"). Combina com capa cover-wesley-labios (mesma vibe vendedora).

---

## 9. Família `split-mypostflow-cta`

**Imagens de referência:**
- `referencias-v2/splits/mypostflow-cta.jpg` (bottom-large)

**Conceito visual:** fundo branco/cream limpo, avatar pill com app icon (não foto humana), título médio preto sem palavra destacada, body curto, imagem grande embaixo como destaque do produto/resultado.

**Layout base:**

```
┌──────────────────────────────────┐
│                                  │
│  [icon @use.handle]              │  ← top-12, left-6
│                                  │     AvatarPill com app icon (não foto)
│                                  │     variant="transparent"
│                                  │
│  TÍTULO MÉDIO EM                 │  ← top-20, left-6 right-6
│  2-3 LINHAS!                     │     text-[2rem] uppercase
│                                  │     leading-[1] font-weight-800
│                                  │     SEM palavras destacadas
│                                  │     cor: preto (#0A0A0A)
│                                  │
│  Body em 4-6 linhas              │  ← logo abaixo do título (margin 24px)
│  explicando o conceito ou        │     text-base text-black/75
│  resultado da ferramenta.        │     leading-[1.5]
│  Pode ter parágrafos             │
│  separados.                      │
│                                  │
│  ┌────────────────────────────┐  │  ← bottom-8, left-6 right-6
│  │                            │  │     aspect-[16/10] rounded-2xl
│  │   IMAGEM PRODUTO           │  │     object-cover
│  │   (mockup/foto/composição) │  │     box-shadow MAIS forte (cta destaque)
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

### Modificador `imageSlot`

#### `imageSlot: "bottom-large"` (default)

Layout descrito acima.

#### `imageSlot: "none"`

Sem imagem. Body pode ocupar mais espaço.

### Specs detalhadas

- Background: `bg-[#F5F2EC]` ou `bg-[#FFFFFF]` (cream ou branco puro)
- Avatar pill (top-12, left-6):
  - `AvatarPill variant="transparent"`
  - Avatar: app icon (logo da marca, não foto humana) `w-7 h-7 rounded-md` (não circular)
  - Handle: `text-sm text-black/80 font-medium`
- Título (top-20, left-6 right-6):
  - `text-[2rem]` (~32px)
  - `uppercase`
  - `font-weight: 800`
  - `leading-[1]`
  - Cor: `#0A0A0A`
  - **SEM highlight de palavras** (vibe limpa)
- Body:
  - `text-base`
  - `text-black/75`
  - `leading-[1.5]`
  - Suporta bold
  - 4-6 linhas
- Imagem (bottom-8, left-6 right-6):
  - `aspect-[16/10] rounded-2xl`
  - Box-shadow forte: `0 12px 32px rgba(0,0,0,0.15)` (CTA destaca)
- **SEM HEADER PILLS** ou textos
- **SEM FOOTER**

**Customizável:** texto, body, imagem, accent (não usado visualmente, mas mantido na schema), fonte, app icon, handle
**NÃO customizável:** posição, ausência de pills, ícone quadrado (não circular)

**Diferencial:** vibe minimalista CTA, foco no produto/resultado. Geralmente último slide ou penúltimo. NÃO é o CTA final propriamente (esse vai num documento futuro de CTAs).

**IMPORTANTE — Restrição de uso:**
- Use principalmente como slide de "demonstração de produto" antes do CTA final
- Pode aparecer como CTA simplificado se carrossel não tiver CTA dedicado

---

## 10. Tabela comparativa das 5 famílias

| Família | Background | Header | Footer | Tipografia | Quando usar |
|---|---|---|---|---|---|
| `split-wesley-dark` | preto sólido | avatar pill | nenhum | sans-serif large UPPERCASE | Vibe tech/dark, com capas Wesley |
| `split-brandsdecoded-light` | cream | texto puro 3 col | linha + paginação | sans-serif massive UPPERCASE | Vibe editorial premium |
| `split-brandsdecoded-dark-serif` | navy | texto puro 3 col | nenhum | **SERIF** Playfair | Quebra conceitual (max 1 por carrossel) |
| `split-bolo-cream` | cream | pills light | pills light + dots | sans-serif medium UPPERCASE | Listas/ideias numeradas |
| `split-mypostflow-cta` | cream/branco | avatar app icon | nenhum | sans-serif medium UPPERCASE | Demo de produto/CTA |

---

## 11. Tipografia (todas as 5 famílias)

A fonte vem da prop `fontClass` (escolhida pelo usuário no painel) — exceto família `split-brandsdecoded-dark-serif` que **força Playfair Display**.

| Família | Tamanho título | Peso | Tracking | Case |
|---|---|---|---|---|
| split-wesley-dark | 2.5-2.8rem | 800-900 | -tight | UPPERCASE |
| split-brandsdecoded-light (medium) | 2rem | 900 | -tight | UPPERCASE |
| split-brandsdecoded-light (large) | 2.5rem | 900 | -tight | UPPERCASE |
| split-brandsdecoded-light (massive) | 3rem | 900 | -tight | UPPERCASE |
| split-brandsdecoded-dark-serif | 1.7rem | 700 | -tight | natural (mistura) |
| split-bolo-cream | 1.5rem | 800 | -tight | UPPERCASE (SectionTag) |
| split-mypostflow-cta | 2rem | 800 | normal | UPPERCASE |

---

## 12. Cores e contraste

| Família | Texto base | Highlight (accent) | Body | Subtítulo |
|---|---|---|---|---|
| split-wesley-dark | branco | sim (amarelo padrão) | branco/85 | n/a |
| split-brandsdecoded-light | preto | sim | preto/80 | n/a |
| split-brandsdecoded-dark-serif | branco | NÃO (serif sem highlight) | branco | amarelo claro hardcoded #FDE68A |
| split-bolo-cream | preto | sim (apenas no SectionTag) | preto/80 | n/a |
| split-mypostflow-cta | preto | NÃO (vibe limpa) | preto/75 | n/a |

**Atenção:**
- Em famílias com background cream, validar que `accent` tem contraste suficiente em texto (ex: amarelo claro fica ilegível em cream).
- Em `split-brandsdecoded-dark-serif`, o amarelo claro do subtítulo é fixo `#FDE68A` (não vem do accent). Isso é proposital pra manter coerência editorial.

---

## 13. Schema do Claude — campos novos por família

```ts
interface SlideContent {
  variant: SplitFamily | CoverVariant
  modifier?: {
    imageSlot: "none" | "single-bottom" | "single-top" | "comparison-bottom" | "single-middle" | "composition-top" | "bottom-card" | "bottom-large"
    titleSize?: "medium" | "large" | "massive"
  }
  
  // campos comuns
  title: string
  body?: string
  highlight_words?: string[]
  
  // campos por família
  
  // split-wesley-dark, split-mypostflow-cta:
  handle?: string
  handle_avatar?: string  // URL avatar (foto pra wesley, ícone pra mypostflow)
  
  // split-brandsdecoded-light, split-brandsdecoded-dark-serif:
  brand_label?: string  // "Powered by Content Machine"
  year_label?: string  // "2026 //"
  
  // split-brandsdecoded-dark-serif (extra):
  subtitle?: string  // texto amarelo claro
  
  // split-bolo-cream (extras):
  section_prefix?: string  // "IDEIA"
  section_number?: string  // "01:"
  category_tag?: string  // "Bolos Gourmet"
  
  // split-brandsdecoded-light (modifier "bottom-card"):
  callout?: string  // texto da caixinha preta opcional
  
  // imagens: 0, 1, 2 ou 3 dependendo do imageSlot
  images?: Array<{ url: string, attribution?: string }>
}
```

---

## 14. Combinações típicas em carrosséis

Como a IA escolhe família + modificador automaticamente, aqui estão exemplos de combinações típicas:

### Carrossel 1: Tutorial técnico (vibe Wesley)

```
slide 1: cover-wesley-gemini
slide 2: split-wesley-dark.none           (introdução conceito)
slide 3: split-wesley-dark.single-bottom  (mostra UI)
slide 4: split-wesley-dark.composition-top (input + output)
slide 5: split-wesley-dark.comparison-bottom (antes vs depois)
slide 6: cta-wesley-final (futuro)
```

### Carrossel 2: Análise editorial (vibe brandsdecoded)

```
slide 1: cover-brandsdecoded-massive
slide 2: split-brandsdecoded-light.single-top       (mostra exemplo)
slide 3: split-brandsdecoded-dark-serif.single-bottom (quebra conceitual)
slide 4: split-brandsdecoded-light.bottom-card       (3 mockups)
slide 5: split-brandsdecoded-light.single-middle    (texto + foto + texto)
slide 6: cta-brandsdecoded-final (futuro)
```

### Carrossel 3: Lista de ideias (vibe bolo/Wesley)

```
slide 1: cover-wesley-labios
slide 2: split-bolo-cream.bottom-card  (Ideia 01)
slide 3: split-bolo-cream.bottom-card  (Ideia 02)
slide 4: split-bolo-cream.bottom-card  (Ideia 03)
slide 5: split-mypostflow-cta.bottom-large  (CTA produto)
```

### Carrossel 4: Mix editorial + tech

```
slide 1: cover-brandsdecoded-portrait
slide 2: split-brandsdecoded-light.single-middle
slide 3: split-brandsdecoded-dark-serif.none  (citação serif)
slide 4: split-wesley-dark.composition-top   (mostra ferramenta)
slide 5: split-mypostflow-cta.bottom-large
```

---

## 15. Como criar novas variantes/modificadores no futuro

### Adicionando novo modificador a família existente

1. Adicionar opção no tipo `SplitModifier.imageSlot`
2. Adicionar bloco condicional no JSX da família correspondente
3. Documentar no padrão das §5-§9
4. Salvar imagem de referência em `referencias-v2/splits/{familia}-{modificador}.jpg`

### Adicionando família totalmente nova

1. Salvar 1+ imagens em `referencias-v2/splits/{nome-familia}-{modifier}.jpg`
2. Adicionar entrada em `SplitFamily`
3. Documentar família completa no padrão das §5-§9
4. Atualizar §10 (tabela comparativa) e §11 (tipografia)
5. Atualizar §3 (regras de quando IA escolhe)
6. Implementar componente no `slide-preview.tsx`

---

## 16. Implementação no `slide-preview.tsx`

Cada família segue padrão similar. Estrutura simplificada:

```tsx
if (variant === "split-wesley-dark") {
  return (
    <div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative bg-black">
      {/* Avatar pill */}
      <AvatarPill 
        avatar={slide.handle_avatar}
        handle={slide.handle}
        variant="transparent"
        className="absolute top-12 left-6"
      />
      
      {/* Título com highlight */}
      <h2 className={`absolute top-24 left-6 right-6 text-[2.5rem] uppercase leading-[0.95] tracking-tight font-extrabold text-white ${fontClass}`}>
        <HighlightedText 
          text={slide.title} 
          words={slide.highlight_words || []} 
          color={accent} 
        />
      </h2>
      
      {/* Body */}
      {slide.body && (
        <p className="absolute top-[55%] left-6 right-6 text-base text-white/85 leading-[1.4]">
          {parseBoldInline(slide.body)}
        </p>
      )}
      
      {/* Slot de imagem - depende do modifier */}
      {modifier?.imageSlot === "single-bottom" && (
        <SingleBottomImage image={slide.images?.[0]} />
      )}
      {modifier?.imageSlot === "comparison-bottom" && (
        <ComparisonBottomImages images={slide.images?.slice(0, 2)} />
      )}
      {modifier?.imageSlot === "composition-top" && (
        <CompositionTopImages images={slide.images?.slice(0, 2)} />
      )}
      
      <Attribution attribution={slide.images?.[0]?.attribution} textColor="#fff" />
    </div>
  )
}
```

Sub-componentes auxiliares:

```tsx
function SingleBottomImage({ image }: { image?: SlideImage }) {
  return (
    <div className="absolute bottom-12 left-6 right-6 aspect-[16/9] rounded-2xl overflow-hidden shadow-lg">
      <img src={image?.url} className="w-full h-full object-cover" />
    </div>
  )
}

function ComparisonBottomImages({ images }: { images?: SlideImage[] }) {
  return (
    <div className="absolute bottom-12 left-6 right-6 grid grid-cols-2 gap-3">
      {images?.map((img, i) => (
        <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden">
          <img src={img.url} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  )
}

function CompositionTopImages({ images }: { images?: SlideImage[] }) {
  return (
    <div className="absolute top-8 left-6 right-6 flex gap-2">
      <div className="w-2/5 aspect-[4/3] rounded-lg overflow-hidden">
        <img src={images?.[0]?.url} className="w-full h-full object-cover" />
      </div>
      <div className="w-3/5 aspect-[4/3] rounded-lg overflow-hidden">
        <img src={images?.[1]?.url} className="w-full h-full object-cover" />
      </div>
    </div>
  )
}
```

---

## 17. Helper `parseBoldInline`

Para suportar `**texto**` virando `<strong>` em body:

```tsx
function parseBoldInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}
```

Já vai cobrir todas as famílias.

---

## 18. Checklist de implementação

- [ ] Salvar imagens de referência em `referencias-v2/splits/`
- [ ] Atualizar tipo `EditorialVariant` e adicionar `SplitFamily` + `SplitModifier`
- [ ] Criar componentes shared novos: `AvatarPill`, `SectionTag`, `BrandsdecodedHeader`, `BrandsdecodedFooter`
- [ ] Implementar 5 famílias no `slide-preview.tsx`
- [ ] Implementar sub-componentes de imagem (Single, Comparison, Composition, Card grid)
- [ ] Implementar `parseBoldInline` helper
- [ ] Atualizar system prompt do Claude com regras §3 + §14
- [ ] Adicionar campos opcionais ao schema (handle_avatar, brand_label, year_label, subtitle, section_prefix, section_number, category_tag, callout)
- [ ] Forçar Playfair Display em `split-brandsdecoded-dark-serif` (override do `fontClass`)
- [ ] Testar gerando 4 carrosséis (1 por combinação típica) e validar visualmente
- [ ] Comparar resultado com imagens em `referencias-v2/splits/`

---

## 19. Limites conhecidos

- **`comparison-bottom` exige 2 imagens com proporção parecida.** Se IA gerar 1 portrait + 1 landscape, fica feio. Solução: forçar mesmo aspect ratio nos prompts.
- **`composition-top` exige 1 imagem UI/screenshot + 1 imagem real.** Se IA não diferenciar os tipos, layout não faz sentido. Adicionar instrução clara no system prompt.
- **`split-brandsdecoded-dark-serif` força Playfair**: se `fontClass` do usuário é Bebas Neue (sans muito condensado), ainda assim ignora. Trade-off proposital pra manter coerência.
- **Body com `**bold**`**: só funciona com asteriscos duplos exatos. Triple `***italic+bold***` não suportado. Se precisar, expandir parser.
- **`bottom-card` em brandsdecoded-light exige 3 imagens.** Se IA gerar só 2, layout fica desbalanceado. Forçar 3 ou voltar pra `single-bottom`.
- **Pagination dots em `split-bolo-cream`**: usa 5 dots fixos. Se carrossel tem 3 ou 8 slides, dots ficam fora de sincronia. Ajustar `total` dinamicamente.

---

## 20. Próximos passos depois dos splits

Quando essas 5 famílias estiverem implementadas e funcionando, repetir o processo pra:

1. **CTAs finais** — adicionar variantes em `referencias-v2/ctas/`
2. **Fullbleed-quebra** (slides de quebra visual) — variantes em `referencias-v2/fullbleed-quebra/`
3. **Slides de capítulo/divisor** (intermediários grandes) — futuras variantes

A meta é construir biblioteca robusta de templates fixos que a IA combina automaticamente, garantindo qualidade visual consistente em todos os carrosséis gerados.
