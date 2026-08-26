# Plano: Loop de Conversão Bitmap → Post Editável + Dataset de Destilação

> Criado em 26/08/2026. Contexto: hoje o post único de produção é gerado pelo
> nano-banana como bitmap (texto pintado na imagem, não editável). Este plano
> descreve o pipeline offline que converte cada bitmap gerado num FreePostSpec
> editável, alimenta uma biblioteca de templates e acumula um dataset para,
> no futuro, fine-tunar um modelo open source que substitua o composeSpec.

## A tese

1. Cada geração do nano-banana vira um dado (par bitmap → spec editável).
2. Um loop de agentes offline converte bitmap em spec com um juiz visual no meio.
3. Specs aprovados viram templates da biblioteca (valor imediato, sem esperar o treino).
4. Com volume (~500 a 2000 pares aprovados), fine-tune de um VLM open source
   (ex.: Qwen2.5-VL + LoRA) que recebe imagem + briefing e cospe FreePostSpec.
   Serving via Fal/Replicate. O custo de composição despenca; sobra copy + imagem.

Diferencial de mercado: o BestContent entrega bitmap não editável e cobra 6
créditos pra regenerar do zero a cada correção. Nós entregaríamos o mesmo nível
visual COM edição livre. Esse é o pitch, não "pioneiros mundiais em design-to-code"
(isso já existe em pesquisa); pioneiros no nosso nicho e formato, sim.

## O que JÁ existe no repo (~70% do loop)

| Peça | Onde | Status |
|------|------|--------|
| Bitmap de produção | `lib/single-posts/free-generate.ts` (`generateNanoBanana(prompt, "bitmap")`) | Em prod |
| Clean plate (fundo sem texto) | `free-generate.ts:289,306` (`editNanoBanana(CLEAN_PLATE_PROMPT, url)`) | Em prod |
| Agente extrator (visão mede o layout) | `lib/single-posts/extract-layout.ts::extractTextLayout` (`MeasuredText`) | Codado, desligado (`POST_UNICO_HIBRIDO = false`) |
| Compositor determinístico | `extract-layout.ts::buildSpecFromLayout(cleanUrl, items)` | Codado, desligado |
| Crítica programática de spec | `lib/single-posts/compose.ts::critiqueSpec` + patch `corrigir_blocos` | Em prod (loop do composeSpec) |
| Renderer spec → PNG | `components/single-posts/free-post-renderer.tsx` + `lib/single-posts/save.ts::renderSpecToPng` | Em prod (client-side) |
| DSL editável | `lib/single-posts/free-spec.ts` (8 tipos de bloco) | Em prod |
| Telemetria de custo | `lib/generation/usage-log.ts` | Em prod |

Por que o híbrido falhou inline e pode funcionar offline: no request path ele
tinha 1 tentativa, orçamento de 60s e nenhum juiz olhando o resultado. O loop
offline remove as três restrições: N tentativas, sem pressão de latência e
comparação visual lado a lado antes de aprovar.

## Fase 0 (P0, pré-requisito): persistir as gerações

Hoje a URL do Fal (`fal.media/...`) vai crua pro spec e NÃO é re-hospedada.
Ela expira. Sem isso não existe dataset.

- Nova tabela `post_generations` (ou similar): `id, single_post_id, brand_id,
  skeleton_id, briefing, content jsonb, photo_prompt, bitmap_url (storage),
  clean_plate_url (storage), cost_usd, model, created_at`.
- Re-hospedar bitmap + clean plate no bucket do Storage no momento da geração
  (reusar o caminho do `maybeUploadDataUrl` / `editorial-uploads`).
- Custo: uma migration + upload de 2 jpegs por geração. Decisão sem arrependimento.

## Fase 1: o loop de agentes (offline, fora de produção)

Roda como script batch / worker no VPS (ou cron), varrendo `post_generations`
pendentes. Começa como script Node rodado na mão (esqueleto antes da API).

```
bitmap + clean plate + content aprovado
        │
        ▼
[1] EXTRATOR      extractTextLayout(bitmap)          → MeasuredText[]   (já existe)
        │
        ▼
[2] COMPOSITOR    buildSpecFromLayout(clean, items)  → FreePostSpec     (já existe)
        │                                              + critiqueSpec como pré-filtro
        ▼
[3] RENDERIZADOR  spec → PNG headless                                   (FALTA)
        │         Playwright abre rota debug com FreePostViewer e screenshota
        ▼
[4] JUIZ          original vs render, lado a lado                       (FALTA)
        │         a) métrica objetiva: pixel-diff/SSIM por região de texto
        │         b) VLM (Claude visão): fidelidade de texto, posição, cor,
        │            contraste, "passaria por igual?" → score 0-100 + patches
        ▼
score ≥ X? ──não──► aplica patch no spec (padrão corrigir_blocos) e volta ao [3]
        │           (máx N tentativas; se esgotar, marca `failed` com o motivo)
        ▼ sim
[5] DATASET       grava par aprovado em `template_candidates`
                  (bitmap, clean, spec, score, tentativas, motivo de falha se houver)
        │
        ▼
FILA HUMANA       Marcos revisa os top-scored e promove pra biblioteca
```

