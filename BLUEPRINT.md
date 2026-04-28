# InstaPost — Blueprint do Projeto

> **NOME DE TRABALHO**: InstaPost (atenção: "Insta" é marca da Meta — trocaremos por nome final antes do lançamento público)

## Quem você é
Você é o desenvolvedor principal deste projeto. Eu sou o fundador, não programo, mas tenho conhecimento técnico básico (terminal, git). Vou executar tarefas humanas (cadastros, configs, API keys) enquanto você cuida do código. **O frontend já está construído** (gerado via V0 da Vercel) — você precisa conectá-lo ao backend.

## Stack obrigatória
- Next.js 14 (App Router) + TypeScript ✅ já configurado
- Tailwind CSS + Shadcn/UI ✅ já configurado
- Supabase (Postgres + Auth + Storage + Edge Functions) — A CONECTAR
- Stripe (assinaturas multi-plano e multi-ciclo, em BRL) — A INTEGRAR
- Anthropic Claude API (Sonnet 4.6 produção, Haiku 4.5 dev) — A INTEGRAR
- Fal.ai (Flux Schnell trial/Starter, Nano Banana 2 Pro/Studio) — A INTEGRAR
- Konva.js + react-konva (editor visual em camadas) — A IMPLEMENTAR
- Deploy: Vercel (free tier inicial)

## Como funciona o produto

### Fluxo 1: Geração com IA (recomendado)
Usuário cadastra → cria marca (IA extrai dados de URL via scraping + Claude Haiku) → escolhe **Criar carrossel** → escolhe **"Deixar IA criar pra mim"** → wizard de 4 passos:
1. **Tema** do carrossel (textarea)
2. **Objetivo** (Vender / Informar / Engajar / Comunidade)
3. **Tamanho** (5, 7 ou 10 slides)
4. **Confirmação** → Gera roteiro + imagens em paralelo
→ Editor Konva permite ajustar texto/posição/cor → exporta PNG 1080x1350 (Instagram retrato)

### Fluxo 2: Criação manual
Usuário escolhe **"Escrever manualmente"** → projeto vazio → editor Konva → digita textos slide a slide, gera só imagens via IA → exporta

