# SyncPost — Identidade Visual

> ⚠️ **SUPERADO PELO `DESIGN.md` DA RAIZ.** A fonte da verdade de design agora é
> [`/DESIGN.md`](../DESIGN.md) (padrão awesome-design-md). O **roxo oficial único é `#7320E6`**
> (`--brand-600`), não `#7320E6`. Este doc foi alinhado a ele; se algo divergir, o `DESIGN.md`
> vence. Mantido como referência da filosofia visual (as "5 regras do sal", micro-tipografia).
>
> **Direção:** tech premium (não tech cafona).
> **Princípio:** o "tech" vem de **precisão e contenção**, nunca de efeito. Sem gradiente na interface, sem neon, sem glow. O caráter mora na tipografia, na micro-tipografia monoespaçada e no alto contraste.
> **Como usar este doc:** filosofia visual e regras de componente. Os **valores canônicos de token** vivem no `DESIGN.md` + `app/globals.css`. Não inventar cores, fontes ou efeitos fora daqui.

---

## 1. As 5 regras do "sal" (inegociáveis)

Esses cinco gestos são o que dá personalidade. Se um deles sumir, a marca vira SaaS genérico.

1. **Monoespaçada em todo label, número e metadado.** Geist Mono, geralmente em CAIXA ALTA com `letter-spacing` aberto. Títulos de seção, créditos, métricas, tags, tempos, IDs.
2. **Pistas de sistema vivo.** Bolinha de status `●`, tempo de geração (`4.2s`), e o **cursor em bloco roxo** (`▌`) ao fim de títulos ou em estados de geração. É o que faz parecer uma engine, não um site.
3. **Hairlines + régua roxa de topo.** Bordas finas (`1px` com baixa opacidade) e uma régua sólida de `2px #7320E6` no topo de superfícies-chave (cards, painéis).
4. **Alto contraste + respiro.** Texto quase branco sobre fundo quase preto, com bastante espaço negativo. Nada apertado, nada lotado.
5. **Roxo sólido e estrutural.** O roxo é cor de ação e de estrutura, sempre chapado. **Gradiente só existe dentro do logo.** Sem verde. Rosa/magenta só dentro do gradiente do logo.

---

## 2. Cores

### Superfícies
| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#0A0A0F` | Fundo base do app |
| `--surface` | `#0C0A12` | Cards e painéis elevados (leve viés roxo) |
| `--surface-2` | `#121019` | Segundo nível de elevação |

### Roxo (acento / estrutura)
| Token | Hex | Uso |
|---|---|---|
| `--primary` | `#7320E6` | Botão primário, bordas-acento, status dot, cursor |
| `--primary-vivid` | `#5F14D6` | Ênfase, hover de elementos roxos |
| `--primary-text` | `#9B87FF` | Palavra/realce roxo **sobre fundo escuro** (mais legível que o `#7320E6`) |
| `--primary-soft` | `#A78BFA` | Estados sutis, ícones |

### Texto
| Token | Hex | Uso |
|---|---|---|
| `--text` | `#F4F4F6` | Títulos e texto principal |
| `--text-2` | `#A3A0AD` | Corpo, descrições |
| `--text-muted` | `#6F6B7A` | Labels mono, metadados, placeholders |

### Bordas
| Token | Valor | Uso |
|---|---|---|
| `--hairline` | `rgba(255,255,255,.07)` | Divisórias e bordas neutras |
| `--border-accent` | `rgba(115,32,230,.22)` | Borda de cards/destaques |
| `--rule-top` | `2px solid #7320E6` | Régua de topo em superfícies-chave |

### Estados funcionais (não são cores de marca)
| Estado | Hex | Obs |
|---|---|---|
| Erro | `#FF5C5C` | Vermelho quente (não rosa) |
| Aviso | `#F5A623` | Âmbar |
| Sucesso | `#9B87FF` | **Roxo** — por decisão de marca não usamos verde. (Sobrescrever só se você decidir abrir exceção pra verde.) |

### Gradiente do logo (ÚNICO gradiente da marca)
`135deg, #C94CF1 → #8B2BEB → #580CE8` (magenta → violeta → índigo).
**Só dentro do squircle do logo.** Nunca em texto, botão, card ou fundo.

### Proibido
`verde/lime`, `azul`, `navy`, `sépia` · rosa/magenta fora do logo · **qualquer gradiente fora do logo** · neon, glow, sombras coloridas.

---

## 3. Tipografia

Duas fontes. A Geist faz o trabalho; a Geist Mono dá o sal.

- **Geist** — títulos, interface e corpo. Pesos `400 / 500 / 600 / 700`.
- **Geist Mono** — labels, números, metadados, tags de sistema, código. Pesos `400 / 500`.

Ambas são gratuitas (pacote oficial `geist` da Vercel).

### Escala
| Papel | Tamanho | Peso | Line-height | Tracking | Fonte |
|---|---|---|---|---|---|
| Display | 44–56px | 600 | 1.05 | -0.03em | Geist |
| H1 | 30px | 600 | 1.15 | -0.02em | Geist |
| H2 | 22px | 600 | 1.25 | -0.01em | Geist |
| H3 | 17px | 600 | 1.3 | -0.005em | Geist |
| Corpo | 15–16px | 400 | 1.6 | 0 | Geist |
| Pequeno | 13px | 400/500 | 1.5 | 0 | Geist |
| Label mono | 11–12px | 500 | 1.4 | +0.12 a 0.16em, CAIXA ALTA | Geist Mono |
| Número mono | conforme contexto | 500 | 1 | +0.08em | Geist Mono |

