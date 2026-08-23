// =====================================================================
// lib/tokens.ts
// Fonte única da verdade do sistema de TOKENS do Nexus Content.
//
// Regra única (TOKENS-INDICACAO-AFILIADOS-rev3.docx, decisões do Marcos em
// 22/08/2026):
//
//   "1 token = uma unidade de trabalho da IA. Texto é barato, imagem é cara,
//    editar é grátis. O plano recarrega todo mês e zera a sobra; bônus de
//    indicação e tokens avulsos não vencem. Ordem: plano → avulso → bônus.
//    Toda entrada e saída vira uma linha no extrato (token_transactions)."
//
// Tabela v2 (aprovada em 22/08):
//   - roteiro + legenda de CARROSSEL ........................  8 tokens
//       (era 4; o Sonnet custa R$0,28 por roteiro e 4 dava 26% de margem
//        no Pro. Fica em 8 MESMO que o teste cego troque o escritor:
//        "custos de API são relativos e podem aumentar, chutar pro alto".)
//   - texto do POST ÚNICO ...................................  4 tokens
//   - imagem de CAPA do carrossel (nano-banana simples) ...... 20 tokens
//   - arte do POST ÚNICO (nano-banana-2, mais caro) .......... 25 tokens
//   - imagem de slide de miolo (Flux Schnell) ................  2 tokens
//   - edição cirúrgica do bitmap ............................. 15 tokens
//   - pautas/inspirações além da cota grátis .................  4 tokens
//   - editar no editor .......................................  0 (sempre)
//
// CALIBRAGEM: custo máximo de R$0,016 por token = 80% de margem bruta no
// plano mais apertado com o usuário queimando 100% dos tokens. Mexer num
// número aqui exige refazer essa conta (CUSTOS-IA-MARGEM-rev2.docx).
//
// Os campos de crédito do perfil continuam os mesmos, com semântica de
// baldes: `credits` = plano, `topup_credits` = avulso, `referral_credits` =
// bônus. O débito é ATÔMICO e escreve no extrato (RPC apply_tokens, migration
// 0020). Preço dos planos e ciclos: lib/billing/plans.ts.
// =====================================================================

/** Custo em tokens por tipo de ação. */
export const TOKEN_COST = {
  /** Roteiro + legenda do carrossel. Cobrado sempre, mesmo sem imagem. */
  textOnly: 8,
  /** Texto do post único (a arte é cobrada à parte, ver singlePostImage). */
  singlePostText: 4,
  /** Imagem de CAPA do carrossel (nano-banana simples, ~US$0,04). */
  imageCover: 20,
  /** Arte do post único (nano-banana-2, ~US$0,08). Papel de capa, modelo mais caro. */
  singlePostImage: 25,
  /** Imagem de slide de miolo — Flux Schnell, ~US$0,003. */
  imageSlide: 2,
  /** Edição cirúrgica do bitmap do post único (nano-banana /edit). */
  editBitmap: 15,
  /** Pauta/inspiração além das 3 grátis por dia. */
  ideas: 4,
} as const

/** O que o usuário marcou no wizard antes de gerar. */
export interface ImageChoice {
  /** Gerar a imagem da capa com IA. */
  cover: boolean
  /** Gerar imagem de IA em cada slide de miolo. */
  slides: boolean
}

/**
 * Quanto custa gerar um carrossel com as escolhas do usuário.
 * É esta função que alimenta o "vai custar N tokens" na tela de geração — o
 * preço nunca deve ser recalculado à mão em outro lugar.
 *
 * @param totalSlides total de slides do carrossel (capa inclusa).
 */
export function tokenCostForCarousel(
  totalSlides: number,
  choice: ImageChoice,
): number {
  const n = Math.max(1, totalSlides)
  let cost = TOKEN_COST.textOnly
  if (choice.cover) cost += TOKEN_COST.imageCover
  if (choice.slides) cost += TOKEN_COST.imageSlide * Math.max(0, n - 1)
  return cost
}

/** Planos disponíveis. `trial` = teste grátis (≈ 7 slides, ver §5). */
export type Plan = "trial" | "starter" | "pro" | "studio"

/** Qualidade de imagem que o usuário pode pedir. */
export type ImageQuality = "normal" | "pro"

/**
 * Tokens concedidos por mês em cada plano (grant recorrente).
 * O trial é um one-shot (~7 slides de imagem normal ≈ 40 tokens, §5).
 */
