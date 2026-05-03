# LAYOUT-SPEC — `/teste` editorial

Documento técnico explicando **pixel-a-pixel** como cada variante do `SlidePreview` editorial está posicionada. Use como base pra criar novas variações.

> Arquivo da fonte: [`components/carousel/slide-preview.tsx`](components/carousel/slide-preview.tsx)
> Pastas de referência (mande imagens lá pra pedir adaptações):
> - `referencias-v2/capas/` — refs pra capa (variant `cover`)
> - `referencias-v2/splits/` — refs pra layout split (variants `image-top` e `image-bottom`)
> - `referencias-v2/fullbleed-quebra/` — refs pra slide de quebra fullbleed (variant `image-bg`)

---

## 1. Canvas global

Todo slide é `aspect-[4/5]` (proporção 4:5 do Instagram), `rounded-xl`, `overflow-hidden`. Usa **proporção** em vez de pixels fixos pra escalar com qualquer tamanho do container pai.

```tsx
<div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative ...">
```

Conceitualmente, pense no canvas como **1080×1350** quando estimar tamanhos.

---

## 2. Componentes shared

### `Pill` — bolha arredondada

Inspirada nas refs `@brandsdecoded__` / `@emp.wesleysilva`. Aparece em headers, footers, tags.

```tsx
<Pill variant="dark">  // bg preto translúcido (em fundo escuro / foto)
<Pill variant="light"> // bg branco translúcido (em fundo cream/light)
```

**Props visuais:**
- `padding`: `px-3 py-1.5` (12px × 6px)
- `font`: `text-[11px] font-medium`
- `radius`: `rounded-full`
- `bg dark`: `rgba(0,0,0,0.5)` + `backdrop-filter: blur(8px)` + texto branco
- `bg light`: `rgba(255,255,255,0.9)` + `backdrop-filter: blur(8px)` + texto preto

### `PaginationDots` — dots de paginação

```tsx
<PaginationDots total={5} active={2} color="#FFFFFF" />
```

- 5 dots `h-1 w-1 rounded-full`
- `gap-1.5` entre dots
- Active dot: `opacity 0.95` + `scale 1.4` (fica maior)
- Inactive: `opacity 0.35`

---

## 3. Variantes — quando cada uma aparece

```ts
function pickVariant(orderIndex, totalSlides):
  if (orderIndex === 0)                                       return 'cover'
  if (totalSlides >= 5 && orderIndex === floor(total/2))       return 'image-bg'
  return orderIndex % 2 === 1 ? 'image-top' : 'image-bottom'
```

**Distribuição típica:**

| Total | Slide 1 | Slide 2 | Slide 3 | Slide 4 | Slide 5 | Slide 6 | Slide 7 |
|---|---|---|---|---|---|---|---|
| 3 | cover | image-top | image-bottom | — | — | — | — |
| 5 | cover | image-top | **image-bg** | image-bottom | image-top | — | — |
| 7 | cover | image-top | image-bottom | **image-bg** | image-top | image-bottom | image-top |

---

## 4. Variant `cover` (slide 1 — capa)

**Posicionamento (top→bottom):**

```
┌─────────────────────────────────┐
│ ┌────[Pill handle]─────[Pill cat]─┐  │  ← top: 16px (top-4), left/right: 16px
│ │                                  │  │
│ │       FOTO FULLBLEED             │  │  ← absolute inset-0, object-cover
│ │       (gradient overlay          │  │     gradient: black→55%→15% (top→bottom)
│ │        bottom-up)                │  │
│ │                                  │  │
│ │  ┌────────────────────┐          │  │  ← 44% do topo (top-[44%])
│ │  │  TÍTULO GIGANTE    │          │  │     text-[2.5rem] uppercase
│ │  │  com palavra em    │          │  │     leading-[0.98] tracking-tight
│ │  │  ACCENT            │          │  │     text-shadow: 0 2px 14px rgba(0,0,0,0.55)
│ │  └────────────────────┘          │  │     space-y-3 com subtitle
│ │                                  │  │
│ │ ┌─[Pill]──[dots]──[Pill arrasta]┐│  │  ← bottom: 16px (bottom-4)
│ └────────────────────────────────┘  │
└─────────────────────────────────┘
```

**Specs:**
- Background: `<img>` cobrindo `inset-0`, `object-cover`
- Overlay: `bg-gradient-to-t from-black via-black/45 to-black/10`
- Header (top-4): `Pill(handle)` esquerda, `Pill(categoria)` direita, `flex justify-between`
- Título (top-[44%]): `text-[2.5rem]` (~40px no scale do preview), `uppercase`, fonte da prop `fontClass` (Anton/Inter Black/etc), `tracking-tight`, `text-shadow` pra legibilidade
- Subtitle (logo abaixo do título): `text-sm text-white/85`
- Footer (bottom-4): `Pill(categoria)` + `PaginationDots` + `Pill(arrasta →)`, `flex justify-between`