### Regras de uso da mono
- Todo **label de seção** (ex.: `TIPOGRAFIA`, `COMPONENTES`) em mono, caixa alta, espaçado.
- Todo **número de métrica/crédito/tempo** em mono (`1.240`, `4.2s`, `92%`, `v2.4`).
- **Tags de sistema** em mono (`PT-BR · 8 SLIDES · 4:5`, `● online`, `SYNCPOST / ENGINE`).
- Corpo e títulos **nunca** em mono.

### Implementação (Next.js + Tailwind v4)
```ts
// app/layout.tsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```
```bash
npm install geist
```

---

## 4. Logo

Ativo **fixo** — não redesenhar, não recolorir.

- Squircle (ícone) + wordmark "SyncPost".
- O **gradiente magenta→índigo** do squircle é o único gradiente da marca.
- **Favicon:** apenas o squircle.
- **Área de respiro:** no mínimo a altura do squircle de margem em volta.
- **Tamanho mínimo do wordmark:** 96px de largura; abaixo disso, usar só o squircle.
- **Não:** aplicar o gradiente do logo em outros elementos; trocar as cores; adicionar sombra/glow; esticar.

---

## 5. Componentes

### Botões
- **Primário:** `bg #7320E6`, texto `#FFFFFF`, peso 600, raio `9px`, padding `10–12px / 18px`. Hover: `#5F14D6`.
- **Secundário (ghost):** fundo transparente, borda `1px var(--hairline-strong: rgba(255,255,255,.15))`, texto `#EEEEEE`, mesmo raio.

### Pill de créditos
Mono, caixa alta. Borda `1px rgba(115,32,230,.3)`, raio `999px`, padding `7px 13px`. Começa com `●` em `#7320E6`. Ex.: `● 1.240 CRÉDITOS`.

### Badge
Mono, caixa alta, borda `1px var(--hairline)`, raio `7px`, padding `6px 11px`. Ex.: `PRO`.

### Card
- Fundo `#0C0A12`, borda `1px rgba(115,32,230,.2)`, **borda-topo `2px #7320E6`**, raio `12px`.
- **Header:** label mono caixa alta (`--text-muted`) à esquerda + status `●` à direita (ex.: `● gerando` em roxo).
- **Corpo:** título Geist 600.
- **Footer:** metadados em mono (`4.2s · 8 SLIDES · 4:5`).

### Input / busca
Fundo escuro, borda hairline, placeholder `--text-muted`. Atalho de teclado em mono (`⌘K`) à direita.

### Cursor (caret)
Bloco sólido `#7320E6`, largura ~`0.5em`, altura da linha do texto, ao fim de títulos ou estados de geração. É um device de marca — usar com parcimônia (1 por tela).

---

## 6. Espaçamento, raios e grid

- **Escala de espaço:** `4 · 8 · 12 · 16 · 20 · 24 · 32 · 48`.
- **Raios:** `sm 7px · md 9px · lg 12px · xl 16px · pill 999px`.
- **Densidade:** generosa. Padding interno de seção/card a partir de `20–34px`.
- **Bordas:** sempre finas. Acento estrutural só via régua de topo roxa.

---

## 7. Voz & tom

Padrão Wieden+Kennedy / Pentagram, em registro tech — confiante, específico, fala como uma engine que sabe o que faz.

- Específico > genérico. 1 ideia por slide.
- Título 6–9 palavras; corpo ≤ 25 palavras. PT-BR coloquial culto.
- O subtítulo tensiona o título; não repete.
- **Bandeira vermelha (NUNCA usar):** "Descubra", "Conheça", "Saiba mais", "Transforme sua vida", "Não perca", "Aproveite agora", "Você merece".

---

## 8. Imagem (arte gerada por IA)

Pra a foto pertencer à marca e não parecer stock colada:

- **Prompt:** em inglês, concreto (não metáfora literal), sem rostos reais, sempre com `no text`.
- **Pós-tratamento:** escuro, leve viés roxo, atmosférico — para a imagem viver no mesmo território do app.
- Sem cores fora da paleta (sem verde, sem azul saturado).

---

## 9. Resumo dos tokens (cole no `globals.css`)

```css
@theme {
  /* superfícies */
  --color-bg: #0A0A0F;
  --color-surface: #0C0A12;
  --color-surface-2: #121019;

  /* roxo */
  --color-primary: #7320E6;
  --color-primary-vivid: #5F14D6;
  --color-primary-text: #9B87FF;
  --color-primary-soft: #A78BFA;

  /* texto */
  --color-text: #F4F4F6;
  --color-text-2: #A3A0AD;
  --color-text-muted: #6F6B7A;

  /* estados */
  --color-error: #FF5C5C;
  --color-warning: #F5A623;
  --color-success: #9B87FF;

  /* fontes */
  --font-sans: var(--font-geist-sans), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;

  /* raios */
  --radius-sm: 7px;
  --radius-md: 9px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

:root {
  --hairline: rgba(255,255,255,.07);
  --hairline-strong: rgba(255,255,255,.15);
  --border-accent: rgba(115,32,230,.22);
  --rule-top: 2px solid #7320E6;
  /* gradiente — SOMENTE no logo */
  --logo-gradient: linear-gradient(135deg,#C94CF1,#8B2BEB 55%,#580CE8);
}
```
