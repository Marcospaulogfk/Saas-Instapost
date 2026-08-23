# SyncPost — Estratégia de Monetização (tokens, planos, afiliados, Asaas)

> Doc de decisão. Fonte: pesquisa de custos de 05/07/2026 (ver notas no fim).
> Números em **BRL**, câmbio **R$ 5,20/USD** (buffer sobre 5,17 real, porque todo custo de IA é em dólar).
> Status: **proposta pronta pra aprovar**. A implementação no código ainda não foi feita (ver §8).
> **Revisão 22/08/2026:** checkout do provedor anterior descartado. Pagamento passa pelo **Asaas** via camada neutra `lib/billing`; ciclos só mensal e anual; tabela de tokens v2; afiliados viram feature do app (§3, §7, §8, §9 reescritos).

---

## 1. TL;DR (as decisões)

1. **Trocar "imagens/mês" por TOKENS.** Token é a moeda única. Cada imagem "queima" tokens conforme a qualidade.
   - Imagem **normal** (Flux/Nano Banana normal) = **5 tokens**
   - Imagem **Nano Banana Pro** = **20 tokens** (4× mais cara de gerar → 4× mais tokens)
   - Texto sozinho (roteiro/legenda, sem imagem) = **1 token**
2. **Nano Banana Pro só nos planos Pro e Studio.** Starter e teste grátis usam imagem normal.
3. **Planos (mensal):** Starter R$47 = 300 tk · Pro R$97 = 1000 tk · Studio R$247 = 3000 tk.
4. **Teste grátis:** gera **1 carrossel de até 7 slides** (imagem normal, com marca d'água). O limite é o *output*, não o tempo — sem prazo de dias. Nano Banana Pro fica bloqueado; é o gancho do upgrade.
5. **Acabou o token:** oferecer **comprar pacote avulso (top-up)** OU **fazer upgrade**. Os pacotes são de propósito um pouco mais caros por token que a assinatura — assim o heavy user vê que **subir de plano compensa** (maximiza MRR).
6. **Afiliados:** **40% da 1ª fatura + 20% recorrente** nas renovações seguintes. Front-load na aquisição, recorrência que mantém o afiliado alinhado à retenção. O Asaas não tem programa de afiliados nativo: o programa é **feature do app** (candidatura por formulário, aprovação manual) e o repasse usa o **split de pagamento** do Asaas.
7. **Asaas:** checkout hospedado recorrente (Pix + cartão), criado por `app/actions/billing.ts`. Pix continua sendo o método a empurrar: R$1,99 fixo por cobrança (as 100 primeiras do mês grátis) contra 2,99% + R$0,49 no cartão.
8. **Ciclos:** só **mensal** e **anual** (anual = 30% de desconto no preço; os tokens por mês NÃO encolhem). Trimestral e semestral saíram.

**Margem bruta resultante (pior caso, 100% em imagem premium, via Pix):** Starter **73%** · Pro **59%** · Studio **52%**. Em uso realista (mistura de texto + imagem normal + premium) fica **70–77%**.

---

## 2. Custos reais (COGS) — a base de tudo

| Item | US$ | R$ (câmbio 5,20) | Fonte / confiança |
|---|---|---|---|
| Imagem **normal** (Flux Schnell / Nano Banana normal, ~1K) | 0,039 | **0,20** | Google/Fal — ALTA |
| Imagem **Nano Banana Pro** (Fal.ai, 1K/2K) | 0,15 | **0,78** | fal.ai — ALTA |
| Imagem Nano Banana Pro **4K** | 0,30 | 1,55 | fal.ai — ALTA (evitar 4K por padrão) |
| Texto de 1 **carrossel** (Claude Sonnet 5, ~2k in/2k out) | 0,024 | **0,12** | Anthropic — ALTA |
| Texto de 1 **post** (~1,5k in/0,8k out) | 0,011 | **0,06** | Anthropic — ALTA |
| Refino com busca web (grounding) | ~0,02 | ~0,10 | estimativa — MÉDIA |

**Insight-chave:** o texto é ruído no custo (R$0,06–0,12). **A imagem é 90%+ do COGS.** Otimize pela imagem, não pelo texto. O que decide o lucro é *quantas imagens premium* o usuário gera.

**Taxas Asaas** (tabela pública padrão, a confirmar na conta): Pix **R$1,99 por cobrança** (as 100 primeiras do mês são grátis) · Cartão **2,99% + R$0,49**. Sem mensalidade. → **Empurrar Pix recorrente.**

**Alavancas de redução de custo (corrigido em 14/07/2026 com preços oficiais):**
- ⚠️ CORREÇÃO: a API Gemini direta pro **Nano Banana Pro (Gemini 3 Pro Image)** custa **US$0,134** (1K/2K), não US$0,039 — o 0,039 é o preço do 2.5 Flash. Migrar direto no MESMO modelo economiza só ~11%.
- A alavanca real é **trocar o modelo premium pro Nano Banana 2 (Gemini 3.1 Flash Image)**: US$0,08 no Fal (via env `FAL_NANO_BANANA_PRO_MODEL=fal-ai/nano-banana-2`, zero código) ou US$0,067 na Gemini direta em 1K. Carrossel premium de 7 cai de R$5,46 → R$2,91 (Fal) / R$2,44 (direto). Ver ESTRATEGIA-POST-UNICO-V2.md §3.
- **Prompt caching** no system prompt do Claude (o prompt é fixo entre gerações) corta ~90% do custo de input do texto.

---

## 3. Economia de tokens

**Ancoragem:** 1 token ≈ **R$ 0,04 de custo real**. Tabela **v2** (22/08/2026), a que vale no código (`lib/tokens.ts`):

| Ação | Tokens |
|---|---|
| Roteiro do carrossel (texto) | 8 |
| Texto do post único | 4 |
| Capa do carrossel (arte) | 20 |
| Arte do post único | 25 (post único completo = 4 + 25 = **29**) |
| Slide de miolo | 2 |
| Edição cirúrgica do bitmap | 15 |
| Pautas | 4 cada, após 3 grátis por dia |
| Editar (texto, cor, posição, fonte) | **grátis**, sempre |
| Trial | 45 tokens |

**Regras do saldo:**
- O plano **recarrega** todo ciclo e **zera a sobra** do mês anterior.
- Tokens de **bônus de indicação** e **avulsos** não vencem.
- Ordem de consumo: **plano → avulso → bônus**.
- Extrato em `token_transactions` (migration 0020); débito atômico via RPC `apply_tokens`.

⚠️ **Decisão de produto importante:** o carrossel gera arte na capa por padrão; miolo custa 2 tokens por slide. É isso que mantém o carrossel em ~R$1 em vez de ~R$6. **Padrão = capa + slides que o usuário marcar.**

---

## 4. Planos (proposta)

| | **Starter** | **Pro** ⭐ | **Studio** |
|---|---|---|---|
| Preço/mês | **R$ 47** | **R$ 97** | **R$ 247** |
| Tokens/mês | **300** | **1.000** | **3.000** |
| ≈ imagens normais | 60 | 200 | 600 |
| ≈ imagens premium | — | 50 | 150 |
| **Nano Banana Pro** | ❌ | ✅ | ✅ |
| Marcas | 1 | 5 | ilimitadas |
| Marca d'água | sim | não | não |
| Extras | templates básicos, suporte email | templates exclusivos, sem marca d'água, suporte 12h | API, equipe 3 users, white-label, gerente dedicado |

**Ciclos:** só **mensal** e **anual** (−30% no preço, tokens por mês iguais). O anual é ótimo pra caixa e retenção — priorizar no checkout.

### Margem por plano (mensal, via Pix; net = preço − R$1,99, e zero nas 100 primeiras cobranças do mês)

| Plano | Receita líq. (Pix) | COGS pior caso (100% premium) | Lucro pior caso | Margem pior caso | Margem uso realista* |
|---|---|---|---|---|---|
| Starter | R$ 45,01 | 60 img normal = R$ 12,00 | R$ 33,01 | **73%** | ~77% |
| Pro | R$ 95,01 | 50 img Pro = R$ 39,00 | R$ 56,01 | **59%** | ~72% |
| Studio | R$ 245,01 | 150 img Pro = R$ 117,00 | R$ 128,01 | **52%** | ~70% |

\* Uso realista = mistura (texto + imagem normal + parte premium). A maioria não gasta 100% em premium.

> No **cartão** (2,99% + R$0,49) a margem cai ~2–3 pontos. Por isso o Pix recorrente é a decisão certa.

---

## 5. Teste grátis (ativar já)

- **1 carrossel de até 7 slides.** O limite é o *output* (7 slides), não um prazo de dias.
- **Só imagem normal** (Flux/Nano Banana normal). Nano Banana Pro fica bloqueado no trial — é o gancho pra converter em Pro.
- **Marca d'água** no export (igual Starter).
- **Custo máximo por trial:** 7 slides com imagem normal ≈ 7 × R$0,20 + texto = **~R$ 1,60 de COGS**. É o seu CAC de topo de funil — barato.
- **Anti-abuso:** 1 trial por e-mail + device; opcionalmente cartão no cadastro (o checkout do Asaas aceita), o que derruba fraude e melhora conversão trial→pago.

**Por que "7 slides" e não tempo:** o usuário sente o produto completo (um carrossel inteiro, ponta a ponta) sem uma janela de dias que pressiona ou expira sem uso. Terminou o carrossel de teste → precisa assinar pra fazer o próximo. Em tokens internos, o trial concede **45 tokens**.

---

## 6. Acabou o token: top-up vs upgrade

### Pacotes avulsos (top-up)

| Pacote | Preço | R$/token | Margem (Pix, pior caso premium) |
|---|---|---|---|
| +300 tokens | R$ 34 | 0,113 | ~63% |
| +800 tokens | R$ 79 | 0,099 | ~59% |
| +2.000 tokens | R$ 179 | 0,090 | ~56% |

**Regra de ouro:** o token do top-up é **sempre mais caro** que o token da assinatura (Pro = R$0,097/tk; Studio = R$0,082/tk). Assim quem compra top-up repetidamente é empurrado a **subir de plano** — melhor pra nós (vira MRR recorrente em vez de compra pontual).

### O nudge de upgrade (a "melhor viabilidade financeira")

No app, quando o usuário do **Pro** compra o **2º top-up no mesmo mês**, mostrar:

> "Você já comprou 1.600 tokens extras este mês (R$ 158). No **Studio** você teria 3.000 tokens por R$ 247 e ainda ganharia marcas ilimitadas e API. **Migrar sai mais barato por token.**"

Isso converte gasto avulso (margem ~58%, não recorrente) em **assinatura maior (recorrente, LTV muito maior)**. É a alavanca de receita mais importante depois do Pix.

---

## 7. Afiliados

**Modelo (aprovado):** **40% da 1ª fatura + 20% recorrente** em todas as renovações seguintes. Cookie de **60–90 dias**, cupom do afiliado tem prioridade sobre cookie (padrão de mercado).

O front-load (40% no 1º mês) premia a aquisição; os 20% recorrentes mantêm o afiliado interessado na **retenção** (ele perde comissão se o cliente cancela) sem inviabilizar a margem.

**Impacto no Pro (via Pix, COGS blended ~R$25):**
- Mês 1: comissão R$ 38,80 → lucro R$ 94,51 − 38,80 − 25 = **R$ 30,71** (positivo).
- Renovações: comissão 20% = R$ 19,40 → lucro R$ 94,51 − 19,40 − 25 = **~R$ 50/mês**.
- **LTV vs custo de afiliado:** com churn ~8%/mês (lifetime ~12,5 meses) e margem blended ~70%, o Pro contribui ~R$ 800+ de vida. O afiliado leva ~R$ 39 + ~R$ 19,40 × ~11,5 renovações ≈ **R$ 262** no total. **CAC via afiliado << LTV** → saudável, com margem ainda positiva em cada renovação.

**Como roda no Asaas:** não existe programa de afiliados nativo. O repasse usa o **split de pagamento** (`percentualValue` pra `walletId` de outra conta Asaas), que funciona em assinaturas, então a comissão recorrente sai automática a cada cobrança. O programa em si é **feature do app**: candidatura por formulário, aprovação manual, cada afiliado aprovado cadastra o `walletId` da própria conta Asaas. A flag fica **desligada em produção** por enquanto.

**Indicação (indique e ganhe)** é separada do afiliado: **100 tokens pro indicador e 45 pro indicado**, creditados no primeiro pagamento confirmado do indicado. Não acumula com comissão de afiliado.

---

## 8. Asaas — o que precisa estar configurado

> Conta externa. **Não executei** nada no painel (regra de não criar contas/entrar em serviços externos sem você). Checklist do que a camada `lib/billing` espera:

1. **Conta Asaas** com **cartão via API liberado** (pedir a liberação no painel; sem isso o checkout só aceita Pix).
2. **Chave de API** em `ASAAS_API_KEY` + `ASAAS_ENV` (`sandbox` ou `production`). Sandbox primeiro, produção só com OK explícito.
3. **Webhook** apontando pra `/api/webhooks/asaas`, com token de autenticação em `ASAAS_WEBHOOK_TOKEN`. Eventos habilitados: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`, `PAYMENT_SPLIT_DONE`, `CHECKOUT_PAID`, `SUBSCRIPTION_DELETED`.
4. **Checkout:** hospedado do Asaas (`POST /checkouts`, `RECURRENT`, Pix + cartão), criado em runtime por `app/actions/billing.ts`. Não existe produto pra cadastrar na mão: plano e ciclo vão no payload.
5. **Garantia de 7 dias** (já anunciada no site): reembolso manual via API/painel; o evento `PAYMENT_REFUNDED` cancela o plano sozinho.
6. **Top-ups** = cobrança avulsa, mesmo webhook.
7. **O que o webhook faz** (`app/api/webhooks/asaas` → `lib/billing/apply.ts`):
   - `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED`: concede o plano, recarrega os tokens do ciclo (zera a sobra), credita top-up quando for avulso e dispara a indicação (RPC `creditar_indicacao_no_pagamento`).
   - `PAYMENT_OVERDUE`: marca atraso com **5 dias de carência** antes de bloquear.
   - `PAYMENT_REFUNDED`: cancela o plano.
   - Job diário `app/api/cron/renovacao` como rede de segurança (renovação que o webhook perdeu, fim da carência).
8. **Afiliados:** split configurado por cobrança no payload do checkout (`split[].walletId` + `percentualValue`), só pra afiliado aprovado no app (§7).

**Pendências de credenciais que travam pagamento** (do deploy): Turnstile/Brevo ainda são placeholders no Coolify. Pro Asaas, o que importa é `ASAAS_API_KEY`, `ASAAS_ENV` e `ASAAS_WEBHOOK_TOKEN` nas env vars.

---

## 9. O que falta implementar no código (roadmap)

O sistema de tokens **ainda não existe** — hoje o pricing mostra "imagens/mês" fixo (`components/pricing/pricing-cards.tsx`) e o perfil tem campos de crédito (`plan_credits_monthly`, `plan_credits_used_this_month`, `credits`) já no schema. Reaproveitar esses campos como "tokens".

Ordem sugerida (esqueleto antes da API, como sempre):
1. **Migration/tabela:** `token_transactions` (migration 0020: grant do plano, top-up, bônus, consumo) + RPC `apply_tokens` pra débito atômico.
2. **Custo por ação:** tabela v2 da §3 em `lib/tokens.ts` e débito nos endpoints de geração (`/api/post-unico/*`, `/api/teste-gerar`, editorial).
3. **Gate do Nano Banana Pro:** só habilitar se `plan ∈ {pro, studio}` (checagem no server, não só na UI).
4. **Teste grátis:** ao criar conta, creditar 45 tokens + flag trial (imagem normal only, watermark).
5. **UI de saldo:** mostrar tokens no header/sidebar (já tem `credits` no layout), tela de "comprar mais / fazer upgrade" com o nudge da §6.
6. **Webhook Asaas** (§8.7) + `app/actions/billing.ts` (checkout) + cron `app/api/cron/renovacao`.
7. **Atualizar `pricing-cards.tsx`** de "X imagens/mês" para "X tokens/mês (≈ Y imagens)".

Isso é uma frente de engenharia grande (mexe em billing) — vale fazer **depois de você aprovar os números** desta proposta, porque cada número aqui vira constante no código.

---

## 10. Notas de confiança / riscos

- **Câmbio é o maior risco:** ±10%/ano é normal, e 100% do COGS é em USD. Todo número aqui usa R$5,20 (buffer). Reprecificar se passar de ~R$5,60.
- **Sonnet sobe 50% em set/2026** ($2→$3 in, $10→$15 out) — impacto pequeno (texto é barato), mas o custo do carrossel-texto vai de R$0,12 → R$0,19.
- **Fal vs Gemini direto:** Nano Banana Pro é ~4× mais barato na API Gemini direta. Migrar é a maior economia futura de COGS.
- **Taxas Asaas:** tabela pública padrão (Pix R$1,99, cartão 2,99% + R$0,49). Confirmar na conta antes de fechar, porque negociação por volume muda os números.
- **Quantas imagens por carrossel** é a variável que mais mexe na margem — decidir isso (§3) é prioridade.
