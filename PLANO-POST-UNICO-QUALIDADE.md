# Plano — Post único no nível BestContent (18/08/2026)

> STATUS 19/08 (2ª rodada): P0 + Rota B → evoluída pra **Rota B2** por insight
> da conversa do ChatGPT ("transcreva uma imagem que já ficou bonita"):
> nano-banana gera o POST COMPLETO como referência (com tipografia) → edit
> remove o texto (clean plate) → Claude vê as DUAS imagens e transcreve o
> layout em blocos editáveis sobre o fundo limpo. Resolve encavalamento
> (posições copiadas de um design real, não estimadas) e mesmice (o modelo de
> imagem compõe variado — validado: 5 arquétipos diferentes em 5 gerações).
> Custo: 2 imagens/post (~US$0,16) — decidir repasse. Pendências no fim.

Estudo feito com: 2 outputs do GPT Image (conversa do ChatGPT), editor + últimos
posts da comunidade do BestContent, geração de teste real no Nexus (matéria da
Marília Pellegrini) e auditoria de código do pipeline inteiro.

## O veredito do estudo

A arquitetura recomendada pelo ChatGPT (IA gera "projeto de design" editável,
router de modelos, design engine) **é a que já temos** — FreePostSpec + compose
livre + editor. O problema não é arquitetura. São três camadas:

1. **A foto sai errada ou feia.** No teste real, o fundo do post veio o pôster
   da novela "Terra e Paixão" (Wikimedia sem validação de relevância). Quando é
   IA, o prompt vai cru pro nano-banana-2 (sem enriquecimento de estilo que o
   carrossel JÁ tem), com "Negative:" escrito como texto (o modelo lê como
   descrição) e cláusula negativa gigante que empurra pra textura abstrata.
   Fallbacks todos silenciosos (nano-banana → Flux schnell 4 steps 3:4 →
   sem foto), usuário paga 25 tokens sem saber que levou downgrade.

2. **O renderizador não sabe desenhar o que faz as referências serem bonitas.**
   Não existe: forma orgânica de verdade (arco/blob via clip-path), gradiente em
   texto, noise/grain, duotone na foto, sombra em shape, blend mode. E dois
   bugs matam composições boas: `photo_overlay` com `direction` gera CSS
   inválido (overlay some — mata a direção full-bleed) e filho posicionado de
   `card` colapsa. A crítica aprova o que o renderer descarta.

3. **Vazamentos e crítica cega.** "@marca" literal copiado do exemplo do system
   prompt (crítica ignora strings <18 chars); zona morta (regra 7) não tem
   verificação nenhuma — nosso teste saiu com ~35% do canvas vazio embaixo;
   contraste não é checado dentro de card nem em pill; 4 tentativas reprovadas
   ainda entregam a peça sem aviso.

## O que os bonitos fazem (padrões extraídos)

- **Foto derretida no fundo**, nunca "foto num retângulo": ou full-bleed com a
  cena inteira pensada pro texto, ou dentro de forma orgânica (arco, blob,
  círculo) que vaza pelas bordas.
- **Paleta derivada do tema/foto** (creme + verde pra arquitetura), não cor de
  marca crua.
- **Tipografia editorial com mistura**: serif + itálico na mesma frase, caps
  espaçadas em kickers/microtexto.
- **Densidade ornamentada**: selo/carimbo, chips, quote-card sobreposto à foto,
  microtexto vertical, CTA-pill discreta, logo/handle sempre.
- **Palavra-chave em cor de acento no meio da headline** (os dois fazem).

## P0 — parar de gerar lixo (1º commit)

1. **Wikimedia com validação ou nada**: checar P31 (tipo da entidade), nunca
   devolver P154 (logo), exigir proporção/resolução mínima de foto; em dúvida,
   cair pro nano-banana. (lib/generation/wikimedia.ts, free-generate.ts)
2. **Prompt de foto enriquecido como no carrossel**: style suffix + retry com
   backoff (espelhar lib/editorial/ai-images.ts), remover "Negative:" textual e
   encolher a cláusula anti-texto pra 1 frase. Validar a imagem devolvida
   (resolução + variância de cor) com 1 retry. (lib/generation/nano-banana.ts,
   free-generate.ts)