export const PLAN_TOKENS: Record<Plan, number> = {
  // 1 carrossel de 7 slides COMPLETO (4 texto + 25 capa + 6×2 miolo = 41),
  // com folga. O trial mostra o produto no melhor estado possível — custa
  // ~R$0,56 de COGS, o CAC mais barato do funil.
  trial: 45,
  starter: 300,
  pro: 1000,
  studio: 3000,
}

/**
 * Teto de MARCAS por plano.
 *
 * Mora aqui, junto dos outros números de plano, porque marca é o SEGUNDO eixo
 * de preço do produto (o primeiro é o token). O ICP é social media / agência
 * com 5–10 clientes: pra ele o que aperta não é token, é quantas marcas cabem
 * na conta — e é exatamente assim que o concorrente monetiza (1 / 5 / 20).
 *
 * Alinhamento com ESTRATEGIA-MONETIZACAO.md §4 (Starter 1, Pro 5):
 *  - trial   1 → o teste grátis mostra o produto com UMA marca; multi-marca é
 *                justamente o motivo de pagar.
 *  - starter 1 → plano do criador solo / dono de uma marca só.
 *  - pro     5 → a faixa do ICP (agência pequena, 5 clientes). É o degrau que
 *                converte: passou de 1 cliente, tem que subir pro Pro.
 *  - studio 20 → o doc de monetização dizia "ilimitadas"; virou teto numérico
 *                por dois motivos: (a) espelha o topo do concorrente (Max 20),
 *                que é o número com que o mercado já compara, e (b) "ilimitado"
 *                sem teto vira conta compartilhada entre agências e mata o
 *                upgrade. Pra voltar a ilimitado basta trocar por
 *                `BRAND_LIMIT_UNLIMITED` — os helpers já tratam Infinity.
 *
 * NÃO existe coluna de limite no banco: o teto é DERIVADO do plano (via
 * planFromProfile), então mudar de plano ajusta o limite sozinho.
 */
export const BRAND_LIMIT_UNLIMITED = Number.POSITIVE_INFINITY

export const PLAN_BRANDS: Record<Plan, number> = {
  trial: 1,
  starter: 1,
  pro: 5,
  studio: 20,
}

/**
 * Quantas marcas o plano permite. Aceita string desconhecida — o fallback é o
 * teto do trial (1), o mais restritivo: em dúvida, cobra o upgrade em vez de
 * liberar de graça.
 */
export function brandLimitFor(plan: string | null | undefined): number {
  if (!plan) return PLAN_BRANDS.trial
  return PLAN_BRANDS[plan as Plan] ?? PLAN_BRANDS.trial
}

/**
 * Ciclos e preços moram em lib/billing/plans.ts. Tokens por mês são os
 * mesmos em qualquer ciclo (decisão 22/08/2026: o desconto do anual mexe só
 * no preço, nunca no grant).
 */

/**
 * Quais planos podem usar Nano Banana Pro.
 * Starter e trial ficam na imagem normal (gancho de upgrade).
 */
export const PLAN_ALLOWS_PRO: Record<Plan, boolean> = {
  trial: false,
  starter: false,
  pro: true,
  studio: true,
}

/**
 * `true` se o plano pode gerar com Nano Banana Pro.
 * Aceita string desconhecida (fallback = false, seguro por padrão).
 */
export function canUseNanoBananaPro(plan: string | null | undefined): boolean {
  if (!plan) return false
  return PLAN_ALLOWS_PRO[plan as Plan] ?? false
}

/**
 * Custo em tokens de UMA imagem conforme o PAPEL dela no carrossel.
 *
 * O que decide o preço deixou de ser o plano do usuário e passou a ser o
 * slide: capa roda no modelo caro, miolo no barato — para todo mundo.
 */
export function tokenCostForRole(role: "cover" | "slide"): number {
  return role === "cover" ? TOKEN_COST.imageCover : TOKEN_COST.imageSlide
}

/**
 * Quanto custa gerar um POST ÚNICO (uma peça só, com imagem de IA).
 *
 * Reusa as MESMAS primitivas do carrossel — não existe preço próprio de post
 * único. A imagem dele tem papel de CAPA (é uma peça só, e é ela que para o
 * scroll), então roda no modelo caro e custa igual à capa de um carrossel:
 *
 *   singlePostText (4) + singlePostImage (25) = 29 tokens
 *
 * Como o custo é composto pelas mesmas parcelas da capa, a margem é idêntica
 * à dela por construção — a verificação de piso de 80% feita para o carrossel
 * continua valendo sem conta nova.
 *
 * Este é o TETO, usado no preview "vai custar N tokens" antes de gerar. O
 * débito real segue o que foi entregue de fato: se a foto vier do Wikimedia
 * (grátis) ou o Nano Banana cair pro Flux, cobra-se menos. Nunca mais.
 *
 * REGRA DE PRODUTO: editar o post depois de gerado é sempre GRÁTIS e
 * ilimitado. Cobra-se o pipeline de arte escolhido antes de gerar, nunca a
 * editabilidade — é exatamente o oposto do concorrente, onde cada correção
 * custa crédito e regenera o design do zero.
 */
