# SyncPost — Estratégia de Monetização (tokens, planos, afiliados, Cakto)

> Doc de decisão. Fonte: pesquisa de custos de 05/07/2026 (ver notas no fim).
> Números em **BRL**, câmbio **R$ 5,20/USD** (buffer sobre 5,17 real, porque todo custo de IA é em dólar).
> Status: **proposta pronta pra aprovar**. A implementação no código ainda não foi feita (ver §8).

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
6. **Afiliados:** **40% da 1ª fatura + 20% recorrente** nas renovações seguintes. Front-load na aquisição, recorrência que mantém o afiliado alinhado à retenção.
7. **Cakto:** produto de assinatura com **Pix recorrente como método principal** (0% de taxa vs 3,89% no cartão — é a maior alavanca de margem).

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

**Taxas Cakto** (confiança ALTA): Pix **0% + R$2,49** · Cartão **3,89% + R$2,49** · Boleto 4,99% + R$2,49 · Saque R$4,59. Sem mensalidade. → **Empurrar Pix recorrente.**

**Duas alavancas de redução de custo (futuro):**
- Migrar Nano Banana Pro do **Fal.ai (US$0,15)** para a **API Gemini direta (US$0,039 em 1K)** = ~4× mais barato. Maior alavanca de COGS se o volume crescer.
- **Prompt caching** no system prompt do Claude (o prompt é fixo entre gerações) corta ~90% do custo de input do texto.

---

## 3. Economia de tokens

**Ancoragem:** 1 token ≈ **R$ 0,04 de custo real**. A partir daí:

| Ação | Tokens | Custo real coberto |
|---|---|---|
| Texto (roteiro/legenda) sem imagem | 1 | R$ 0,04 (cobre R$0,06–0,12 do texto na média de uso) |
| 1 imagem **normal** (Flux/Nano normal) | **5** | R$ 0,20 |
| 1 imagem **Nano Banana Pro** | **20** | R$ 0,80 (≈ R$0,78) |
| Regerar imagem | = custo da imagem | — |
| Carrossel de 8 slides, todas premium | 8×20 = 160 | R$ 6,24 ⚠️ |

⚠️ **Decisão de produto importante:** definir se o carrossel gera **imagem por slide** ou **só na capa**. É a diferença entre custar ~R$1 e ~R$6 por carrossel. **Recomendo: 1 imagem por slide é opcional; padrão = capa + slides que o usuário marcar.** Isso protege a margem e evita carrossel "poluído" de imagem.

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

**Ciclos com desconto (já existem no código):** trimestral −17%, semestral −30%, anual −40%. O desconto anual (paga 12, −40%) é ótimo pra caixa e retenção — priorizar no checkout.

### Margem por plano (mensal, via Pix; net = preço − R$2,49)

| Plano | Receita líq. (Pix) | COGS pior caso (100% premium) | Lucro pior caso | Margem pior caso | Margem uso realista* |
|---|---|---|---|---|---|
| Starter | R$ 44,51 | 60 img normal = R$ 12,00 | R$ 32,51 | **73%** | ~77% |
| Pro | R$ 94,51 | 50 img Pro = R$ 39,00 | R$ 55,51 | **59%** | ~72% |
| Studio | R$ 244,51 | 150 img Pro = R$ 117,00 | R$ 127,51 | **52%** | ~70% |

\* Uso realista = mistura (texto + imagem normal + parte premium). A maioria não gasta 100% em premium.

> No **cartão** (3,89% + R$2,49) a margem cai ~2–4 pontos. Por isso o Pix recorrente é a decisão certa.

---

## 5. Teste grátis (ativar já)

- **1 carrossel de até 7 slides.** O limite é o *output* (7 slides), não um prazo de dias.
- **Só imagem normal** (Flux/Nano Banana normal). Nano Banana Pro fica bloqueado no trial — é o gancho pra converter em Pro.
- **Marca d'água** no export (igual Starter).
- **Custo máximo por trial:** 7 slides com imagem normal ≈ 7 × R$0,20 + texto = **~R$ 1,60 de COGS**. É o seu CAC de topo de funil — barato.
- **Anti-abuso:** 1 trial por e-mail + device; opcionalmente cartão no cadastro (Cakto permite), o que derruba fraude e melhora conversão trial→pago.