3. **Bugs do renderer**: photo_overlay direction → rgba() de verdade;
   card children relativos ao card de fato; start default alinhado (0.4).
   (components/single-posts/free-post-renderer.tsx)
4. **Matar o "@marca"**: trocar no exemplo por marcador neutro + substituição
   pós-composição pelo handle real + crítica passa a olhar strings curtas com
   "@". (lib/single-posts/compose.ts)
5. **Crítica de zona morta**: estimar cobertura vertical por coluna; painel com
   >25% de altura vazia reprova. (compose.ts)

## P1 — subir o teto visual (o pulo pro nível deles)

6. **Vocabulário novo no schema + renderer + prompt**: clip-path orgânico
   (arch/blob/squircle real), gradiente em texto, grain/noise overlay, duotone/
   tint na foto, sombra em shape, mix-blend. Documentar no prompt o que já
   existe e o modelo não usa (ghost, mask_fade, blur, divider vertical).
7. **Foto como cena dirigida**: o compositor passa a receber a foto DEPOIS de
   escolher a direção — o photo_prompt é derivado da direção de arte (zona
   vazia pra texto, luz, paleta), não genérico. É o que faz o full-bleed do
   ChatGPT funcionar: a cena já nasce com espaço pro texto.
8. **Paleta derivada do tema**: diretor de arte decide paleta da peça (pode
   partir da marca, mas com neutros editoriais), em vez de brand_colors crus.
9. **Direções de arte reescritas** com os padrões das referências (arco
   editorial, foto sangrada com quote-card, selo + chips) e exemplo do system
   prompt trocado por um com essas técnicas.
10. **Crítica estendida**: contraste em card transparente e pill, colisão
    vertical texto×foto full-bleed, stack×stack.

## P2 — honestidade operacional

11. Propagar na UI: foto falhou / saiu no fallback / peça saiu reprovada.
    Débito de token condizente com o que foi entregue (Flux ≠ 25 tokens).
12. Corrigir comentário desatualizado de lib/generation/image.ts (regra
    Pro/plano morreu; hoje é por papel cover/slide).

## Fora de escopo por enquanto

- Trocar a arquitetura por bitmap (caminho BestContent): não. A editabilidade
  gratuita é a nossa diferenciação; o teto visual sobe por P1.
- Model router multi-modelo de imagem (Flux/Gemini/Ideogram como opção do
  usuário): boa ideia de produto, depois que a qualidade base estiver no nível.


## Pendências de calibragem (pós Rota B, 19/08)

- Colisão pontual na peça de arquitetura: subtítulo/corpo duplicados na mesma
  zona + texto vertical de margem invadindo a coluna de conteúdo. Próximo
  passo: crítica de interseção AABB entre blocos de texto absolutos.
- Editor: "Outra versão" é no-op silencioso quando o briefing veio vazio
  (fluxo por link salva raw_brief null). Desabilitar o botão ou regenerar a
  partir do conteúdo aprovado.
- Cena do nano-banana sai 928×1152 em 1K (upscale 1.16× no export) — avaliar
  FAL_NANO_BANANA_RESOLUTION=2K quando a margem permitir.
- Bug histórico corrigido em 19/08 que valia ouro: um caractere BACKSPACE
  () entrou num regex de compose.ts via heredoc Python (`` interpretado
  pelo Python) e desativava a substituição do @handle sem nenhum erro. Se um
  fix "não funcionar" sem explicação, checar controle invisível com cat -A.


## Pendências Rota B2 (19/08, 2ª rodada)

- **Clean plate parcial**: o edit remove headline/pills mas às vezes deixa os
  textos PEQUENOS bitmapados (corpo, bullets) — que duplicam sob o HTML.
  Prompt endurecido em free-generate.ts (CLEAN_PLATE_PROMPT); se persistir,
  testar 2 passes de edit ou máscara por região.