export function tokenCostForSinglePost(): number {
  return TOKEN_COST.singlePostText + TOKEN_COST.singlePostImage
}

/**
 * COMPAT com a assinatura antiga (quality). Os endpoints de geração ainda
 * raciocinam em "normal x pro"; o mapa abaixo os liga na tabela nova sem
 * quebrar nada: "pro" = modelo caro (hoje a capa), "normal" = Flux.
 *
 * @deprecated Usar tokenCostForRole() quando os endpoints passarem a mandar
 * o papel do slide em vez da qualidade derivada do plano.
 */
export function tokenCostForImage(quality: ImageQuality): number {
  return quality === "pro" ? TOKEN_COST.imageCover : TOKEN_COST.imageSlide
}

/**
 * Imagem do POST ÚNICO: a arte roda no nano-banana-2 (mais caro que a capa
 * do carrossel), então "pro" aqui custa singlePostImage (25), não imageCover.
 */
export function tokenCostForSinglePostImage(quality: ImageQuality): number {
  return quality === "pro" ? TOKEN_COST.singlePostImage : TOKEN_COST.imageSlide
}

/**
 * Resolve a qualidade EFETIVA de imagem para um plano.
 * Se o usuário pediu "pro" mas o plano não permite, cai para "normal"
 * (nunca erro — degrada de forma graciosa). Gate server-side.
 */
export function resolveImageQuality(
  plan: string | null | undefined,
  requested: ImageQuality,
): ImageQuality {
  if (requested === "pro" && canUseNanoBananaPro(plan)) return "pro"
  return "normal"
}

/**
 * Deriva o plano a partir do perfil (`public.users`).
 *
 * NÃO existe coluna de plano explícita no schema — o plano é inferido de:
 *  - `subscription_status`: só "active" é pago; qualquer outro (trial,
 *    past_due, canceled, incomplete, null) cai para "trial".
 *  - `plan_credits_monthly`: o grant mensal de tokens mapeia o tier:
 *    3000+ → studio · 1000+ → pro · 300+ → starter · resto → trial.
 *
 * Seguro por padrão: qualquer estado inesperado retorna "trial" (Flux normal).
 */
export function planFromProfile(p: {
  subscription_status?: string | null
  plan_credits_monthly?: number | null
}): Plan {
  const status = p.subscription_status ?? "trial"
  if (status !== "active") return "trial" // só ativo é pago
  const m = p.plan_credits_monthly ?? 0
  if (m >= 3000) return "studio"
  if (m >= 1000) return "pro"
  if (m >= 300) return "starter"
  return "trial"
}

// ---------------------------------------------------------------------
// Mapa plano → tokens usado pela camada de cobrança (lib/billing) para o
// grant mensal. Aceita string desconhecida (devolve 0).
// ---------------------------------------------------------------------
export function planTokensFor(plan: string | null | undefined): number {
  if (!plan) return 0
  return PLAN_TOKENS[plan as Plan] ?? 0
}

// =====================================================================
// Débito de tokens — ATÔMICO, com linha no extrato.
//
// Chama a RPC `apply_tokens` (migration 0020): uma transação, ordem de
// consumo plano → avulso → bônus, tudo-ou-nada. Se não houver saldo, não
// debita nada e devolve ok=false (saldo_insuficiente).
//
// Continua best-effort do ponto de vista da geração: nunca lança. Os
// endpoints chamam dentro de try/catch e a geração segue mesmo que o débito
// falhe (decisão antiga: nunca travar o usuário por falha de cobrança).
//
// UMA linha por PEÇA (carrossel, post único, pauta), nunca por slide ou
// etapa interna (decisão 22/08/2026, seção 10.6 do doc).
// =====================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

export type DebitKind =
  | "debit_carousel"
  | "debit_single_post"
  | "debit_image"
  | "debit_edit_bitmap"
  | "debit_ideas"
  | "debit_other"

