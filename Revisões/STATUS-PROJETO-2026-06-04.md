# Revisão de Status — SyncPost

> **Data da revisão:** 2026-06-04
> **Branch atual:** `feature/template-editorial`
> **Último commit:** `8aa91a1` — *feat: rebrand lime→roxo + onboarding novo + login antigravity + assets higgsfield* (2026-05-18)
> **Working tree:** limpo (nada pra commitar)
> **Autor desta revisão:** Claude Code (Opus 4.8)

---

## 1. Visão geral

**SyncPost** é um SaaS de geração de conteúdo para Instagram. O usuário descreve um briefing → a IA gera **copy + imagem + layout** de um post (único, carrossel ou stories). Inclui editor estilo Canva, calendário editorial, sistema de XP/gamificação, inspirações e gestão de marca multi-tenant.

- **Status geral:** MVP funcional. Algumas features ainda usam `localStorage` em vez de banco (ver §7).
- **Nome:** SyncPost (rebrand parcial — `package.json` ainda declara `"instapost"`; o `README.md` ainda fala "InstaPost").
- **Dono:** marcosodpor@gmail.com — comunicação em PT-BR, por etapas.

---

## 2. Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 16.2.4** (App Router + Turbopack) |
| UI | **React 19**, TypeScript strict |
| Estilo | **Tailwind CSS v4** + componentes shadcn-style em `components/ui/` |
| Backend | **Supabase** (Postgres + Auth + Storage) — sem ORM, queries diretas via `@supabase/supabase-js` |
| IA texto | **Anthropic Claude** (Sonnet 4.6 para conteúdo; Opus 4.7 para análise multimodal de marca) |
| IA imagem | **Fal.ai Flux Schnell** (`fal-ai/flux/schnell`) + **Nano Banana Pro** |
| Stock | **Unsplash API** |
| Export | `html-to-image` (PNG client-side) + `jszip` (lote) |
| Animação | `framer-motion` |
| Canvas | `konva` (presente nas deps; uso pontual) |

### Como rodar
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

---

## 3. Os 3 produtos

### 3.1 Carrossel (5–10 slides, 4:5 ou 9:16)
- Pipeline: Claude `generateContent()` → por slide, Flux (`ai`) ou Unsplash (`unsplash`) em paralelo → `SlidePreview` renderiza.
- Templates visuais: `editorial` (Brandsdecoded), `cinematic` (Wesley Silva), `hybrid` (nmlss).
- Edição: modal `SlideEditorModal` (texto + regenerar imagem por slide).
- Code-path: `app/api/teste-gerar/route.ts` (sandbox) ou `app/api/projects/generate/route.ts` (persistido).

### 3.2 Post Único (1 slide 4:5) — dois modos
- **Skeleton mode** (default): Claude escolhe 1 de 8 skeletons (`lib/single-posts/skeletons.ts`) e preenche slots → retorna `FreePostSpec` (DSL com blocks). Renderer: `components/single-posts/free-post-renderer.tsx`. **Editor canva-like funciona** (drag, font preset, cor, troca de foto).
- **Template mode** (curado): **20 templates hardcoded** em `components/single-posts/templates/` (Beauty, Comercial, Empresa, Fitness, Informativo, Profissional). Renderer: `post-preview.tsx`. Editor só edita campos (drag/font-scale não funcionam — posições absolutas).

### 3.3 Stories (9:16)
- Mesmo motor do post-único com `format="story"` → `aspect-[9/16]`. Ambos renderers respeitam a prop `format`.

---

## 4. Editorial (foco da branch atual `feature/template-editorial`)

O histórico recente da branch concentra-se no **template editorial** de carrossel:

- `components/templates/editorial/` — 9 layouts editoriais (capa, problema, demo, etc.).
- `lib/editorial/` — `ai-content.ts` (prompts dos 9 layouts), `ai-images.ts` (geração de imagens), `exporter.ts` (S3), `generator.ts`, `persistence.ts`.
- `app/dashboard/criar/editorial/` — interface de criação com componentes: `CarouselPreview`, `EditorPanel`, `ExportMenu`, `GenerationForm`, `ImageSlot`, `PromptsModal`.
- API: `app/api/editorial/{generate-stream,generate-image,regenerate-images,upload-image}/route.ts`.
- Sandbox de teste editorial: `app/teste/page.tsx` (capas + splits), `app/test-editorial/`, `app/test-editorial-ai/`.

Documentos de spec relacionados na raiz: `LAYOUT-SPEC.md`, `CORRECOES_TEMPLATE_EDITORIAL_V1.md`, `BRIEFING-EDITORIAL-1.md`, `SESSAO_2_FLEXIVEIS_IA.md`, `SESSAO_3_INTERFACE_EXPORT.md`.

---

