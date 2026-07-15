# SyncPost — DESIGN.md

> **Fonte da verdade de design.** Este arquivo segue o padrão
> [`voltagent/awesome-design-md`](https://github.com/voltagent/awesome-design-md): um documento
> em texto puro que agentes de IA leem pra gerar UI consistente. **Ele supera qualquer outro
> doc** (`IDENTIDADE-VISUAL.md`, `CONTEXT.md`, `BRIEFING-*.md`). Se algo divergir, o DESIGN.md
> vence — ajuste os outros pra ele, nunca o contrário.
>
> Escopo: **app autenticado** (`app/dashboard/**`, `app/editor/**` e componentes de produto). A
> **landing/marketing** (`app/page.tsx`, `login`, `cadastro`, `pricing`, `termos`, `privacidade`
> e o namespace CSS `lp-*`) é exceção declarada e **pode** usar aurora/glow/gradiente pra vender.

---

## 1. Visual Theme & Atmosphere

**Tech premium flat.** A filosofia é a do Linear ("alisar tudo"): **o canvas escuro é o espaço
em branco**. A profundidade nasce de uma **escada de superfícies + bordas hairline**, nunca de
sombras, glows, gradientes de brilho ou spotlights.

- Um **único acento cromático**: o roxo SyncPost `#7320E6`. Reservado a marca, CTA primário,
  focus ring e link. Nunca como preenchimento de fundo de área grande.
- Alto contraste contido, tipografia com tracking negativo no display, muito respiro.
- Pistas de "sistema vivo" discretas (mono em labels, `●`/`▌`, régua roxa de topo `--rule-top`).
- **Sem** neon, **sem** glassmorphism decorativo, **sem** verde/lime na interface.

Regra mental: se um efeito existe só pra impressionar, ele não pertence ao app. Se existe pra
comunicar hierarquia ou estado, fica.

---

## 2. Color Palette & Roles

### Marca (escala oficial — extraída da logo, `app/globals.css`)
Gradiente da logo: magenta-violeta `#D53FF4` → core `#7320E6` → índigo `#580CE8`.

| Token | Hex | Papel |
|---|---|---|
| `--brand-50` | `#F6F3FE` | tint mais claro / bg de chip |
| `--brand-100` | `#EBE3FD` | |
| `--brand-200` | `#D7C5FB` | |
| `--brand-300` | `#BD9BF7` | acento suave (texto sobre escuro) |
| `--brand-400` | `#9C5FF1` | acento em dark / gradient-text achatado |
| `--brand-500` | `#832FEC` | |
| **`--brand-600`** | **`#7320E6`** | **PRINCIPAL — marca / CTA / focus / link** |
| `--brand-700` | `#5F14D6` | hover do CTA |
| `--brand-800` | `#4D0FB4` | active |
| `--brand-900` | `#320B74` | sombra de marca |
| `--brand-950` | `#1D0846` | |

### Funcionais
| Token | Hex | Papel |
|---|---|---|
| `--success` | `#9B87FF` | sucesso — **é roxo por decisão de marca (sem verde)** |
| `--warning` | `#F59E0B` | atenção |
| `--danger` | `#EF4444` | erro / destrutivo |
| `--info` | `#3B82F6` | informação |

### Superfícies — modo escuro / Linear (`.dashboard-root`, `app/dashboard/dashboard.css`)
Escada com **no máximo 4 níveis**. Canvas quase-preto com leve viés roxo (**nunca `#000` puro**).

| Token | Hex | Papel |
|---|---|---|
| `--canvas` | `#0a0910` | fundo-âncora (o "espaço em branco") |
| `--surface-1` | `#121118` | card / sidebar |
| `--surface-2` | `#17161e` | popover / hover de card |
| `--surface-3` | `#1c1b24` | nível elevado |
| `--surface-4` | `#201f28` | topo da escada |
| `--text-primary` | `#f7f8f8` | título / texto forte |
| `--text-secondary` | `#c9ced7` | corpo |
| `--text-muted` | `#8a8f98` | secundário |
| `--text-subtle` | `#62666d` | placeholder / desabilitado |

### Superfícies — modo claro (`:root`)
Background `#EEEEEE`, sidebar/cards `#FFFFFF`, tertiary `#F5F5F5`. Texto `#0e0e0e` → `#6b6b6b`.

### Bordas / hairlines
| Token | Valor (dark) | Papel |
|---|---|---|
| `--hairline` | `rgba(255,255,255,.06–.07)` | borda padrão de card/painel |
| `--hairline-strong` | `rgba(255,255,255,.11–.15)` | ênfase / hover neutro |
| `--border-accent` | `rgba(115,32,230,.4)` | hover que revela a marca |
| `--rule-top` | `2px solid #7320E6` | régua de topo (assinatura visual) |

**Regra de acento:** o roxo aparece em texto de link, ícone de marca, CTA primário e focus ring.
**Nunca** pinte um card, um header ou uma seção inteira de roxo.

---

## 3. Typography Rules

Famílias: **Geist Sans** (`--font-sans`/`--font-display`) e **Geist Mono** (`--font-mono`, para
labels de sistema, timestamps, códigos).

| Nível | Tamanho | line-height | tracking | peso |
|---|---|---|---|---|
| hero | 64px | 1.1 | -0.02em | 700 |
| h1 | 48px | 1.15 | -0.015em | 700 |
| h2 | 36px | 1.2 | -0.01em | 600 |
| h3 | 24px | 1.3 | -0.005em | 600 |
| h4 | 18px | 1.4 | — | 500 |
| body | 16px | 1.6 | — | 400 |
| small | 14px | 1.5 | — | 400 |
| tiny | 12px | 1.4 | +0.05em | 500 (mono/label) |

**Dentro do app (Linear):** aperte os pesos e o tracking — `h1/h2/h3` com peso `600` e tracking
`-0.028em` (h1 até `-0.036em`); `font-bold` = 600, `font-semibold` = 500, `font-medium` = 450.
Voz única e medida: nada de peso 800/900 na interface.

---

## 4. Component Stylings

Todos os estados são progressões de **cor de borda e superfície**, não de sombra.

### Button
- **Primário:** bg `--brand-600`, texto `#FFF`, raio 8px. Hover `--brand-700`, active `--brand-800`.
- **Secundário/outline:** bg transparente, borda `--hairline`, texto `--text-secondary`.
  Hover: bg `--accent` (`#7320E6`) + texto `#FFF` (`--accent-foreground` é branco — nunca escuro,
  senão o texto some no hover).
- **Ghost:** só texto; hover clareia bg pra `--surface-2`.
- Focus: `box-shadow: 0 0 0 2px rgba(115,32,230,.5), 0 0 0 4px var(--background)`.

### Card (`.dash-card`)
- bg `--surface-1`, borda `1px solid --hairline`, raio **12px**.
- Hover: **apenas clareia a borda** (`--hairline-strong`). Sem lift, sem drop-shadow, sem glow.
- Card interativo/template: hover revela `--border-accent` + sobe pra `--surface-2`.

### Input
- bg `--surface-1`/`--surface-2`, borda `--hairline`, raio 8px, texto `--text-primary`,
  placeholder `--text-subtle`. Focus: borda `--brand-600` + ring roxo.

### Nav / Sidebar (`.dash-sidebar-float`)
- Superfície flutuante `--surface-1`, hairline, raio **16px**, margem 12px. Sem glass/glow/shadow.
- Item ativo: texto `--text-primary` + indicador roxo fino; inativo: `--text-muted`.

---

## 5. Layout Principles

- **Base de espaçamento: 4px.** Toda medida é múltiplo de 4 (4/8/12/16/24/32/48/64).
- **Raios:** botão/input **8px**, card **12px**, painel/sidebar **16px** (`--radius: 0.75rem`
  com `sm/md/lg/xl` derivados).
- Muito whitespace. Colunas respiram; densidade vem do conteúdo, não de bordas grossas.
- Grids de 12 colunas no desktop; empilha no mobile.

---

## 6. Depth & Elevation

- Profundidade = **escada de superfícies (máx. 4) + hairlines**. Ponto final.
- **Proibido** usar `box-shadow` pra criar profundidade na UI do app. Os tokens
  `--shadow-glow*` são **`none`** de propósito — não reintroduza glow.
- Sombra só é tolerada como separador sutil de overlay/popover (`--shadow-card`), nunca como
  "brilho" de marca.
- `gradient-text` dentro do app vira **cor sólida** (`--brand-400`). Gradiente de texto só na
  landing.

---

## 7. Do's & Don'ts

### ✅ DO
- Um único acento: `#7320E6`.
- Hierarquia por superfície + hairline.
- Mono para labels de sistema, timestamps e estados.
- Copy honesto sobre estados (ex.: "em configuração", "planejado") — nunca prometa o que não faz.

### ❌ DON'T (regras globais — valem em TODA UI gerada, inclusive templates de post)
1. **Imagem nunca sobrepõe texto.** Use zonas flex separadas. **Nunca** `mt-auto` em imagem que
   divide coluna com texto (empurra e sobrepõe). Imagem e texto ocupam zonas distintas.
2. **Contraste do acento/destaque sempre via `readableAccent()`** (garante WCAG ≥ 3:1 vs o fundo).
   **Nunca** use `brand_colors[0]` cru como destaque — pode ficar ilegível.
3. **Foto de conteúdo nunca corta a cabeça.** `object-cover` + `PHOTO_FOCUS` (viés pro topo).
   Exceções: full-bleed 4:5 e avatares.
4. **Sem lime `#D1FE17`, sem verde, sem neon** na interface. (`--editorial-purple` no namespace
   `editorial-*` é exceção **isolada** do canvas Konva de template — não vaze pro app.)
5. **Sem gradiente/glow/spotlight** na UI do app: nada de `bg-gradient-brand`, `shadow-glow*`,
   `hover:border-purple-600`, classes `purple-*`/`violet-*` cruas do Tailwind. Use tokens de marca.
6. **Sem `#000` puro** de fundo — use `--canvas`.

---

## 8. Responsive Behavior

- Breakpoints Tailwind padrão (`sm 640 / md 768 / lg 1024 / xl 1280`).
- Sidebar flutuante no desktop → colapsa em `mobile-nav` (bottom bar) no mobile
  (`components/dashboard/mobile-nav.tsx`).
- Grids de cards: 3–4 col (desktop) → 2 (tablet) → 1 (mobile). Cards mantêm raio 12px e hairline.
- `prefers-reduced-motion`: desligar animações de entrada (`dashFadeUp`).

---

## 9. Agent Prompt Guide

Bloco pronto pra colar/consumir ao gerar ou revisar UI do app autenticado:

```
Paleta SyncPost (app autenticado, dark/Linear):
  Acento único ....... #7320E6  (marca/CTA/focus/link — nunca preenchimento de área)
  Canvas ............. #0a0910  (nunca #000 puro)
  Superfícies ........ #121118 → #17161e → #1c1b24 → #201f28  (máx. 4 níveis)
  Texto .............. #f7f8f8 / #c9ced7 / #8a8f98 / #62666d
  Hairline ........... rgba(255,255,255,.06)  hover: rgba(255,255,255,.11)
  Sucesso ............ #9B87FF (roxo, sem verde)   Erro #EF4444  Aviso #F59E0B  Info #3B82F6

Tipografia: Geist Sans; display peso 600, tracking -0.028em; body peso 400. Mono p/ labels.
Raios: botão/input 8px · card 12px · painel 16px. Espaçamento base 4px.

PROIBIDO: glow, box-shadow p/ profundidade, gradiente na UI, lime/verde #D1FE17,
classes purple-*/violet-* cruas, #000 puro, imagem sobrepondo texto.
OBRIGATÓRIO: acento único #7320E6, hairlines, readableAccent() p/ destaques,
PHOTO_FOCUS em fotos, copy honesto de estado.
```

**Exceção declarada:** landing/marketing (`app/page.tsx`, `login`, `cadastro`, `pricing`,
`termos`, `privacidade`, namespace `lp-*`) pode usar aurora/glow/gradiente. Não aplique este
DESIGN.md lá sem pedido explícito.