export interface DebitMeta {
  kind: DebitKind
  /** Tipo da peça (project, single_post, editorial, idea...). */
  refType?: string | null
  /** ID da peça — é o que deixa o extrato "abrir" a peça. */
  refId?: string | null
  /** Título humano da linha do extrato. */
  title?: string | null
  meta?: Record<string, unknown>
}

export interface DebitResult {
  ok: boolean
  /** Quantos tokens foram efetivamente debitados (0 ou `amount`). */
  debited: number
  error?: string
  /** Saldo total disponível quando faltou saldo. */
  available?: number
}

/**
 * Debita `amount` tokens do usuário numa única transação.
 *
 * @param client Supabase client (server ou admin) já autenticado.
 * @param userId UUID do usuário.
 * @param amount Total de tokens da peça.
 * @param meta   Tipo, referência e título da linha do extrato.
 *
 * Nunca lança.
 */
export async function debitTokens(
  client: SupabaseClient,
  userId: string,
  amount: number,
  meta: DebitMeta = { kind: "debit_other" },
): Promise<DebitResult> {
  if (!userId || amount <= 0) return { ok: true, debited: 0 }
  try {
    const { data, error } = await client.rpc("apply_tokens", {
      p_user_id: userId,
      p_amount: Math.round(amount),
      p_kind: meta.kind,
      p_ref_type: meta.refType ?? null,
      p_ref_id: meta.refId ?? null,
      p_title: meta.title ?? null,
      p_meta: meta.meta ?? {},
    })
    if (error) return { ok: false, debited: 0, error: error.message }
    const r = (data ?? {}) as { ok?: boolean; debited?: number; error?: string; available?: number }
    if (!r.ok) return { ok: false, debited: 0, error: r.error ?? "falha", available: r.available }
    return { ok: true, debited: r.debited ?? amount }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, debited: 0, error: message }
  }
}

/** Estorno (falha depois do débito): devolve pro balde do plano, com linha no extrato. */
export async function refundTokens(
  client: SupabaseClient,
  userId: string,
  amount: number,
  ref: { refType?: string | null; refId?: string | null; title?: string | null } = {},
): Promise<boolean> {
  if (!userId || amount <= 0) return true
  try {
    const { error } = await client.rpc("refund_tokens", {
      p_user_id: userId,
      p_amount: Math.round(amount),
      p_ref_type: ref.refType ?? null,
      p_ref_id: ref.refId ?? null,
      p_title: ref.title ?? null,
    })
    return !error
  } catch {
    return false
  }
}

// =====================================================================
// Leitura de SALDO: o outro lado do débito atômico.
//
// O débito é tudo-ou-nada: quem não tem o total NÃO é debitado. Como todo
// endpoint debita DEPOIS de gerar e nunca falha a resposta por causa de
// token, sem uma checagem ANTES da chamada cara o usuário sem saldo geraria
// de graça pra sempre. Estas funções existem só pra alimentar esse portão.
// =====================================================================

/**
 * Saldo TOTAL disponível (plano + avulso + bônus), lido direto do banco.
 * Existe porque o débito é atômico: quem não tem o total NÃO é debitado, e
 * sem esta checagem ANTES de gerar a peça sairia de graça.
 * Degrada sozinho se a migration 0020 ainda não rodou (cai nas colunas antigas).
 */
export async function getAvailableTokens(
  client: SupabaseClient,
  userId: string,
): Promise<number> {
  if (!userId) return 0
  try {
    const { data, error } = await client
      .from("users")
      .select("credits, topup_credits, referral_credits")
      .eq("id", userId)
      .single()
    if (error) {
      // Banco sem 0020 (ou sem 0014): usa só o balde do plano.
      const { data: legado } = await client
        .from("users").select("credits").eq("id", userId).single()
      return Math.max(0, (legado as { credits?: number } | null)?.credits ?? 0)
    }
    const p = data as { credits?: number; topup_credits?: number; referral_credits?: number }
    return Math.max(0, p.credits ?? 0) + Math.max(0, p.topup_credits ?? 0) + Math.max(0, p.referral_credits ?? 0)
  } catch {
    return 0
  }
}

/** `true` se o usuário tem saldo pra pagar `amount`. Usuário anônimo passa (rotas públicas cobram 0). */
export async function hasTokens(
  client: SupabaseClient,
  userId: string | null | undefined,
  amount: number,
): Promise<boolean> {
  if (!userId || amount <= 0) return true
  return (await getAvailableTokens(client, userId)) >= amount
}