- **Watch do Turbopack no Windows solta silenciosamente**: server passa a
  servir módulo velho sem erro (aconteceu 2×; foi a causa do "@marca
  imortal"). Canário: log "[compose] módulo carregado v-b2-handle-fix" no
  boot. Na dúvida, reiniciar o dev server.
- Crítica em modo transcrição relaxada (densidade, orçamento vertical,
  texto-sobre-foto) — o compositor vê os pixels; o crítico cego não.
  Manter: slots presentes, cor saturada, handles, sobreposição AABB.
- Custo 2× de imagem (referência + clean): margem/token a decidir antes de
  ligar em produção.


## Rodada de 3 posts (19/08, advocacia + pet + cafeteria)

- **"@marca" NÃO era bug de código**: o instagram_handle da marca "Perfil
  pessoal" está gravado NO BANCO como o placeholder "marca". O pipeline
  respeita o dado. Correção: editar o handle da marca na UI.
- **Padrão dominante de defeito: colunas transcritas estreitas demais** pras
  nossas métricas de fonte (1 palavra/linha, overflow). Mitigado com regra de
  largura mínima (24%) no prompt de transcrição + crítica programática que
  reprova bloco <16% com frase.
- Clean plate falhou 1× com 422 do Fal (pontual); adicionado 2º fallback que
  regera a cena sem texto antes de cair no tipográfico puro.
- Lição operacional: aba do Chrome em segundo plano congela as animações do
  wizard (rAF) e o fluxo trava — automação precisa da aba fronteada.


## PIVÔ 19/08 (tarde): MODO BITMAP é o produto vendável

Veredito honesto da rodada de 3 posts: a transcrição HTML (Rota B2) quebra o
layout a cada geração (fontes medem diferente da referência) — não é vendável.
A arte CRUA do nano-banana-2 é vendável (mesmo motor e mesmo nível do
BestContent).

**Decisão: POST_UNICO_BITMAP = true (lib/features.ts).** A arte final É a
imagem completa do nano-banana (1 geração só, sem clean plate, sem compose).
O spec vira background full-bleed + zero camadas; o editor continua permitindo
sobrepor camadas HTML manualmente. Validado com o post da cafeteria:
composição nível BestContent.

Fraqueza conhecida do bitmap: LETRA MIÚDA sai embaralhada. Mitigado no prompt
(só headline/kicker/subtitle/rótulos/CTA entram na arte; frases descritivas
ficam na legenda; cláusula "no small print"). Próximos passos do modo bitmap:
- "Editar texto" via nano-banana /edit (troca cirúrgica de um texto da arte)
  — a resposta ao BestContent: eles cobram 6 créditos regenerando tudo.
- A transcrição (Rota B2) fica como experimento desligado — só volta se um dia
  igualar o bitmap visualmente.


## Edição cirúrgica — ENTREGUE (19/08, noite)

Fluxo validado fim-a-fim no post da barbearia: a arte saiu com a etiqueta
glitchada ("TER A QUI"), o campo foi editado pra "TERÇA A QUINTA", Aplicar →
nano-banana /edit trocou SÓ o texto da pill mantendo fonte/cor/posição/design
idênticos. É a resposta direta ao BestContent (6 créditos regenerando tudo).

Peças:
- POST /api/post-unico/edit-bitmap — até 8 trocas de texto por chamada,
  1 débito (TOKEN_COST.imageCover=25).
- Textos da arte persistidos em content._bitmap_texts (save.ts) e recarregados
  na reedição (page.tsx → InitialPost.bitmapTexts).
- Painel "Textos da arte" no editor (editor-client.tsx): campos por slot
  (etiqueta/título/subtítulo/número/itens/botão), Aplicar só habilita com
  diff, atualiza o fundo + auto-salva.


## Híbrido drag-and-drop: testado e DESLIGADO (19/08, noite)

Experimento: visão mede as caixas dos textos na referência, código posiciona
camadas HTML sobre a clean plate (drag/edição grátis). Funcionou tecnicamente
(7 camadas medidas, posição correta), mas o veredito visual do Marcos foi
reprovado: re-renderizar com as nossas fontes PERDE a tipografia integrada do
bitmap (luz, kerning, efeitos) — a peça cai de qualidade na comparação direta.

Flag POST_UNICO_HIBRIDO = false (lib/features.ts). O produto é:
**bitmap puro + edição cirúrgica (edit-bitmap) + camadas HTML que o usuário
adiciona por cima quando quiser.** O código do híbrido fica
(lib/single-posts/extract-layout.ts) pra retomar se um dia valer.
