# Handoff — Reformulação de design + agendamento (2026-07-14)

Fonte de contexto: plano aprovado + `DESIGN.md`. Roxo oficial único: **`#7320E6`**.

## O que foi feito

### A) Fonte da verdade de design
- **Novo `DESIGN.md`** na raiz (padrão awesome-design-md, 9 seções). É a fonte da verdade e
  supera os outros docs.
- Reconciliados: `Identidade Visual/IDENTIDADE-VISUAL.md` (roxo `#7C5CFF`→`#7320E6`,
  `#7C3AED`→`#5F14D6`, rgba alinhado), `CONTEXT.md` (paleta corrigida, lime removido do texto),
  `app/globals.css` (comentário marcando `--editorial-*` como exceção isolada de template).

### B) Agente de design
- **Novo `.claude/agents/design-system.md`** — subagente que lê o `DESIGN.md` e faz cumprir as
  regras (sem glow/gradiente/lime, acento único, hairlines, + as 3 regras globais de imagem).
  Usado no sweep abaixo. Invocável como agente daqui pra frente.

### C) Sweep visual do app autenticado (`.dashboard-root`)
Removidos gradientes/glows do design antigo em: `criar/ia/{page,wizard}`, `criar/post-unico/*`,
`criar/editorial/{page,GenerationForm}`, `criar/page`, `marcas/[id]/brand-detail`, `comunidade/page`.
- `bg-gradient-brand`+`shadow-glow` → superfície chapada + hairline.
- orbes de glow (`bg-purple-600/15 blur-3xl`, `bg-gradient-to-br ... violet-900`) → removidos/achatados.
- `purple-*`/`violet-*` crus → `brand-*` / `border-accent`.
- fallback de cor de marca `#7C3AED` → `#7320E6` (carrossel, criar, wizard, brand-detail, EditorPanel).
- `gradient-text` **não** foi tocado (já é neutralizado por CSS em `dashboard.css`).
- Nota: `bg-lime`/`text-lime` **renderizam roxo** (`--lime` é alias de `#7320E6`) — conformes, nome legado.

### D) Agendamento — unificação do planejamento
- **Nova migration `0012_scheduled_posts_planning.sql`**: adiciona `scheduled_time time`, amplia
  status (`+publicado,+falhou`), índice `(scheduled_date, scheduled_time)`.
- `lib/planejar.ts`: tipo `ScheduledPost.scheduled_time`, novos status + cores/labels.
- `app/actions/scheduled-posts.ts`: `createScheduledPost` aceita `scheduledTime`/`status`;
  `listScheduledPosts` ordena por data+hora.
- `app/dashboard/calendario/page.tsx`: **reescrito pra ler UMA fonte só (banco)**. Acabou a divisão
  banco vs localStorage. Input de **data + hora**. Copy honesto ("Agendado = planejado; publicação
  automática ainda em configuração"). Banner Linear (sem gradiente).
- `lib/pautas.ts`: marcado DEPRECADO (só `gerarPautasIA` segue em uso, mapeado pra `saveEditorialPlan`).

## ⚠️ AÇÃO NECESSÁRIA

1. **Aplicar a migration `0012` no banco.** Sem ela, o calendário lista vazio e criar pauta dá erro
   (o código degrada com segurança, mas o recurso só funciona com a coluna). Dev/local pode aplicar;
   **produção só com seu OK** (regra do CEO).
2. **Refresh no browser do dashboard** — havia um módulo stale (`stats-grid.tsx`) no HMR; o arquivo
   em disco está correto (`tsc` passa), só recarregar.

## Verificação feita
- `tsc --noEmit`: sem erros novos (3 erros são pré-existentes: `app/teste`, `BodyText`, `ai-images`).
- Rotas compilam no dev (`/login` 200; `/dashboard/*` 307 → redirect de auth, sem 500).

## Follow-ups (fora do escopo desta rodada)
- **Auto-publish real** (o que "agendar de verdade" exige): worker/cron (Vercel Cron `vercel.json`
  ou Supabase `pg_cron`+Edge Function) que leia posts com data/hora vencida e chame `publishCarousel`;
  `scheduled_at timestamptz` definitivo; vínculo post↔`instagram_connection`; refresh de token
  (ver `INSTAGRAM_PENDENTE.md`). Depende do desbloqueio da Meta (App Review).
- **Violações menores restantes** (sinalizadas pelos agentes, não corrigidas): gradientes/`radial-gradient`
  decorativos nos previews de template do `criar/ia/wizard.tsx`; `bg-gradient-card`+`backdrop-blur-xl`
  (glass) em empty-states; `bg-grid-purple/5` em `comunidade/page`; sombras inline `shadow-[0_0_8px_...]`
  com sintaxe rgba quebrada (`rgba(115, 32, 230,0.5)`). Rodar o agente `design-system` numa próxima passada.
- **Limpeza:** `styles/globals.css` (shadcn órfão, confirmar que não é importado) e sandboxes
  `app/teste*`/`app/test-*`/`app/preview-*`.
