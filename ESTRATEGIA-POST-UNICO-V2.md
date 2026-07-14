# Estratégia — Post Único 2.0 (arte de IA + texto vivo)

> Escrito em 14/07/2026. Câmbio de referência R$5,20/USD (mesmo do
> ESTRATEGIA-MONETIZACAO.md). Complementa a rodada de feedback do cliente
> (FEEDBACK-CLIENTE-2026-07.md) — post único é a fraqueza atual do produto.

## 1. A tese

Os posts de rede social que o ChatGPT gera impressionam pela **arte/composição**
— mas o texto vem "chapado" em pixels: erra palavra em PT-BR, não usa a fonte
da marca e não é editável (corrigir uma vírgula = regenerar tudo e mudar tudo
junto). É exatamente por isso que "bate o olho e sabe que foi ChatGPT".

O SyncPost já tem o contrário: texto **vivo** (camadas reais, fonte da marca,
editor de mover/fonte/tamanho — o free-spec). O que falta é a arte.

**Arquitetura: gerar pronto → decompor.**
- **GPT Image 2 (OpenAI)** gera o POST COMPLETO — layout, texto, badges,
  tudo alinhado (é o que ele faz de melhor; não deixamos o Claude "chutar"
  posições de texto, que foi a fonte dos problemas de enquadramento no
  carrossel).
- **O software decompõe o resultado em camadas**: arte limpa (mesma imagem
  sem o lettering) + textos vivos reconstruídos nas MESMAS posições, na
  fonte mais próxima da biblioteca.
- **O editor é o mesmo que já existe** (mesmo padrão do carrossel): mover,
  redimensionar, trocar fonte, reescrever — sem regenerar nada por cima.

**Diferencial de mercado:** ninguém entrega "post que nasce pronto E vira
camadas editáveis". ChatGPT gera chapado (editar = regenerar e mudar tudo);
Canva edita mas não desenha por você. É o gap entre os dois — e é defensável
porque exige o pipeline inteiro (geração + arte limpa + OCR/visão +
renderer), não um prompt.

## 2. Pipeline técnico — GERAR PRONTO → DECOMPOR (revisado 14/07)

> ⚠️ Decisão do CEO: o risco real é o Claude errar posição de texto sobre uma
> arte que ele não vê (repetiria os problemas de enquadramento do carrossel).
> Então NÃO compomos do zero — o GPT-2 gera o post PRONTO (ele é ótimo em
> layout/alinhamento, ver exemplos de posts promocionais de pet shop) e nós
> **decompomos o resultado em camadas editáveis**. As posições vêm do próprio
> design gerado, nunca de chute do Claude.

```
briefing → Claude (copy) → GPT Image 2 gera o POST COMPLETO (com texto)
        → images/edits: "remova todo o texto, mantenha o design idêntico" → ARTE LIMPA
        → OCR (caixas precisas) + visão (cor/peso/hierarquia) no post original
        → free-spec: arte limpa no fundo + textos vivos NAS MESMAS coordenadas
        → editor free-spec (mover/editar/fonte) — igual ao carrossel
```

1. **Geração**: gpt-image-2 cria o post inteiro (badges, pills, telefone,
   produto…) a partir do copy do Claude + identidade da marca. É o design
   "alinhadinho" de referência.
2. **Arte limpa**: segunda passada no endpoint `images/edits` usando o post
   gerado como referência, com instrução de remover TODO o lettering
   mantendo o resto idêntico (input fidelity alta).
3. **Extração de layout**: OCR com bounding boxes (ex: Google Vision,
   centavos/imagem) dá texto + posição exata; Claude visão classifica cor,
   peso e hierarquia e mapeia pra fonte mais próxima da nossa biblioteca.
4. **Remontagem**: cada texto vira bloco do free-spec nas coordenadas
   extraídas (cqw), sobre a arte limpa. Reconstrução ~pixel-close e 100%
   editável no editor que já existe.
5. **Rede de segurança de produto**: o usuário escolhe **"Usar como está"**
   (post pronto original, pixel-perfect) ou **"Tornar editável"** (versão
   decomposta). Se a decomposição degradar num caso raro, ninguém fica na mão.
6. **Fonte não fica idêntica** (aproximamos com a biblioteca de fontes) —
   aceitável em layout promocional; é o preço da editabilidade.
7. **Inpainting ("ajustar por descrição") NÃO é o editor principal**: o
   gpt-image recria a imagem inteira a cada edit (drift nas outras áreas) e
   cada correção custa outra geração. No máximo, botão secundário da versão
   "como está".
8. **Modo referência (fase 2)**: cliente sobe foto real (produto, pessoa,
   logo) → endpoint `images/edits` com multi-referência compõe a arte EM
   VOLTA do asset real (produto de verdade dentro do design, como nos
   exemplos de pet shop). Ataca em cheio o feedback "importação de imagens dá
   retrabalho" e casa com a Biblioteca de imagens da marca (task pendente).
9. **Elementos transparentes (fase 2)**: GPT Image gera com fundo
   transparente → objetos/decorações viram **blocos de imagem móveis** no
   free-spec (tipo sticker). Arte deixa de ser só "fundo".

**Custo do fluxo completo (tier master):** 2 gerações high (~US$0,13×2) +
OCR/visão (~US$0,02) ≈ **US$0,28 ≈ R$1,45** — cabe nos 20 tokens do master
(receita R$1,94–3,14). Em qualidade média o fluxo inteiro sai por ~R$0,40.

