# SyncPost — Contexto do Projeto

> Briefing pra qualquer IA/dev que vá trabalhar nesse repo.
> Última atualização: 2026-05-11 (commit `dc9e875`).

## TL;DR

SaaS de geração de conteúdo pra Instagram. Usuário descreve um briefing → IA gera copy + imagem + diagrama um post (único, carrossel ou stories). Tem editor estilo Canva, calendário editorial, sistema de XP, inspirações e marca multi-tenant.

**Status:** MVP funcional. Algumas features ainda usam localStorage (não banco). Detalhes em "O que está mockado" abaixo.

## Stack

- **Framework**: Next.js 16.2.4 (App Router, Turbopack), React 19, TypeScript strict
- **Estilo**: Tailwind CSS v4 + componentes shadcn-style em `components/ui/`
- **Backend**: Supabase (Postgres + Auth + Storage)
- **IA texto**: Anthropic Claude Sonnet 4.6 (`claude-sonnet-4-6`)
- **IA imagem**: Fal.ai Flux Schnell (`fal-ai/flux/schnell`) + Nano Banana Pro
- **Stock**: Unsplash API
- **Export**: html-to-image (PNG client-side)
- **Animação**: framer-motion

**Sem ORM** — queries diretas via `@supabase/supabase-js`.

## Como rodar

```bash
npm install
cp .env.local.example .env.local   # preencher variáveis
npm run dev                         # http://localhost:3000
```

### Variáveis obrigatórias (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
FAL_KEY=...
UNSPLASH_ACCESS_KEY=...
```

### Comandos úteis

- `npm run dev` — dev server
- `npx tsc --noEmit` — typecheck (existem 2 erros pré-existentes em `app/teste/page.tsx` linhas 1122 e 2209 — sem impacto runtime)
- `npx supabase db pull` — sincronizar schema

## Estrutura de pastas

```
app/
  dashboard/            # área autenticada
    page.tsx            # home com stats + datas comemorativas
    criar/              # wizard 3-step (Formato → Modo → Ideia)
      page.tsx
      post-unico/       # wizard antigo (ainda usado em links)
      ia/               # wizard carrossel (legacy)
    inspiracoes/        # catálogo de 12 ideias prontas
    calendario/         # mensal, pautas em localStorage
    jornada/            # XP, missões, ranking (localStorage)
    comunidade/         # stub "em breve"
    posts-unicos/       # biblioteca de posts gerados
    projetos/           # carrosséis salvos
    marcas/             # brand management
    templates/          # catálogo de templates
  api/
    post-unico/
      generate/         # POST — template mode (Claude + Flux)
      free-generate/    # POST — skeleton mode (Claude + Flux)
      image/            # POST — regen foto (Flux ou Unsplash 1)
      unsplash/         # POST — busca Unsplash grid (12 thumbs)
    refine-prompt/      # POST — expande briefing em prompt estruturado
    teste-gerar/        # POST — gera carrossel completo
    projects/generate/  # POST — gera + salva no banco
  teste/
    page.tsx            # sandbox sem persistência (carrossel + post-único)
                        # tem o editor canva-like (drag, font, cor)
  actions/              # Server Actions (mutations)

components/
  dashboard/            # sidebar, top-bar, cards do dashboard
    floating-mascot.tsx # chatbot lateral com dicas
    proximas-datas-card.tsx
  single-posts/         # tudo de post único
    editor.tsx
    post-preview.tsx    # renderer pros templates hardcoded
    free-post-renderer.tsx # renderer pros FreePostSpec (skeleton)
    fonts.ts            # 8 next/font (playfair, inter, anton, bebas, ...)
    templates/          # 20+ templates hardcoded por categoria
    shared/             # HandlePill, BrandHeader, etc
  carousel/             # SlidePreview + EditorialSlideRouter (carrossel)
  templates/editorial/  # 9 layouts editoriais (capa, problema, demo, ...)
  ui/                   # shadcn primitives (Button, Input, Dialog, ...)