**Por que "7 slides" e não tempo:** o usuário sente o produto completo (um carrossel inteiro, ponta a ponta) sem uma janela de dias que pressiona ou expira sem uso. Terminou o carrossel de teste → precisa assinar pra fazer o próximo. Em tokens internos, 7 slides ≈ 40 tokens de trial.

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

A Cakto suporta **Pix recorrente para afiliados** (comissão a cada renovação) — usar isso.

---

## 8. Cakto — passo a passo do cadastro

> Conta externa. **Não executei** o cadastro (regra de não criar contas/entrar em serviços externos sem você). Segue o roteiro pra você fazer, na ordem:

1. **Criar o produto** "SyncPost" como **assinatura recorrente**.
2. **Criar 3 ofertas** (Starter/Pro/Studio) × ciclos (mensal, trimestral, semestral, anual) com os preços da §4 e descontos da §4.
3. **Ativar Pix recorrente** como método principal + cartão como secundário. (Pix = 0% de taxa.)
4. **Garantia de 7 dias** (já anunciada no site) na configuração da oferta.
5. **Top-ups** = produtos de **compra única** (order bump / upsell no checkout), valores da §6.
6. **Webhook Cakto → SyncPost:** configurar o webhook de "compra aprovada / assinatura renovada / cancelada" apontando pra um endpoint novo `/api/webhooks/cakto` que:
   - ativa/atualiza `subscription_status` do perfil,
   - credita os tokens do plano (`plan_credits_monthly`) e reseta o consumo do mês,
   - credita tokens de top-up quando for compra avulsa.
7. **Programa de afiliados:** ativar na Cakto com a estrutura da §7 (40% 1ª + 15% recorrente 12m), cookie 60–90d.

**Pendências de credenciais que travam pagamento** (do deploy): Stripe/Turnstile/Brevo ainda são placeholders no Coolify. Pra Cakto, o que importa é o webhook + as chaves da Cakto nas env vars.

---

## 9. O que falta implementar no código (roadmap)

O sistema de tokens **ainda não existe** — hoje o pricing mostra "imagens/mês" fixo (`components/pricing/pricing-cards.tsx`) e o perfil tem campos de crédito (`plan_credits_monthly`, `plan_credits_used_this_month`, `credits`) já no schema. Reaproveitar esses campos como "tokens".

Ordem sugerida (esqueleto antes da API, como sempre):
1. **Migration/tabela:** `token_ledger` (entradas: grant do plano, top-up, consumo) + saldo derivado no perfil. Ou reusar `plan_credits_*` renomeando a semântica pra token.
2. **Custo por ação:** tabela de custo (`TOKEN_COST = { textOnly:1, imageNormal:5, imagePro:20 }`) e débito nos endpoints de geração (`/api/post-unico/*`, `/api/teste-gerar`, editorial).
3. **Gate do Nano Banana Pro:** só habilitar se `plan ∈ {pro, studio}` (checagem no server, não só na UI).
4. **Teste grátis:** ao criar conta, creditar 100 tokens + flag trial (7 dias, imagem normal only, watermark).
5. **UI de saldo:** mostrar tokens no header/sidebar (já tem `credits` no layout), tela de "comprar mais / fazer upgrade" com o nudge da §6.
6. **Webhook Cakto** (§8.6) pra creditar tokens de verdade.
7. **Atualizar `pricing-cards.tsx`** de "X imagens/mês" para "X tokens/mês (≈ Y imagens)".

Isso é uma frente de engenharia grande (mexe em billing) — vale fazer **depois de você aprovar os números** desta proposta, porque cada número aqui vira constante no código.

---

## 10. Notas de confiança / riscos

- **Câmbio é o maior risco:** ±10%/ano é normal, e 100% do COGS é em USD. Todo número aqui usa R$5,20 (buffer). Reprecificar se passar de ~R$5,60.
- **Sonnet sobe 50% em set/2026** ($2→$3 in, $10→$15 out) — impacto pequeno (texto é barato), mas o custo do carrossel-texto vai de R$0,12 → R$0,19.
- **Fal vs Gemini direto:** Nano Banana Pro é ~4× mais barato na API Gemini direta. Migrar é a maior economia futura de COGS.
- **Taxas Cakto:** vieram do índice oficial da central (a página específica deu 404 no dia). Confirmar no painel antes de fechar.
- **Quantas imagens por carrossel** é a variável que mais mexe na margem — decidir isso (§3) é prioridade.
