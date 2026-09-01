-- =====================================================================
-- 0026_objetivo_uso.sql
-- Onboarding estilo Canva: depois de criar a conta, perguntamos "como você
-- vai usar o Nexus?" com cards clicáveis. A resposta é só segmentação (não
-- muda limite, plano nem preço) — por isso é TEXT livre, sem travar em plano
-- que o produto ainda vai evoluir.
--
-- Skippable por design (CEO, 01/09/2026): quem pula segue com null pra
-- sempre — a etapa nunca pode bloquear o cadastro. Por isso NOT NULL/DEFAULT
-- não fazem sentido aqui.
--
-- Aditiva e idempotente. Pode rodar em produção sem downtime.
-- =====================================================================

alter table public.users
  add column if not exists objetivo_uso text
    check (objetivo_uso is null or objetivo_uso in (
      'negocio',    -- "No meu negócio"
      'criador',    -- "Sou criador de conteúdo"
      'clientes',   -- "Para clientes (agência/freela)"
      'estudo'      -- "Estudo/curiosidade"
    ));

comment on column public.users.objetivo_uso is
  'Objetivo de uso declarado no onboarding (cards estilo Canva). Null = '
  'ainda não respondeu ou pulou a etapa — nunca bloqueia o cadastro.';

-- O grant amplo de UPDATE em public.users foi revogado na 0020 (guarda de
-- dinheiro/plano); esta coluna é só segmentação, sem risco financeiro, então
-- ganha grant específico — mesmo padrão de (email, trial_used) da 0020.
grant update (objetivo_uso) on public.users to authenticated;