lib/
  single-posts/
    skeletons.ts        # 8 skeletons free-form (DSL FreePostSpec)
    catalog.ts          # registry dos 20+ templates curados
    free-spec.ts        # DSL types: FreeBlock (text/image/pill/shape/stack/...)
    free-generate.ts    # Claude prompt + pipeline pro skeleton mode
    generate.ts         # Claude prompt + pipeline pro template mode
    font-presets.ts     # 8 presets de fonte (Inter, Playfair, Anton, ...)
    palette.ts          # buildPalette a partir das cores da marca
    queries.ts          # CRUD de single_posts
    types.ts            # PostBrand, PostContent, PostTemplateMeta
  generation/
    claude.ts           # generateContent (carrossel) + analyzeBrand
    fal.ts              # generateImage (Flux Schnell)
    nano-banana.ts      # Nano Banana Pro
    unsplash.ts         # searchUnsplash (1) + searchUnsplashMulti (12)
  editorial/
    ai-content.ts       # prompts do carrossel editorial (9 layouts)
    ai-images.ts        # geração de imagens dos slides editoriais
  data/queries.ts       # queries do dashboard (profile, brands, projects)
  inspiracoes.ts        # catálogo de 12 inspirações
  jornada.ts            # sistema de XP, níveis, missões (localStorage)
  pautas.ts             # CRUD de pautas (localStorage)
  datas-comemorativas.ts # 32 datas BR hardcoded
  active-brand.ts       # marca ativa via cookie
  brand-colors.ts       # gradient determinístico por brand_id
  supabase/             # browser + server clients

supabase/migrations/
  0001 a 0008_*.sql     # schema do banco

referencias-v2/posts-unicos/  # specs YAML + imagens referência (dev only)
public/refs-posts-unicos/     # mesmas imagens, servidas em runtime
telas/                        # PDFs/PNGs do BestContent AI (competitor, referência UX)
```

## Identidade SyncPost

**Nome:** SyncPost (rename parcial — `package.json` e repo ainda "instapost"/"Saas-Instapost").

**Paleta oficial** (NUNCA inventar outras cores):
- Roxo: `#7C3AED`, `#A78BFA`, `#DDD6FE`
- Preto profundo: `#0A0A0F`
- Cinza/bege: `#F5F2EC`
- Branco: `#FFFFFF`
- Lime accent: `#D1FE17`

❌ **Proibido:** rosa, blue, fuchsia, sépia, navy. O sistema de tokens em `app/globals.css` já cobre.

**Tom de copy** (Wieden+Kennedy / Pentagram):
- Específico > genérico ("Você manda 27 propostas e fecha 3" > "Descubra como vender mais")
- 1 ideia por slide; subtitle tensiona o título, não repete
- Frases curtas com ritmo (title 6-9 palavras; body max 25 palavras)
- PT-BR coloquial culto

**Bandeira vermelha de IA — NUNCA usar:**
"Descubra", "Conheça", "Saiba mais", "Vem com a gente", "A solução que você procurava", "Transforme sua vida", "Faça parte", "Não perca", "Aproveite agora", "Vamos juntos", "Mude sua história", "O futuro é agora", "Você merece", "Imagine se".

**REGRA GLOBAL — contraste do destaque.** A cor de destaque (highlight/accent das palavras destacadas) NUNCA pode ficar ilegível sobre o fundo onde é renderizada. Marcas com paleta monocromática (ex: `#000000/#FFFFFF/#4A4A4A`) quebravam: preto virava accent e sumia em fundo escuro/foto. Todo renderer que aplica cor de marca sobre um fundo deve passar por `readableAccent()` de `lib/color-contrast.ts` (contraste WCAG ≥ 3:1 pro fundo em questão, com fallback branco/preto). Já aplicado em `components/carousel/slide-preview.tsx` (accent por família de layout: dark vs light). Ao criar template novo, escolha o accent com esse helper — nunca `brand_colors[0]` cru.

**Photo prompts — sem metáforas literais.** Tópico abstrato (separação OpenAI/Microsoft, "ruptura", "decisão") NUNCA gera "two ships drifting apart" / "broken chain" / "two paths diverging" / "puzzle pieces" / "lightbulb". Sempre concreto: prédio corporativo, sala de reunião, server room, retrato no contexto da profissão. Detalhes em `lib/single-posts/free-generate.ts` (SYSTEM_PROMPT).

## Os 3 produtos

### 1. Carrossel (5-10 slides 4:5 ou 9:16)