## 5. Novidades do último commit (`8aa91a1`)

1. **Rebrand lime → roxo.** Paleta migrada de verde lime (`#D1FE17`) para roxo (`#7C5CFF` / `#7C3AED`) em todo o app via tokens em `globals.css` + 13 arquivos com hex hardcoded.
2. **Novo onboarding (7 telas).** Fluxo: entrada → análise IA → 5 passos (Objetivo / Marca / Público / Identidade / Estilo). Store em `localStorage`, tokens isolados em `.onb-root`. Páginas em `app/onboarding/*` + componentes em `components/onboarding-v2/`. Componentes legacy `components/onboarding/*` (v1) removidos.
3. **Login/cadastro "antigravity".** Showcase com 3 cards flutuantes + parallax 3D + partículas + avatares de criadores (`components/login/antigravity-showcase.tsx`).
4. **Dashboard sem bordas brancas.** Sidebar redesenhada, top-bar com fade gradient, header com saudação por hora + pill de créditos.
5. **`/dashboard/criar` com 4 mockups UI** screenshot dos formatos.
6. **Cascata de busca de logo** em `extract-url` (og:image → apple-touch-icon → header img → favicon → Clearbit) + análise multimodal de cores via Claude Opus 4.7.
7. **9 assets** gerados via higgsfield CLI (mockups, avatares, dashboard ambient).

---

## 6. Identidade & regras de conteúdo

### Paleta oficial (NUNCA inventar outras cores)
- Roxo: `#7C3AED`, `#A78BFA`, `#DDD6FE` (accent principal `#7C5CFF`)
- Preto profundo: `#0A0A0F`
- Cinza/bege: `#F5F2EC` · Branco: `#FFFFFF`
- ❌ **Proibido:** rosa, blue, fuchsia, sépia, navy.

### Tom de copy (Wieden+Kennedy / Pentagram)
- Específico > genérico; 1 ideia por slide; subtitle tensiona o título.
- Title 6–9 palavras, body ≤ 25 palavras. PT-BR coloquial culto.
- **Bandeira vermelha (NUNCA usar):** "Descubra", "Conheça", "Saiba mais", "Transforme sua vida", "Não perca", "Aproveite agora", "Você merece", etc.
- **Photo prompts sem metáforas literais** — sempre concreto (prédio corporativo, sala de reunião, retrato no contexto). Regras em `lib/single-posts/free-generate.ts`.

---

## 7. O que está mockado (precisa migração pra produção)

| Feature | Onde | Migração sugerida |
|---|---|---|
| Pautas do calendário | `localStorage.syncpost_pautas_v1` | Tabela `pautas` |
| XP / Jornada | `localStorage.syncpost_jornada_v1` | Tabela `user_xp_state` |
| Comunidade | Hardcoded em `/dashboard/comunidade` | Tabela `community_posts` (hoje é stub) |
| Inspirações | Hardcoded em `lib/inspiracoes.ts` (12 ideias) | Tabela ou JSON estático |
| Datas comemorativas | `lib/datas-comemorativas.ts` (32 datas BR) | Tabela `datas_comemorativas` |
| Onboarding v2 | `localStorage` (store) | Persistir em `brands`/`profiles` |
| "Marca Demo" fallback | `app/teste/page.tsx` | Forçar brand real no wizard |

---

## 8. Banco de dados (Supabase)

Migrations em `supabase/migrations/` (0001 → 0008):

| Migration | Conteúdo |
|---|---|
| `0001_initial_schema` | Schema base |
| `0002_trigger_new_user` | Trigger de novo usuário |
| `0003_rls_policies` | Políticas RLS |
| `0004_credit_functions` | Funções de crédito |
| `0005_multi_format_projects` | Projetos multi-formato |
| `0006_editorial_carousels` | Carrosséis editoriais |
| `0007_editorial_uploads_bucket` | Bucket de uploads editoriais |
| `0008_single_posts` | Posts únicos |

**Tabelas principais:** `profiles` (1:1 com `auth.users`, créditos/plano), `brands` (multi-tenant, cores/handle/tom/estilo), `projects`, `slides`, `single_posts`, `templates` (legacy). **RLS habilitado** em todas, user-scoped.

---

## 9. Endpoints (API routes)

| Path | Método | Função |
|---|---|---|
| `/api/teste-gerar` | POST | Gera carrossel completo (Claude + N imagens) |
| `/api/post-unico/generate` | POST | Template mode (Claude + Flux) |
| `/api/post-unico/free-generate` | POST | Skeleton mode |
| `/api/post-unico/image` | POST | Regen 1 imagem (Flux ou Unsplash) |
| `/api/post-unico/unsplash` | POST | Grid de 12 thumbs Unsplash |
| `/api/refine-prompt` | POST | Expande briefing em estrutura |
| `/api/projects/generate` | POST | Carrossel com persistência |
| `/api/editorial/generate-stream` | POST | Geração streaming do editorial |
| `/api/editorial/generate-image` | POST | Imagem de slide editorial |
| `/api/editorial/regenerate-images` | POST | Regenera imagens editoriais |
| `/api/editorial/upload-image` | POST | Upload de imagem |
| `/api/onboarding/analyze` | POST | Análise de marca via URL (scraper + Claude) |

