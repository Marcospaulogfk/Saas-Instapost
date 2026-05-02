# Sistema Visual Premium Dark com Roxo Vibrante — SyncPost

> Briefing recebido em 2026-05-02 para redesign das telas internas.
> Adaptado pra Tailwind v4 (projeto atual) — variáveis em `@theme` no globals.css.

## Escopo
- **NÃO toque** na rota `/` (landing).
- **Mantenha** auth Supabase (server actions, react-hook-form, zod).
- Foque telas internas: login, cadastro, dashboard, editor, configurações.

## Paleta Sync
- background: `#0A0A0F` (DEFAULT), `#13131A` (secondary), `#1C1C26` (tertiary), `#252531` (quaternary)
- purple primary: `#7C3AED` (600), 50→950
- text: `#FFFFFF` (primary), `#A1A1AA` (secondary), `#71717A` (muted), `#52525B` (subtle)
- success `#10B981` · warning `#F59E0B` · danger `#EF4444` · info `#3B82F6`
- borders: `rgba(255,255,255,0.06|0.12)`, `rgba(124,58,237,0.4|0.6)`

## Typography
- display + body: Space Grotesk (300-700)
- mono: JetBrains Mono
- escala: hero 64, h1 48, h2 36, h3 24, h4 18, body 16, small 14, tiny 12

## Inspirações
- Linear, Vercel, Resend, Stripe Atlas + glows roxos cinematográficos.

## Componentes-chave
- Card glass + gradient + hover glow
- Button gradient roxo + shimmer + scale on hover
- Input com glow no focus
- AuroraBackground / Spotlight / SparklesField / MagneticButton / Card3D

## Animations
- shimmer, pulse-glow, float, aurora, sparkle, gradient-x
- fadeIn, fadeInUp, scaleIn, slideDown, magnetic

## Ordem
1. Setup foundation (globals + layout)
2. Componentes base/auxiliares
3. Auth pages (login + cadastro)
4. Dashboard (sidebar + home + layout)
5. Editor (`/dashboard/criar`)
6. Configurações