- Pipeline: Claude `generateContent()` → para cada slide, Flux (`ai`) ou Unsplash (`unsplash`) em paralelo → `SlidePreview` renderiza
- Templates visuais: `editorial` (Brandsdecoded), `cinematic` (Wesley Silva), `hybrid` (nmlss)
- Edição: modal `SlideEditorModal` (texto + regenerar imagem por slide)
- Code-path: `app/api/teste-gerar/route.ts` (sandbox) ou `app/api/projects/generate/route.ts` (com persistência)
- **Pendente:** sidebar editor no carrossel (task #68) — hoje só tem modal por slide

### 2. Post Único (1 slide 4:5)

**Dois modos:**

**a) Skeleton mode** (default, IA improvisa):
- Claude escolhe 1 de 8 skeletons (`lib/single-posts/skeletons.ts`) + preenche slots
- Skeleton retorna `FreePostSpec` (DSL com blocks: text/image/pill/shape/divider/icon/stack/card)
- Renderer: `components/single-posts/free-post-renderer.tsx`
- **Editor canva-like** (em `app/teste/page.tsx` modo "post-unico"):
  - Drag-to-move (todos blocos top-level — stacks auto-detacham no render via `useEffect`)
  - Font preset (8 fontes globais)
  - Por bloco: textarea, slider de tamanho (calc multiplier), align toggle, color picker, delete
  - Trocar foto: tabs Unsplash / IA (Flux) / Upload (data URL)

**b) Template mode** (curado, layout fixo):
- 20+ templates hardcoded em `components/single-posts/templates/` por categoria
- Cada um é um React component que recebe `{ brand, content, palette }`
- Categorias: Profissional, Beauty, Comercial, Empresa, Fitness, Informativo
- Registro em `lib/single-posts/catalog.ts` (`POST_TEMPLATES`)
- Renderer: `components/single-posts/post-preview.tsx` (switch sobre `templateId`)
- Editor: só campos editáveis (drag/font-scale NÃO funcionam — posições absolute hardcoded)

### 3. Stories (1 slide 9:16 ou carrossel 9:16)

- Mesmo motor do post-único, com `format="story"` → aspect-[9/16]
- Renderer respeita `format` prop em ambos `FreePostRenderer` e `PostPreview`

## Fluxo do usuário

```
/                              landing (não tocado nessa sessão)
└─ /dashboard                  home com stats + ProximasDatasCard
   ├─ /criar                   WIZARD 3-STEP (atualizado)
   │   1. Formato (Post Portrait / Carrossel / Stories Único/Carrossel)
   │   2. Modo (Objetivo + Abordagem + Como criar)
   │   3. Ideia + Refinar com IA → /teste com sessionStorage payload
   ├─ /inspiracoes             12 ideias filtráveis → preenche briefing
   ├─ /calendario              mês visual + pautas localStorage
   ├─ /jornada                 XP, missões, ranking (localStorage)
   ├─ /comunidade              stub
   ├─ /marcas                  CRUD de marcas
   ├─ /templates               catálogo (existente)
   └─ /posts-unicos            biblioteca

/teste                          SANDBOX (sem persistência)
                                Recebe sessionStorage:
                                  - syncpost_pending_generation (carrossel)
                                  - syncpost_pending_post_unico (post único)
                                  - syncpost_pending_inspiracao (vindo de /inspiracoes)
                                Auto-roda se autoRun=true.
                                Editor completo aqui (drag, font, cor).
```

## Convenções de código

**TypeScript strict.** Sem `any` (use `unknown` + narrowing).
**Server Components by default**, `"use client"` quando precisa de interatividade.
**Server Actions** (`app/actions/*.ts`) pra mutations no banco — não rotas API.
**API routes** só pra integração com IA (Claude, Flux, Unsplash).
**Não comente óbvios** — comente apenas o "porquê não-óbvio". Comments curtos.
**Não use emojis em código** (só copy de marketing/UI quando explicito).
**Não cria docs sem ser pedido.**

## O que está mockado (precisa migração quando virar produção real)

| Feature | Onde | Como migrar |
|---|---|---|
| Pautas do calendário | `localStorage.syncpost_pautas_v1` | Tabela `pautas` com `user_id`, `brand_id`, `data`, `status`, `formato`, `briefing` |
| XP/Jornada | `localStorage.syncpost_jornada_v1` | Tabela `user_xp_state` |
| Comunidade | Hardcoded em `/dashboard/comunidade/page.tsx` | Tabela `community_posts` |
| Inspirações | Hardcoded em `lib/inspiracoes.ts` | Tabela ou JSON estático servido |
| Datas comemorativas | `lib/datas-comemorativas.ts` | Tabela `datas_comemorativas` (i18n também) |
| "Marca Demo" fallback | `app/teste/page.tsx` linha ~285 e fitness-04 | Forçar brand real no wizard |

## Endpoints