## Modelo de camadas (CRÍTICO)
Cada slide é um sanduíche de 4 camadas:
1. **Fundo**: cor sólida (preto #000 default)
2. **Imagem IA**: gerada por Flux/Nano Banana, com gradient nas bordas para fusão suave
3. **Tipografia**: texto editável renderizado por código (Konva.Text), com palavra destacada em cor
4. **Overlays**: badges de perfil, indicadores de carrossel, CTAs, **logo da marca** (configurável)

A IA NÃO gera texto na imagem. Texto é sempre sobreposto via Konva.

## Frameworks de copywriting por objetivo

A IA aplica framework diferente conforme objetivo escolhido:

- **Vender** → AIDA (Atenção, Interesse, Desejo, Ação) com CTA forte no último slide
- **Informar** → Lista de tópicos com payoff educativo, autoridade
- **Engajar** → Pergunta provocativa + storytelling pessoal
- **Comunidade** → Vulnerabilidade + chamado a ação coletiva

## Banco de dados (Supabase)

### Tabelas
- `users` (profile + créditos + Stripe ID)
- `brands` (marcas do usuário, com `logo_url` no Storage)
- `projects` (carrosséis, com `creation_mode`: 'ai' ou 'manual', `objective`: 'sell'|'inform'|'engage'|'community')
- `slides` (slides individuais, com `editable_elements` JSONB)
- `subscriptions` (espelho do Stripe)

### RLS
Habilitado em todas. Trigger cria user com 2 créditos.

### Funções SQL críticas
- `consume_image_credit(user_id)` — lock atômico (SELECT FOR UPDATE)
- `refund_image_credit(user_id)` — rollback se Fal.ai falhar
- `reset_monthly_credits(user_id)` — reset mensal via Stripe webhook

## Lógica de créditos
- 1 crédito = 1 imagem gerada por Fal.ai
- Trial: 2 créditos vitalícios
- Plano: créditos resetam mensalmente
- SEMPRE debita ANTES de chamar API paga
- Rollback automático se falhar

## Planos (BRL)
- **Free Trial**: 2 imagens, 1 marca, marca d'água
- **Starter R$ 47/mês**: 50 imgs, 1 marca, Flux Schnell, marca d'água
- **Pro R$ 97/mês** ⭐: 200 imgs, 5 marcas, Flux + NB2, sem marca d'água
- **Studio R$ 247/mês**: 800 imgs, marcas ilimitadas, equipe, API

Ciclos: Mensal / Trimestral (-17%) / Semestral (-30%) / Anual (-40%)

Founder's Plan: R$ 497 vitalício, 100 vagas (acesso Pro pra sempre).

## Estrutura do projeto (já existente do V0)

```
instapost/
├── app/
│   ├── page.tsx                    # Landing page ✅
│   ├── layout.tsx                  # Layout raiz ✅
│   ├── pricing/page.tsx            # Página de preços ✅
│   ├── onboarding/page.tsx         # Wizard de cadastro de marca ✅
│   ├── editor/page.tsx             # Editor visual (placeholder Konva) ✅
│   └── dashboard/
│       ├── layout.tsx              # Layout com sidebar ✅
│       ├── page.tsx                # Dashboard home ✅
│       └── criar/
│           ├── page.tsx            # Escolha IA vs Manual ✅
│           ├── ia/page.tsx         # Wizard IA com objetivo ✅
│           └── manual/page.tsx     # Criação manual ✅
├── components/
│   ├── ui/                         # Shadcn components ✅
│   ├── dashboard/                  # Sidebar, top-bar, stats ✅
│   ├── onboarding/                 # Wizard steps (com upload de logo) ✅
│   └── editor/                     # Editor placeholder ✅
└── ...
```

## ⚠️ Arquivos/pastas que VOCÊ precisa criar

### 1. Cliente Supabase (`lib/supabase/`)
```
lib/supabase/
├── client.ts          # Cliente para uso no browser
├── server.ts          # Cliente para Server Components
└── admin.ts           # Cliente com service_role (Edge Functions only)
```

### 2. Edge Functions (`supabase/functions/`)
```
supabase/
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_rls_policies.sql
│   ├── 0003_credit_functions.sql
│   └── 0004_trigger_new_user.sql
└── functions/
    ├── extract-brand/         # Scraping + Claude Haiku
    ├── generate-script/       # Claude Sonnet roteiro
    ├── generate-images/       # Fal.ai paralelo
    └── stripe-webhook/        # Webhook handler
```

### 3. Storage Buckets
- `brand-assets` (logos das marcas, público com assinatura)
- `generated-images` (imagens IA, público com assinatura)
- `exports` (PNGs exportados, privado)

## Princípios de execução
1. Trabalhe em branches Git, faça commits pequenos e descritivos
2. SEMPRE me explica em português ANTES de fazer
3. Quando precisar de ação minha (cadastro, config, API key), pause e me diga EXATAMENTE o que fazer
4. NUNCA expõe API keys no client — sempre via Edge Functions
5. Implementa testes mínimos pra cada Edge Function
6. Mensagens de erro pro usuário em PT-BR e amigáveis
7. Mobile-first responsive

## Roadmap
- **Semana 1**: Setup + Supabase Auth + DB + RLS + deploy Vercel
- **Semana 2**: Conectar onboarding ao backend (extract-brand Edge Function)
- **Semana 3**: Pipeline de geração (generate-script + generate-images)
- **Semana 4-5**: Editor visual em camadas (Konva.js no `app/editor/page.tsx`)
- **Semana 5-6**: Stripe + paywall + lançamento

## Variáveis de ambiente (.env.local)

Ver `.env.local.example` na raiz. Todas obrigatórias antes do deploy.

## Histórico de modificações já feitas no frontend (V0)

1. ✅ Substituída tela inicial demo por landing real
2. ✅ Onboarding redireciona pra `/dashboard` após salvar marca
3. ✅ Adicionada rota `/dashboard/criar` com escolha IA vs Manual
4. ✅ Wizard IA em `/dashboard/criar/ia` com 4 passos (tema, objetivo, tamanho, confirmação)
5. ✅ Criação manual em `/dashboard/criar/manual`
6. ✅ Upload de logo no onboarding (review-step)
7. ✅ Sidebar com seletor de marca atual + logo
8. ✅ Nome trocado de PostFlow → InstaPost (provisório)
9. ✅ `.env.local.example` criado
10. ✅ Este BLUEPRINT.md

## Próximos passos imediatos (pra Claude Code)

1. Instalar dependência do Supabase: `npm install @supabase/supabase-js @supabase/ssr`
2. Criar `lib/supabase/{client,server,admin}.ts`
3. Criar primeira migration SQL (schema + RLS + trigger + funções)
4. Implementar autenticação (login/cadastro/recuperação)
5. Conectar onboarding ao Supabase (criar marca real)
6. Implementar Edge Function `extract-brand`

**Comece perguntando o que eu (fundador) preciso fazer primeiro: criar o projeto Supabase, configurar Auth, etc.**