**Como adaptar (ex: criar variant `cover-bottom-title`):**
- Remover `top-[44%]` e usar `bottom-20 left-5 right-5`
- Diminuir overlay: `from-black/80 via-black/40 to-transparent`
- Manter resto

---

## 5. Variant `image-bg` (quebra fullbleed no meio)

Visualmente parecido com `cover` MAS com texto mais embaixo + suporta body multi-linha.

```
┌─────────────────────────────────┐
│ ┌──[Pill handle]──[Pill cat]──┐    │  ← top-4
│ │                              │    │
│ │     FOTO FULLBLEED           │    │
│ │     (overlay 55%→15%)        │    │
│ │                              │    │
│ │                              │    │
│ │  TÍTULO GRANDE               │    │  ← bottom-20
│ │  com accent                  │    │     text-[2rem] uppercase
│ │  subtitle                    │    │     space-y-2.5
│ │  body line-clamp-3           │    │
│ │                              │    │
│ │ ┌─[Pill]─[dots]─[arrasta]─┐  │    │  ← bottom-4
│ └──────────────────────────┘    │
└─────────────────────────────────┘
```

**Diferenças em relação ao cover:**
- Título posicionado em `bottom-20` (não no centro-meio)
- `text-[2rem]` (menor que cover 2.5rem) pra dar espaço pro body
- Inclui `body` com `line-clamp-3` (cover não tem body)
- Mesmas pills no header e footer

**Quando o slide vira `image-bg`:** apenas se `totalSlides >= 5` e o slide está no meio. Função: dar uma quebra visual no carrossel sem repetir o estilo da capa.

---

## 6. Variant `image-top` (split com imagem em cima)

Layout dividido verticalmente em **3 fileiras** via CSS Grid.

```
┌─────────────────────────────────┐
│ ┌─[Pill handle]──[Pill cat]──┐    │  ← row 1 (auto): px-4 pt-4
│ │                              │    │
│ │ ┌──────────────────────────┐ │    │  ← row 2 (1fr): px-5
│ │ │   IMAGEM (44% altura)    │ │    │     rounded-md, object-cover
│ │ │                          │ │    │     flex-shrink-0
│ │ └──────────────────────────┘ │    │
│ │                              │    │     gap-3 entre imagem e texto
│ │ TÍTULO                       │    │     text-[1.7rem] tracking-tight
│ │ subtitle                     │    │     space-y-1.5
│ │ body line-clamp-3            │    │     line-clamp-3 no body
│ │                              │    │
│ │ ┌─[Pill]─[dots]─[arrasta]─┐  │    │  ← row 3 (auto): px-4 pb-4 pt-2
│ └──────────────────────────┘    │
└─────────────────────────────────┘
```

**Specs:**
- Container: `grid grid-rows-[auto_minmax(0,1fr)_auto]` — header e footer auto, conteúdo flexível
- Background: `bg-light` (cream `#FAF8F5` por default)
- Cor do texto: `dark` (preto)
- Imagem: `height: 44%` explícito, `flex-shrink-0`, `rounded-md overflow-hidden`
- Texto: `flex flex-col gap-3` ancorado em `justify-start` (cola no topo)
- Sem `flex-1` no bloco de texto → encolhe pro tamanho natural
- Pills `variant="light"` (bg branco translúcido) pra contrastar com o cream

**Como adaptar (ex: imagem 60% em vez de 44%):**
- Trocar `height: "44%"` no `SlideImage` por `60%`
- O grid `1fr` aceita

---

## 7. Variant `image-bottom` (split com imagem embaixo)

Espelho vertical do `image-top` — texto em cima, imagem embaixo.

```
┌─────────────────────────────────┐
│ ┌─[Pill handle]──[Pill cat]──┐    │  ← row 1 (auto)
│ │                              │    │
│ │  ↑ vazio aqui (justify-end) │    │     ← bloco texto+imagem
│ │                              │    │       ancorado no fundo
│ │ TÍTULO                       │    │     text-[1.7rem]
│ │ subtitle                     │    │     space-y-1.5
│ │ body line-clamp-3            │    │
│ │                              │    │
│ │ ┌──────────────────────────┐ │    │  ← imagem 44% colada no texto
│ │ │   IMAGEM (44% altura)    │ │    │     gap-3 entre eles
│ │ └──────────────────────────┘ │    │
│ │                              │    │
│ │ ┌─[Pill]─[dots]─[arrasta]─┐  │    │  ← row 3 (auto)
│ └──────────────────────────┘    │
└─────────────────────────────────┘
```

**Diferença pro `image-top`:**
- Container central: `justify-end pb-1` em vez de `justify-start`
- Ordem: `<Texto />` ANTES de `<SlideImage />` no JSX (o oposto do `image-top`)
- O resto é idêntico

**Como adaptar (ex: criar `image-side-right`):**
- Mudar grid pra `grid-cols-[1fr_auto]` em vez de rows
- Texto à esquerda, imagem 40% à direita (`width: "40%"`)