Notas de desenho:

- O juiz VLM sozinho é leniente. A combinação métrica objetiva + VLM + spot-check
  humano é o que segura a régua. Nunca promover pra biblioteca sem olho humano
  no começo.
- Falhas sistemáticas do juiz são OURO: elas apontam exatamente qual vocabulário
  falta no renderer (gradiente em texto, textura, recorte orgânico...). O loop
  vira detector de gaps do DSL. Cada gap fechado no `free-spec.ts` aumenta a
  taxa de aprovação de TODO o backlog.
- Peça nova de infra: render headless. Rota debug tipo `/debug/render-spec?id=X`
  (atrás de auth/flag) + Playwright. É a única peça realmente nova além do juiz.

## Fase 2: biblioteca híbrida

- `template_candidates` aprovados + promovidos entram no catálogo
  (`lib/single-posts/catalog.ts` / `template-specs.ts` já têm a estrutura).
- UX: usuário escolhe template pronto da biblioteca (barato, instantâneo,
  editável) OU gera um novo do zero (nano-banana, mais caro). Os dois caminhos
  terminam no mesmo editor.
- Efeito colateral: o template pronto não gasta nano-banana nem composeSpec,
  só copy. Margem sobe antes mesmo de qualquer fine-tune.

## Fase 3: fine-tune (só quando o volume justificar)

- Formato do dado: entrada = imagem (bitmap) + briefing/content; saída = JSON
  `FreePostSpec`. É fine-tune de VLM (LoRA em Qwen2.5-VL ou similar), NÃO LoRA
  de modelo de difusão (difusão devolveria outro bitmap).
- Gatilhos pra começar: ≥500 pares aprovados E custo mensal de composeSpec
  relevante o bastante pra pagar treino + serving.
- Serving: Fal/Replicate serverless (o VPS Hetzner não tem GPU). Não é grátis,
  é mais barato por chamada que Claude. "Quase grátis" = custo de imagem + copy.
- O output do modelo passa pelo MESMO juiz da Fase 1 antes de chegar no usuário.

## Riscos e o que decide o sucesso

1. **Expiração da URL do Fal** mata o dataset antes de nascer → Fase 0 primeiro.
2. **Vocabulário do renderer** é o teto de fidelidade. Se o DSL não expressa o
   que o nano-banana desenha, nenhum agente resolve. Tratar os gaps apontados
   pelo juiz como backlog de P1 do `free-spec.ts`.
3. **Juiz frouxo** = biblioteca cheia de template mediano. Régua objetiva + humano.
4. **Custo do loop**: cada conversão gasta tokens (extração + juiz + retries).
   Estimar por item antes de rodar o backlog inteiro; começar com lote de 10-20.
5. **Prioridade**: isto é infra/margem, não aquisição. A meta de R$12k vem de
   venda. Fase 0 é barata e roda já; Fases 1-3 entram atrás do go-to-market.

## Piloto executado em 26/08/2026 — METODOLOGIA APROVADA

Rodado ponta a ponta com 1 post real (briefing de arquitetura, brand fictícia),
usando o harness dev `app/api/dev/pilot` + `app/debug/pilot` (apagar depois).
Custo total ≈ US$ 0,22 (copy 0,042 + bitmap 0,08 + clean plate 0,08 + extração).

Resultado por iteração:
- **v1 (uma passada, sem juiz): ~75% de fidelidade.** Terço superior quase
  perfeito; 5 defeitos: texto meio-corrigido ("LAMINADA LAMINADA"), highlight
  âmbar perdido, bullets 13% acima do card, CTA fora do botão, cor de bullet
  trocada pela do ícone.
- **v2 (pós-patches do juiz): ~90%.** Bullets no card, CTA no botão.
- **v3: ~95%, APROVADO.** Highlight resolvido, bullets em 1 linha.
  Evidências em `.pilot/render*.png` vs `.pilot` original.

Aprendizados que viram REGRA da fábrica:
1. **Snap-to-list em código**: o extrator devolve texto meio-corrigido quando o
   bitmap tem typo; casar por fuzzy com o content aprovado e usar SEMPRE o
   texto canônico. (Bônus de produto: o editável CORRIGE typo do bitmap de
   graça — o original saiu "MADEIRA LAMEIRA LAMINADA".)