---

## 10. Saúde do código (typecheck)

`npx tsc --noEmit` retorna **erros pré-existentes** (sem impacto runtime conhecido):

1. `app/teste/page.tsx:1122` — comparação `"cinematic"` vs `"editorial"` sem overlap (branch morta).
2. `app/teste/page.tsx:2209` — `ApiSlide.image` faltando `prompt/unsplashQuery/ms/costUsd` no spread.
3. `components/templates/editorial/shared/BodyText.tsx:60` — flag de regex `/s` exige target `es2018+` (ajustar `tsconfig`).
4. `lib/editorial/ai-images.ts:57` — `string` não atribuível ao union de `image_size` do Fal.

> ⚠️ **Recomendação:** itens 3 e 4 são fáceis de resolver e tocam o editorial (foco da branch). Vale priorizar antes do merge para `main`.

---

## 11. Pendências conhecidas

- **#68** — Editor sidebar no carrossel (hoje só modal por slide).
- **#56** — Migração `localStorage` → Supabase (calendário, jornada, onboarding v2).
- **Comunidade** real (hoje stub "em breve").
- **Rebrand de nome** — `package.json` (`"instapost"`) e `README.md` ainda usam o nome antigo. "Insta" é marca da Meta; trocar antes do lançamento.
- **4 erros de typecheck** listados em §10.

---

## 12. Estrutura de pastas (resumo)

```
app/
  dashboard/         área autenticada (criar, inspirações, calendário,
                     jornada, comunidade, marcas, templates, projetos,
                     posts-unicos, editorial, configuracoes)
  onboarding/        fluxo v2 de 7 telas
  api/               rotas de IA/integração (editorial, post-unico, ...)
  teste*/            sandboxes sem persistência (carrossel/post/editorial)
  login, cadastro, recuperar-senha, pricing, editor

components/
  dashboard/         sidebar, top-bar, cards
  single-posts/      editor, renderers, 20 templates, fonts, shared
  carousel/          SlidePreview + EditorialSlideRouter
  templates/editorial/  9 layouts editoriais
  onboarding-v2/     telas/passos do onboarding
  login/             antigravity-showcase
  ui/                shadcn primitives

lib/
  single-posts/      skeletons, catalog, free-spec, generate, palette
  generation/        claude, fal, nano-banana, unsplash
  editorial/         ai-content, ai-images, exporter, generator, persistence
  onboarding/        store + types
  supabase/          browser + server clients
  (jornada, pautas, inspiracoes, datas-comemorativas, active-brand, ...)

supabase/migrations/  0001 a 0008
design/               specs de onboarding + cadastro de marcas
telas/                PNGs/PDFs do BestContent AI (referência UX)
referencias-v2/       specs YAML + imagens referência (dev only)
```

---

## 13. Documentação existente na raiz

| Arquivo | Conteúdo |
|---|---|
| `CONTEXT.md` | Briefing principal pra IA/dev (base desta revisão) |
| `BLUEPRINT.md` | Documentação ampla do projeto |
| `LAYOUT-SPEC.md` | Spec de layout do editorial |
| `CORRECOES_TEMPLATE_EDITORIAL_V1.md` | Correções aplicadas no template editorial |
| `BRIEFING-EDITORIAL-1.md`, `BRIEFING-REDESIGN.md` | Briefings de design |
| `SESSAO_2_FLEXIVEIS_IA.md`, `SESSAO_3_INTERFACE_EXPORT.md` | Notas de sessão |
| `README.md` | Setup (desatualizado — ainda "InstaPost") |

---

## 14. Próximos passos sugeridos

1. **Fechar o editorial** (foco da branch): resolver erros de typecheck §10 itens 3–4 e validar o fluxo `generate-stream`.
2. **Merge `feature/template-editorial` → `main`** após o editorial estável.
3. **Atualizar `README.md`** e `package.json` para o nome SyncPost.
4. **Iniciar migração localStorage → Supabase** (#56) — começar por pautas/onboarding por serem dados de valor do usuário.
5. **Atualizar `CONTEXT.md`** (hoje em `dc9e875`; já está 1 commit atrás do HEAD).

---

*Documento gerado automaticamente a partir do estado do repositório em 2026-06-04. Para detalhes de implementação, consultar `CONTEXT.md` e os arquivos de spec na raiz.*