---

## 8. Tipografia (todos os variants)

| Elemento | Tamanho | Peso | Tracking | Caso |
|---|---|---|---|---|
| Pill text | `text-[11px]` | `font-medium` | normal | normal |
| Header título cover | `text-[2.5rem]` | herdado de `fontClass` | `tracking-tight` | UPPERCASE |
| Header título image-bg | `text-[2rem]` | idem | `tracking-tight` | UPPERCASE |
| Header título split | `text-[1.7rem]` | idem | `tracking-tight` | natural (não força UPPERCASE) |
| Subtitle | `text-sm` (cover) ou `text-xs` (resto) | normal | normal | natural |
| Body | `text-[11px]` | normal | normal | natural, `line-clamp-3` |

**`fontClass`** é a prop que decide a fonte (Anton, Bebas Neue, Playfair, Inter Black, etc) — vem do form do `/teste` (`Tipografia` no painel esquerdo).

---

## 9. Cores

Vêm das `brandColors` (3 cores, definidas no painel):
- `accent = brandColors[0]` — cor de destaque (palavras highlighted no título)
- `dark = brandColors[1]` — texto principal nos slides claros
- `light = brandColors[2]` — bg dos slides claros

Em variants fullbleed (`cover`, `image-bg`):
- Texto: branco puro `#FFFFFF`
- `accent` aparece nas palavras destacadas
- Pills: `dark` variant (bg preto translúcido)

Em variants split (`image-top`, `image-bottom`):
- Bg: `light` (cream)
- Texto: `dark` (preto)
- `accent` nas palavras destacadas
- Pills: `light` variant (bg branco translúcido)

---

## 10. Como criar uma nova variante

1. **Decida o conceito**: o que essa variante quer? Ex: `image-bg-bottom-text` (foto fullbleed + título preso no canto inferior, sem dots no centro mas dots em cima).
2. **Escolha quando ela aparece** em `pickVariant(orderIndex, totalSlides)`. Adicione condição própria.
3. **Crie o JSX** copiando o variant mais próximo (cover/image-top/etc) e ajustando posicionamento/sizes.
4. **Cole imagens de referência** em uma das pastas:
   - `referencias-v2/capas/` se for variação de capa
   - `referencias-v2/splits/` se for layout split
   - `referencias-v2/fullbleed-quebra/` se for fullbleed
5. Me avisa que olho a referência e adapto pixel-a-pixel.

### Template pra novas variantes (copy-paste)

```tsx
if (variant === "minha-nova-variante") {
  return (
    <div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative bg-black">
      {slide.image.url ? (
        <img
          src={slide.image.url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-[10px] px-4 text-center">
          {slide.image.error || "sem imagem"}
        </div>
      )}
      {/* overlay opcional */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />

      {/* header com pills */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <Pill>{handle}</Pill>
        <Pill>{categoryTag}</Pill>
      </div>

      {/* sua área de título customizada aqui */}
      <div className="absolute ... z-10">
        <h1 className={`text-[2.5rem] uppercase ... ${fontClass}`}>
          <HighlightedText text={slide.title} words={slide.highlight_words} color={accent} />
        </h1>
      </div>

      {/* footer com pills + dots */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
        <Pill>{categoryTag}</Pill>
        <PaginationDots total={totalSlides} active={slide.order_index} color="#FFFFFF" />
        <Pill>{`arrasta →`}</Pill>
      </div>

      <Attribution attribution={slide.image.attribution} textColor="#fff" />
    </div>
  )
}
```

---

## 11. Debug

Cada variante loga no console do browser ao montar:

```
[SlidePreview] slide 1/5 → variant: cover
[SlidePreview] slide 2/5 → variant: image-top
[SlidePreview] slide 3/5 → variant: image-bg
[SlidePreview] slide 4/5 → variant: image-bottom
[SlidePreview] slide 5/5 → variant: image-top
```

Se você adicionar uma variante nova, adiciona o nome dela em `EditorialVariant` e no log já vai aparecer.

---

## 12. Limites conhecidos / a evoluir

- **Aspect ratio fixo 4:5**: não dá pra mudar pra 1:1 ou 9:16 sem refatorar o container.
- **Texto longo demais**: title com 5+ linhas pode estourar. `line-clamp-3` no body já protege, mas o título não tem clamp.
- **Imagens com aspect ratio muito diferente** (ex: panorâmica): vão ser cortadas no `object-cover`. Sem solução automática hoje.
- **Pills sobrepondo título**: se título for muito alto e ocupar a área dos pills, pode dar conflito visual. Melhor mitigado por: títulos curtos + safe areas (top-4, bottom-4).
- **Categoria/handle hardcoded**: hoje uso `"@brand"` e `slide.cta_badge || "Editorial"`. Pra dar mais controle, daria pra adicionar campos `slide.handle` e `slide.category` no schema do Claude.