2. **O extrator erra mais no terço inferior** (y até 13% fora) e confunde cor
   de ícone com cor de texto — o juiz + patch converge em 2 iterações.
3. **Render headless resolvido sem dependência nova**: `chrome --headless=new
   --screenshot --window-size=1080,1350` na página `?only=render`
   (`html-to-image` pendura em aba sem compositing; não usar na fábrica).
4. **Gap de DSL descoberto**: highlight só casa palavra a palavra — frase
   multi-palavra precisa ser expandida em lista de palavras (normalizar em
   código no compositor).
5. **A clean plate é âncora de layout**: ela preserva card, ícones e botão
   outline — o juiz deve alinhar os textos A ESSES elementos, não às medidas
   cruas do extrator.

O que o piloto NÃO provou ainda (fica pro lote de 10-20): taxa de aprovação em
briefings variados (foto de pessoa real, layouts stat-hero, fundos claros) e o
custo médio do juiz automatizado (aqui o juiz foi manual/Claude interativo).

## Lote de 4 nichos — 26/08/2026, tarde: 4/4 APROVADOS, dentro do produto

Segundo teste, agora em nichos variados (pedido do Marcos) e terminando na
biblioteca REAL: barbearia (oferta), pizzaria (produto), construtora
(autoridade/stat) e advocacia (educativo). Skeletons sorteados diferentes,
fundos claro e escuro, pill/card/checkbox/botão.

Resultado: **4/4 aprovados em 2-4 iterações** (~92-95% de fidelidade), salvos
como posts editáveis em `single_posts` (títulos "[Piloto] ...", brand WebSync
Solutions), com bitmap + clean plate + thumb re-hospedados no Storage pela
própria action `save` (a Fase 0 em miniatura, validada). Custo médio
~US$ 0,26/post (pior caso US$ 0,37).

O que o lote revelou que o caso único não tinha mostrado:

1. **Clean plate é o novo gargalo nº 1: 50% de taxa na 1ª tentativa** (2/4
   vieram com texto ainda pintado). Retry resolve: 2ª tentativa limpou a
   construtora, 3ª limpou a barbearia — 4/4 no fim. REGRA DA FÁBRICA: juiz de
   clean plate (visão: "sobrou texto legível?") + até 3 retries (US$ 0,08 cada).
   A action `clean` do harness já faz o retry preservando extração e patches.
2. **Elementos vazios preservados na clean são ÂNCORAS de composição.** Pills,
   botões e checkboxes que a limpeza mantém vazios marcam o lugar exato do
   texto. O padrão vencedor: texto vira camada SIMPLES alinhada por cima do
   elemento do fundo — nunca pill/botão HTML duplicado (dupla borda). Isso
   deve virar código no buildSpecFromLayout.
3. **Extração erra pill_bg**: checkbox/ícone colorido ao lado do texto vira
   "fundo de pill" e o item rende um botão gigante. E ela mede texto FORA da
   lista conhecida ("Só até sexta-feira" não existia no content) — o snap em
   código continua obrigatório.
4. **Ghost word não sobrevive**: "COMBO" atrás do card não tem como existir em
   camada HTML (o card é parte do fundo). Perda estrutural aceita por ora;
   melhoria futura: instruir a clean plate a PRESERVAR o texto-fantasma.
5. **Fal 422 intermitente** na geração do bitmap (2 ocorrências): 1 retry
   resolveu ambas. A fábrica precisa de retry nessa etapa também.

## A biblioteca (visão do Marcos, registrada 26/08)

O destino do catálogo: uma biblioteca estilo Canva onde o usuário (a) escolhe
um template e DESCREVE NO CHAT o que quer nele, ou (b) não escolhe nada e a IA
puxa o template certo pelo briefing/nicho — barbearia, pizzaria, construtora,
advogado. Consequência pra Fase 0: cada geração gravada precisa carregar
nicho/segmento + briefing + vibe junto do par bitmap→spec, porque é esse
metadado que treina a escolha automática de template depois.

## Ordem de execução resumida

1. **Agora:** Fase 0 (migration + re-host dos bitmaps). ~1 sessão de trabalho.
2. **Quando priorizar:** rota debug de render + Playwright + juiz → rodar lote
   piloto de 10 conversões e medir taxa de aprovação.
3. **Com o piloto na mão:** decidir entre expandir vocabulário do DSL ou escalar
   o lote, conforme o que o juiz reprovar.
4. **Meses depois, com volume:** avaliar Fase 3 com números reais de custo.