## 3. Modelos e custos por geração

Preços oficiais (jul/2026); GPT Image cobra por token — valores por imagem
são aproximações do calculator oficial.

| Uso | Modelo | US$/img | R$/img |
|---|---|---|---|
| Imagem normal (fundo simples, foto) | Flux Schnell (Fal) | 0,003 | 0,02 |
| **Arte do post único (padrão)** | gpt-image-1.5/2 **medium** | ~0,034 | **~0,18** |
| **Arte premium / com referência** | gpt-image-2 **high** | ~0,13–0,21 | **~0,68–1,09** |
| **Premium carrossel (novo)** | **Nano Banana 2** (Gemini 3.1 Flash Image) | 0,08 Fal / 0,067 direto | **0,42 / 0,35** |
| Premium carrossel (atual, sai de cena) | Nano Banana Pro (Gemini 3 Pro Image) | 0,15 Fal / 0,134 direto | 0,78 / 0,70 |

Decisão do CEO (14/07): **premium do carrossel migra pra Nano Banana 2**
(mais barato; qualidade suficiente pra imagem de slide que leva texto por
cima). Passo imediato sem código: `FAL_NANO_BANANA_PRO_MODEL=fal-ai/nano-banana-2`
no Coolify. Carrossel premium de 7: **R$5,46 → R$2,91** (−47%); com Gemini
direta depois, R$2,44 (−55%).

- Batch API do Google (−50%) NÃO serve: assíncrono, o fluxo é interativo.
- gpt-image-1 (sem sufixo) está deprecando em out/2026 — usar 1.5 ou 2.

## 4. Tokens (proposta de reprecificação)

Hoje: texto=1 · imagem normal=5 · imagem pro=20. Com os custos novos:

| Ação | Tokens (proposta) | COGS | Receita/token* | Margem/ação |
|---|---|---|---|---|
| Texto (roteiro/legenda) | **1** (mantém) | R$0,06–0,12 | — | — |
| Imagem normal (Flux) | **5** (mantém) | R$0,02 | R$0,49–0,79 | ~96% |
| **Imagem premium (NB2 / GPT medium)** | **10** (antes 20) | R$0,18–0,42 | R$0,97–1,57 | **57–77%** |
| **Arte master (GPT high / referência)** | **20** | R$0,68–1,09 | R$1,94–3,14 | **44–65%** |

\* Receita/token por plano: Starter R$0,157 · Pro R$0,097 · Studio R$0,082.
Faixa mostrada = Pro→Starter.

Efeitos:
- Cliente Pro faz o **dobro** de conteúdo premium com o mesmo plano
  (carrossel de 7 premium: 140 → 70 tokens) — responde à percepção de
  "gasta demais" sem derrubar margem (ela até sobe, porque o COGS caiu mais).
- Nasce um **3º degrau** ("arte master" / referência) exclusivo Pro/Studio —
  novo gancho de upgrade no lugar do antigo "Nano Banana Pro".
- Trial continua só imagem normal.
- Gate no server como hoje (`lib/tokens.ts`): `imagePremium=10`,
  `imageMaster=20`, master exige plano Pro/Studio.

## 5. Fases

| Fase | O quê | Esforço | Depende de |
|---|---|---|---|
| **F0 — agora (ops)** | Recarregar saldo Fal (resolve o "forbidden") + env `FAL_NANO_BANANA_PRO_MODEL=fal-ai/nano-banana-2` no Coolify | 10 min | só o CEO |
| **F1a — Geração pura (MVP-0)** | Conta OpenAI (exige **KYC de organização**) + `OPENAI_API_KEY` · `lib/generation/openai-image.ts` · gpt-image-2 gera o post PRONTO a partir do copy + marca · "Usar como está" (salva/exporta) | ~1-2 sessões | F0 não bloqueia |
| **F1b — "Tornar editável" (o diferencial)** | Passada de arte limpa (`images/edits` remove texto) · OCR bounding boxes + visão → free-spec nas mesmas coordenadas · piloto medindo fidelidade da reconstrução antes de virar padrão | ~2-3 sessões | F1a |
| **F2 — Referência + elementos** | Upload de foto real → `images/edits` multi-referência (produto real dentro do design) · elementos PNG transparentes como blocos móveis · integra com Biblioteca de imagens da marca (migration `brand_images`, precisa OK) | ~2-3 sessões | F1a + migration |
| **F3 — Custo & tokens** | Migrar NB2 pra Gemini direta (1K) · reprecificar tokens (tabela §4) · atualizar pricing page/UI de plano | ~1-2 sessões | decisão de preço do CEO |

## 6. Riscos e decisões pendentes

1. **Fidelidade da decomposição**: a "arte limpa" pode alterar detalhes e a
   fonte reconstruída é aproximada. Mitigação: o post original "como está"
   fica sempre disponível; piloto na F1b mede a taxa de reconstrução boa
   antes do recurso virar padrão.
2. **Latência**: gpt-image high leva 30-60s (e o fluxo editável são 2
   passadas). Padrão = medium (rápido); high/decomposição só no tier master,
   com progresso visível na UI.
3. **KYC OpenAI**: verificação de organização é pré-requisito pro GPT Image
   — fazer cedo pra não travar a F1.
4. **Decisões do CEO**: (a) confirmar NB2 como premium do carrossel — F0;
   (b) aprovar tabela de tokens §4; (c) OK da migration `brand_images` (F2).