| Path | Método | O que faz |
|---|---|---|
| `/api/teste-gerar` | POST | Gera carrossel completo (Claude + N imagens em paralelo) |
| `/api/post-unico/generate` | POST | Template mode (Claude + Flux 1x) |
| `/api/post-unico/free-generate` | POST | Skeleton mode (Claude escolhe skeleton + Flux) |
| `/api/post-unico/image` | POST | Regen 1 imagem (Flux OU Unsplash 1) |
| `/api/post-unico/unsplash` | POST | Busca grid de 12 thumbs Unsplash |
| `/api/refine-prompt` | POST | Expande briefing em estrutura (Objetivo/Tom/Hook/Pontos/CTA/Direção Visual) |
| `/api/projects/generate` | POST | Carrossel com persistência |
| `/api/brand-analyze` | POST | Extrai brand de URL (scraper + Claude analyze) |

## Banco (Supabase)

Schema em `supabase/migrations/*.sql`. Principais tabelas:

- `profiles` (1:1 com auth.users) — créditos, plano
- `brands` — multi-tenant; `brand_colors[]`, `instagram_handle`, `tone_of_voice`, `visual_style`
- `projects` — carrosséis salvos
- `slides` — slides do carrossel
- `single_posts` — posts únicos salvos (0008)
- `templates` — registry de templates (legacy)

RLS habilitado em todas tabelas com user-scoped.

## Pendências conhecidas

- **#68** Editor sidebar no carrossel (hoje só modal por slide)
- **#56** Migração localStorage → Supabase (calendário, jornada)
- Comunidade real (hoje stub)
- 2 erros TypeScript pré-existentes em `app/teste/page.tsx` (linhas 1122 — `template === "cinematic"` em branch morta; 2209 — `ApiSlide.image.prompt/cost` faltando no spread). Sem impacto runtime.

## Decisões de design importantes

1. **`/teste` é sandbox descartável.** Geração pública sem persistência. O wizard `/dashboard/criar` redireciona pra `/teste` via sessionStorage. Quando for "criar de verdade" usaremos `/dashboard/criar/post-unico` → `/api/projects/generate`.

2. **Skeletons vs Templates.** Skeleton dá flexibilidade (IA improvisa, editor canva-like funciona). Templates curados são pixel-perfect mas inertes (sem drag/font-scale). Default é skeleton.

3. **Auto-detach de stacks.** Quando spec é gerado, `useEffect` mede DOM e converte stack-children em blocks top-level absolutos, preservando posição visual. Resultado: itens já vêm "soltos" pro user arrastar individualmente.

4. **Font preset via `<style>` scoped.** Pra fontes do carrossel rodarem em templates hardcoded, injeto CSS sobrescrevendo `playfair.className` (next/font auto-gerada) via wrapper `.font-preset-scope`. Permite usuário trocar Bebas Neue/Anton/etc em qualquer template/skeleton sem refactor.

5. **Prompts anti-IA-ism.** SYSTEM_PROMPTS em todos arquivos de geração têm seção explícita proibindo chavões de marketing genérico. Photo prompts proíbem metáforas literais. Isso é a diferença entre output "ok" e output que para o scroll.

## Pra outra IA: pontos de partida sugeridos

- **Adicionar template novo**: copie um template existente em `components/single-posts/templates/<categoria>/XX-Nome.tsx`, registre em `lib/single-posts/catalog.ts` e `components/single-posts/post-preview.tsx` (switch).
- **Adicionar skeleton novo**: novo `SkeletonImpl` em `lib/single-posts/skeletons.ts`, push no array `SKELETONS`. IA detecta automaticamente.
- **Mexer em prompts**: 4 arquivos — `lib/single-posts/{free-generate,generate}.ts`, `lib/generation/claude.ts`, `lib/editorial/ai-content.ts`.
- **Adicionar página no dashboard**: `app/dashboard/<nome>/page.tsx` + entry em `components/dashboard/sidebar.tsx` (array `navigation`).
- **Backend novo**: prefira Server Action em `app/actions/*.ts` se for mutation. API route só pra IA/integração externa.

## Memória persistente (Claude Code)

Se você é Claude Code com auto-memory, há um diretório `~/.claude/projects/<hash>/memory/` com `MEMORY.md` index + arquivos individuais. Lá tem notas tipo "user prefere PT explicado", "paleta sem rosa", "cleanup ao excluir template", etc. Vale ler se for o caso.

## Contato com o dono

- Email: marcosodpor@gmail.com
- Comunicação: PT-BR, explicações por etapa, pausas pra ações externas (compra de domínio etc).
- Workflow preferido: 1 task em foco, marcar como completed quando termina.
