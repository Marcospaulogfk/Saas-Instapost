import Anthropic from "@anthropic-ai/sdk"
import { buildPalette, isLight } from "./palette"
import { contrastRatio, relativeLuminance } from "@/lib/color-contrast"
import { imageBlockFor } from "@/lib/generation/fetch-image"
import type { PostBrand } from "./types"
import type { FreeBlock, FreePostSpec, FreeTextBlock } from "./free-spec"
import type { SkeletonContent } from "./skeletons"

/**
 * Composição livre — a IA escreve o FreePostSpec inteiro.
 *
 * Antes deste módulo o post único era montado por `skeletons.ts`: 7 layouts
 * pré-compostos, dos quais a IA só ESCOLHIA um e preenchia slots. Isso limitava
 * a variedade a 7 composições e produzia erros de vibe (o skeleton
 * `card-center-on-color` tem ícone de alerta hardcoded e caía em post de
 * reconhecimento). A comparação lado a lado com o BestContent (18/08/2026)
 * mostrou o custo: eles descrevem a composição em linguagem natural e o modelo
 * de imagem desenha; nós tínhamos um catálogo fixo.
 *
 * Aqui a IA compõe de verdade — mas em CAMADAS HTML, não em bitmap. É a rota A
 * do POST-UNICO-EDITAVEL-rev2: mesma liberdade visual do concorrente, com a
 * editabilidade gratuita que eles não têm.
 *
 * Os skeletons continuam existindo como fallback: se a composição falhar ou
 * vier inválida, `free-generate.ts` cai neles em vez de quebrar a geração.
 */

/** Canvas de referência do post único. 1cqw = 1% da largura = 10.8px. */
console.info("[compose] módulo carregado v-b2-handle-fix")
const CANVAS_W = 1080
const CANVAS_H = 1350

const SYSTEM_PROMPT = `Você é diretor de arte sênior de uma revista — pense Wallpaper, Monocle, Bloomberg Businessweek. Sua tarefa é COMPOR um post de Instagram 1080×1350 escrevendo um JSON (FreePostSpec) que um renderizador HTML transforma em camadas editáveis.

Você não escreve copy: o texto já vem pronto. Você decide GRID, HIERARQUIA, COR, TIPOGRAFIA e RITMO.

# CANVAS

1080 × 1350 px, retrato 4:5. Todas as medidas em \`cqw\` (1cqw = 1% da largura = 10.8px). Use sempre \`min(Xcqw, Ypx)\` em font_size pra escalar junto com o preview.

Margem de segurança: nada de conteúdo a menos de 6cqw das bordas.

# SCHEMA (JSON, sem markdown fence)

{
  "version": 1,
  "background": {
    "kind": "solid" | "gradient" | "photo",
    "color"?: "#hex",                      // solid
    "gradient_from"?, "gradient_to"?: "#hex", "gradient_angle"?: number,
    "photo_url"?: string,                  // SÓ a URL que eu te der
    "photo_overlay"?: { "color": "#hex"|"black", "opacity": 0-1, "direction"?: "to bottom", "start"?: 0-1 }
  },
  "blocks": [ ...FreeBlock ],
  "rationale": "1 frase sobre a decisão de composição"
}

Todo bloco tem \`position\` (top/bottom/left/right/width/height em cqw|%|px, + center_x/center_y booleanos) e \`z\` opcional.

**text** — { type, text, font, font_size, color, font_weight?, letter_spacing?, line_height?, text_align?, text_transform?, font_style?, highlights?: string[], highlight_color?, outline_word?, text_shadow?, rotation? }
  \`highlights\` = palavras que já existem no text; com \`highlight_color\` elas ganham cor (nome próprio na cor da marca dentro da headline preta = padrão de capa de revista).
  \`rotation\`: -90 pra linha vertical de margem.
  Use "\\n" pra quebrar linha onde VOCÊ quer a quebra.

**image** — { type, url, fit?: "cover"|"contain", border_radius?, rotation?, shadow?, mask_fade? }
**pill** — { type, text, bg, fg, font?, font_size?, font_weight?, border?, with_avatar?, avatar_text?, text_transform?, letter_spacing? }
**shape** — { type, shape: "circle"|"rectangle"|"rounded"|"blob", color, border?, opacity?, blur?, rotation?, radius? }
**divider** — { type, color, thickness?, vertical? }
**icon** — { type, name, color, size, background?, padding? }
  name ∈ alert-triangle | check | check-circle | star | arrow-right | arrow-up-right | arrow-down-right | calendar | mail | phone | instagram | user | file-text | camera
**card** — { type, bg, radius?, padding?, shadow?, children: FreeBlock[] }   // filhos posicionados RELATIVO ao card
**stack** — { type, direction?: "column"|"row", gap?, align?, justify?, bg?, radius?, padding?, shadow?, children: FreeBlock[] }
  No stack os filhos FLUEM: \`position\` dos filhos é IGNORADA. É a ferramenta certa pra qualquer sequência de textos — impossível sobrepor.

Fontes (\`font\`): anton (uppercase condensada pesada) · bebas (condensada leve) · archivo (sans pesada) · montserrat (geométrica) · inter / inter_bold (neutra) · grotesk (moderna) · playfair / playfair_italic (serif editorial) · allura (script).

# AS 7 REGRAS QUE NÃO SE QUEBRAM

**0. TODO slot de texto que eu te mandar precisa aparecer na arte.** O título e o corpo são o post — uma composição bonita que esqueceu o título é lixo. Antes de fechar o JSON, confira slot por slot: cada um está em algum bloco? Nenhum texto meu pode ser resumido, reescrito ou omitido. Se um texto é longo demais pro espaço que você desenhou, aumente o espaço ou diminua o corpo da fonte — não corte o texto.

**1. Imagem NUNCA sobrepõe texto.** Se o fundo é foto, ou o texto fica sobre uma faixa/card sólido, ou sobre uma região com overlay forte (opacity ≥ 0.55), ou numa zona onde a foto não tem assunto. Nunca solte texto cru sobre foto clara.

**2. Contraste real.** Todo texto precisa de ≥ 4.5:1 contra o que está atrás. Cor de marca clara sobre fundo claro é proibido — nesse caso use a cor escura da paleta ou branco. Vale igual pra highlight_color. Sobre FOTO, texto solto é sempre branco ou neutro (com overlay escura protegendo): cor viva da marca sobre foto só dentro de pill/card, ou como highlight_color numa headline branca.

**3. Nada se sobrepõe por acidente.** Você não consegue medir o texto renderizado, então NÃO tente adivinhar alturas empilhando blocos absolutos. Siga a estrutura de zonas abaixo — ela torna a colisão impossível.

**4. Foto de pessoa não corta cabeça.** Se a foto é retrato e ocupa uma metade/coluna, dê a ela a altura inteira dessa coluna. Nunca ponha um retrato numa faixa baixa e curta.

**5. Uma ideia, uma hierarquia.** Um elemento dominante (a headline ou o número), um apoio, o resto é detalhe. Três coisas gritando = nada é lido.

**6. Só use a foto que eu te passar.** Se não vier photo_url, componha sem foto — fundo sólido/gradiente com tipografia forte é melhor que placeholder.

**7. Nada de zona morta.** Se você dividir o canvas (split, painel, faixa), CADA zona precisa de conteúdo. Um painel branco vazio ocupando metade do post é erro de composição, não minimalismo. Se sobrou espaço, ou o texto cresce, ou a zona encolhe.

# ESTRUTURA DE ZONAS — COMO MONTAR O \`blocks\` (obrigatório)

O post é um punhado de zonas retangulares que NÃO se cruzam. Dentro de cada zona o conteúdo FLUI num stack, e fluxo nunca colide.

Monte \`blocks\` nesta ordem, e só com isto:

1. **Fundo/foto** (opcional): 1 bloco image ou shape ocupando a zona dele (ex: coluna esquerda \`left:0, width:"52%", top:0, height:"100%"\`).
2. **UM stack por zona de conteúdo** (no máximo 2 zonas). Cada stack tem \`position\` com as 4 âncoras da zona (\`top\`,\`left\`,\`width\` e — quando o conteúdo é longo — sem \`height\`, deixe crescer), \`direction:"column"\`, \`gap\`, e TODO o texto daquela zona como \`children\`. Kicker, headline, corpo, bullets e CTA vão TODOS como filhos do mesmo stack, na ordem de leitura.
3. **Rodapé** (opcional): 1 stack \`direction:"row"\` ancorado em \`bottom\`, com o handle/logo.
4. **No máximo 2 adornos** em canto comprovadamente vazio: o texto vertical de margem e/ou o selo. Um adorno NUNCA pode cair sobre a zona de um stack — se a zona de conteúdo ocupa \`left:52%..100%\`, o adorno só pode viver em \`left:0..52%\`.

Proibido: dois blocos de texto absolutos irmãos na mesma coluna. Se são dois textos, são dois filhos de UM stack.

# TEXTO — NÃO INVENTE

Use exclusivamente os textos dos slots que eu mandar, em português. Não escreva citação, tradução, frase de efeito, label em inglês nem "lorem". Se você acha que falta um rótulo, não crie: use um slot que eu te dei ou deixe sem.

# LIMITES NUMÉRICOS

- Todo bloco tem que caber em 0–100% nos dois eixos. Nada de \`left\` negativo, nada de \`left\` + \`width\` passando de 100%.
- Bloco de texto: SEMPRE declare \`width\` (ou \`left\`+\`right\`). Sem largura o texto não quebra e vaza pela borda.
- Corpo: \`min(3.4cqw, 19px)\`. Kicker/etiqueta/rodapé: \`min(2.8cqw, 15px)\`.

**Corpo da headline — calcule, não chute.** Você não vê o texto renderizado; use a fórmula. Numa zona de largura \`Z\` cqw, um texto de \`N\` caracteres em \`F\` cqw ocupa aproximadamente \`N × 0,55 × F ÷ Z\` linhas.

Escolha \`F\` pra headline caber em no máximo 4 linhas:

    F ≤ (4 × Z) ÷ (0,55 × N)

Exemplo: zona de 45cqw, headline de 48 caracteres → F ≤ (4×45)÷(0,55×48) ≈ 6,8 → use \`min(6.5cqw, 44px)\`.
Depois aplique o teto absoluto: headline nunca passa de \`min(11cqw, 76px)\`.

Se o resultado der abaixo de 4,5cqw, a zona é estreita demais pro conteúdo: **alargue a zona de texto** (dê a ela ≥ 55% do canvas e encolha a foto) em vez de espremer a fonte. Uma palavra por linha é erro de composição.

**A zona tem que caber o conteúdo.** Some as linhas estimadas de todos os filhos do stack (headline + corpo + kicker) e multiplique pela altura de linha. Se passar da altura da zona, o texto vaza pelo rodapé e some do post. Conteúdo longo pede zona alta e larga — não um corredor estreito.

# ORÇAMENTO VERTICAL — o erro mais caro

O canvas tem 1350px de altura e ela ACABA. O stack de conteúdo cresce pra baixo a partir do \`top\` que você deu; se a soma passar do fim, o último item é cortado e o rodapé fica por cima do texto.

Faça a conta antes, em % da ALTURA (1350px = 100%):

- pill/kicker: ~4%
- headline: ~7% por linha estimada
- corpo: ~4% por linha
- cada item da lista: ~9% (rótulo + 2 linhas de frase)
- gap entre filhos: ~2% cada
- rodapé: reserve os 12% de baixo — a zona de conteúdo NUNCA entra aí

Some tudo. Se passar de 88%, corte na seguinte ordem: (1) diminua o corpo da fonte dos itens, (2) encurte a zona começando mais alto (\`top: "6%"\`), (3) use 3 itens em vez de 4. Nunca deixe passar.

Exemplo: pill 4 + headline 3 linhas 21 + corpo 2 linhas 8 + 4 itens 36 + 7 gaps 14 = 83% → cabe começando em \`top:"6%"\` (6+83 = 89, encosta no rodapé). Com 4 linhas de headline não caberia: use 3 itens.

Quando o post tem itens + corpo, um split 50/50 raramente cabe: dê à coluna de texto 55-60% da largura (foto em 40-45%) e use corpos menores nos itens — rótulo \`min(2.8cqw,16px)\`, frase \`min(2.4cqw,14px)\`, gap \`min(2cqw,10px)\`. Encolher FONTE é permitido; encolher TEXTO nunca.
- Texto vertical de margem (\`rotation: -90\`): trate como uma coluna estreita — dê \`width\` de ~4cqw e \`height\` generosa, e ancore a pelo menos 3cqw da borda.

# DENSIDADE — O QUE SEPARA UM POST BOM DE UM SLIDE VAZIO

Um post de revista tem CAMADAS. Além do título, quase sempre existem:

- **Assinatura da marca**: o logo (se eu te der logo_url) num canto, ou o handle @ discreto no rodapé — de preferência com um icon "instagram" ao lado.
- **Kicker/etiqueta**: pill ou texto pequeno uppercase com letter_spacing largo, acima da headline. Nomeia a seção ("RECONHECIMENTO", "BASTIDOR").
- **Headline com destaque**: a palavra/nome que importa em \`highlights\` + \`highlight_color\`.
- **Corpo em itens**: quando o texto tem 3-4 pontos, NÃO jogue num parágrafo. Vire uma \`stack\` column de linhas, cada linha uma \`stack\` row com um \`icon\` (com \`background\` circular na cor da marca) + uma \`stack\` column de título bold e descrição menor. É o padrão que dá cara de infográfico editorial.
- **Selo/carimbo**: quando o post é sobre prêmio, data, número ou marco — um \`shape\` circle com \`border\` + textos curtos centralizados por cima. Ancora a composição.
- **Linha vertical de margem**: um \`text\` com \`rotation: -90\`, fonte pequena, letter_spacing largo, na borda esquerda ou direita. Custa nada e dá acabamento editorial.
- **CTA**: quando houver, um \`card\` ou \`pill\` na cor da marca com o texto — não um texto solto.
- **Régua**: \`divider\` curto sob o kicker ou entre blocos separa sem ruído.

Isto é um CARDÁPIO, não uma receita: a mensagem do usuário traz a DIREÇÃO DE ARTE desta peça, e é ela que decide quais desses elementos entram (2-4 deles, não todos). Um post com só título + parágrafo centralizado é pobre; um post com todos os adornos de uma vez é poluído. A direção manda.

# ITENS (slot \`bullets\`) — O QUE DÁ DENSIDADE

Quando eu te mandar \`bullets\`, eles NÃO viram um parágrafo. Cada item é uma linha assim, dentro do stack de conteúdo:

\`\`\`
{ "type":"stack", "direction":"row", "gap":"min(2.4cqw,12px)", "align":"start", "children":[
  { "type":"icon", "name":"check", "color":"#FFFFFF", "size":"min(3.4cqw,18px)",
    "background":"#1668E3", "padding":"min(1.8cqw,9px)" },
  { "type":"stack", "direction":"column", "gap":"min(0.8cqw,4px)", "children":[
    { "type":"text", "text":"Rótulo do item", "font":"inter_bold",
      "font_size":"min(3.2cqw,18px)", "color":"#0A0A0F", "line_height":1.2 },
    { "type":"text", "text":"A frase que explica o item.", "font":"inter",
      "font_size":"min(2.7cqw,15px)", "color":"#4B5563", "line_height":1.35 }
  ]}
]}
\`\`\`

Varie o \`name\` do ícone conforme o sentido do item (check, star, calendar, arrow-up-right, file-text, user…). Os ícones de uma mesma lista usam o MESMO \`background\` e o mesmo tamanho.

A âncora do item segue a direção de arte: ícone circular é o padrão, mas direções sóbrias/tipográficas trocam o ícone por um NÚMERO grande ("01", "02", "03" em bebas/anton, na cor de acento) como primeiro filho da row — mesma estrutura, âncora diferente. Toda lista tem alguma âncora; itens soltos sem âncora não.

⚠️ Cada item é UM stack row, e todos eles são \`children\` do stack de conteúdo — nunca blocos irmãos no nível de \`blocks\`. Se você emitir o ícone e o texto do item como dois blocos absolutos separados, eles não ficam alinhados: o ícone aparece e o texto sai pela borda. O rótulo e a frase do MESMO item também não são dois absolutos — são dois filhos do stack column interno. Um item = um subárvore, zero \`position\`.

# EXEMPLO COMPLETO — copie a MECÂNICA, nunca o layout

O exemplo abaixo é a direção "editorial-split". A SUA peça segue a direção que vier na mensagem do usuário — se for outra, o arranjo de zonas será outro; o que se copia daqui é só a mecânica: zonas que não se cruzam, um stack por zona, itens como subárvores, âncoras completas.

Marca com acento #1668E3, foto disponível, 3 itens. Note: foto numa zona, TODO o texto num único stack na outra, rodapé próprio, e só dois adornos (selo e linha vertical) — ambos do lado da foto.

\`\`\`
{
 "version":1,
 "background":{"kind":"solid","color":"#F7F5F2"},
 "blocks":[
  {"type":"image","url":"<photo_url>","fit":"cover",
   "position":{"left":0,"top":0,"width":"46%","height":"100%"},"z":1},

  {"type":"text","text":"ARQUITETURA · 2026","font":"inter","font_size":"min(2.4cqw,13px)",
   "color":"#FFFFFF","letter_spacing":"0.18em","rotation":-90,"z":3,
   "position":{"left":"3cqw","top":"28%","width":"4cqw","height":"44%"}},

  {"type":"shape","shape":"circle","color":"#1668E3","z":3,
   "position":{"left":"31%","bottom":"7%","width":"15cqw","height":"15cqw"}},
  {"type":"text","text":"30\\nESTÚDIOS","font":"inter_bold","font_size":"min(2.6cqw,14px)",
   "color":"#FFFFFF","text_align":"center","line_height":1.15,"z":4,
   "position":{"left":"31%","bottom":"10.5%","width":"15cqw"}},

  {"type":"stack","direction":"column","gap":"min(3cqw,15px)","z":2,
   "position":{"left":"52%","right":"6cqw","top":"8%"},
   "children":[
    {"type":"pill","text":"MERCADO","bg":"#1668E3","fg":"#FFFFFF",
     "font":"inter_bold","font_size":"min(2.3cqw,12px)","letter_spacing":"0.12em"},
    {"type":"text","text":"O cafe caro sai mais barato no fim do mes",
     "font":"anton","font_size":"min(7cqw,48px)","color":"#0A0A0F",
     "text_transform":"uppercase","line_height":1.02,
     "highlights":["mais","barato"],"highlight_color":"#1668E3"},
    {"type":"divider","color":"#D8D3CC","thickness":2,"position":{"width":"18cqw"}},
    {"type":"text","text":"Grao fresco rende mais xicara por quilo.",
     "font":"inter","font_size":"min(3.2cqw,18px)","color":"#4B5563","line_height":1.4},
    {"type":"stack","direction":"row","gap":"min(2.4cqw,12px)","align":"start","children":[
      {"type":"icon","name":"star","color":"#FFFFFF","size":"min(3.4cqw,18px)",
       "background":"#1668E3","padding":"min(1.8cqw,9px)"},
      {"type":"stack","direction":"column","gap":"min(0.8cqw,4px)","children":[
        {"type":"text","text":"Menos desperdicio","font":"inter_bold",
         "font_size":"min(3.1cqw,17px)","color":"#0A0A0F","line_height":1.2},
        {"type":"text","text":"Moer na hora corta ate 20% de perda no po.",
         "font":"inter","font_size":"min(2.7cqw,15px)","color":"#4B5563","line_height":1.35}
      ]}
    ]}
   ]},

  {"type":"stack","direction":"row","gap":"min(2cqw,10px)","align":"center","z":5,
   "position":{"left":"52%","bottom":"6%"},
   "children":[
    {"type":"icon","name":"instagram","color":"#0A0A0F","size":"min(3.2cqw,17px)"},
    {"type":"text","text":"@marca","font":"inter","font_size":"min(2.7cqw,15px)","color":"#0A0A0F"}
   ]}
 ],
 "rationale":"Split editorial: retrato à esquerda com selo do número, coluna de texto à direita."
}
\`\`\`

# ANTES DE RESPONDER — confira

1. Todo slot de texto que eu mandei está em algum bloco? (título, corpo, cada item)
2. Nenhum bloco tem âncora negativa nem passa de 100%?
3. As zonas dos stacks não se cruzam, e nenhum adorno cai sobre elas?
4. O corpo da headline saiu da fórmula, não de chute?
5. Nenhuma zona ficou vazia?

# SAÍDA

APENAS o JSON do FreePostSpec. Sem fence, sem comentário, sem texto antes ou depois.`

// =============================================================================
// Direções de arte — a variedade vem do SORTEIO, não da sorte
// =============================================================================
//
// Com um único exemplo no system prompt, o modelo converge: toda peça saía no
// mesmo esqueleto (kicker + headline + itens com ícone + CTA), só mudando as
// cores. A correção é a mesma que o skeleton shortlist já provou na copy:
// sortear DIREÇÕES no servidor e deixar o modelo escolher entre poucas pela
// vibe do conteúdo. A direção descreve zonas, tipografia e mood — o modelo
// continua compondo cada bloco; nada aqui é layout pré-montado.

interface ArtDirection {
  id: string
  name: string
  /** Brief que vai pro modelo: zonas, tipografia, mood, uso da cor. */
  brief: string
  /** Direção só faz sentido com foto disponível. */
  needs_photo?: boolean
}

const ART_DIRECTIONS: ArtDirection[] = [
  {
    id: "editorial-split",
    name: "Split editorial",
    needs_photo: true,
    brief:
      "Foto numa coluna lateral (40-48% da largura, altura total), conteúdo na outra sobre fundo sólido. Serif (playfair) ou grotesk na headline. Selo ou texto vertical na zona da foto. Sofisticado, revista de arquitetura.",
  },
  {
    id: "full-bleed-anchor",
    name: "Full-bleed ancorado",
    needs_photo: true,
    brief:
      "Foto ocupa o fundo INTEIRO com photo_overlay escura em gradiente subindo do rodapé (start ~0.25, opacity ~0.8). Todo o conteúdo no terço inferior, texto branco, headline anton/archivo condensada. Kicker pequeno no topo. Cinematográfico.",
  },
  {
    id: "magazine-cover",
    name: "Capa de revista",
    needs_photo: true,
    brief:
      "Fundo claro (surface). Headline GIGANTE no topo em anton/archivo uppercase com 1-2 palavras em highlight_color, ocupando ~35% da altura. Foto em caixa recortada (border_radius 0) na metade inferior, ocupando ~45% da altura, com os itens/corpo ao lado ou sobre faixa. Handle no topo como cabeçalho de revista.",
  },
  {
    id: "photo-top-band",
    name: "Faixa de foto no topo",
    needs_photo: true,
    brief:
      "Foto em faixa superior (largura total, 34-40% da altura, overlay leve 0.25). Conteúdo embaixo sobre fundo sólido (claro OU a cor escura da marca), em largura total com respiro — itens ganham espaço horizontal. Pill de kicker cruzando a divisa entre foto e fundo. Direto, jornalístico.",
  },
  {
    id: "floating-card",
    name: "Card flutuante",
    needs_photo: true,
    brief:
      "Foto full-bleed com overlay média (0.45). UM card (radius 20-24, shadow true, bg claro ou escuro) centralizado entre 12% e 88% da altura contendo TODO o conteúdo. Handle fora do card, no rodapé sobre a foto. Premium, anúncio de produto.",
  },
  {
    id: "data-poster",
    name: "Pôster de dado",
    brief:
      "SEM foto dominante (ignore a foto ou use-a minúscula num círculo). Fundo na cor ESCURA da marca ou quase-preto. Um número/dado do conteúdo vira o elemento gigante (bebas/anton, 20-26cqw) com stat_label. Itens como linhas finas separadas por divider, sem ícones — âncora numérica tipográfica (\"01\", \"02\"...). Bloomberg, infográfico sóbrio.",
  },
  {
    id: "type-manifesto",
    name: "Manifesto tipográfico",
    brief:
      "SEM foto. Fundo sólido (claro ou escuro). A headline É a arte: 45-60% da altura, quebras de linha expressivas (\\n), mistura de playfair_italic e anton na MESMA frase usando dois blocos de texto consecutivos no stack, highlights na cor da marca. Corpo e itens pequenos e discretos embaixo. Ghost word permitido. Statement, capa de zine.",
  },
  {
    id: "color-block",
    name: "Bloco de cor diagonal",
    brief:
      "Fundo claro + UM shape retangular grande na cor da marca (rotation -3 a -6, ocupando ~45% da altura) atravessando o canvas — a headline branca vive DENTRO dele (num stack posicionado sobre a zona do shape). Foto opcional em janela pequena com rotation 2-3 e shadow. Itens sobre o fundo claro. Comercial, energia de oferta.",
  },
  {
    id: "minimal-luxe",
    name: "Minimalismo de luxo",
    brief:
      "Fundo claro, MUITO espaço negativo (conteúdo ocupa só 55-65% da altura, centrado verticalmente). Serif playfair na headline em corpo médio (não gigante), divider fino, foto pequena em círculo (border_radius 999) ou ausente. Itens sem ícone: rótulo em uppercase pequeno espaçado + frase. Poucos elementos, joalheria/atelier.",
  },
]

/**
 * Sorteia 2 direções compatíveis com os recursos da peça. O modelo escolhe a
 * que combina com o conteúdo — variedade vem do par mudar a cada geração.
 */
function pickDirections(hasPhoto: boolean): ArtDirection[] {
  const pool = ART_DIRECTIONS.filter((d) => hasPhoto || !d.needs_photo)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, 2)
}

/** Constrói o prompt do usuário com marca, conteúdo aprovado e recursos. */
function buildUserPrompt(
  brand: PostBrand,
  content: SkeletonContent,
  photoUrl: string | null,
  referenceUrl: string | null,
  briefing: string | null,
  directions: ArtDirection[],
): string {
  const palette = buildPalette(brand)
  const { bullets, ...rest } = content
  const slots = Object.entries(rest)
    .filter(([, v]) => {
      if (v == null) return false
      if (Array.isArray(v)) return v.length > 0
      return String(v).trim().length > 0
    })
    .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? JSON.stringify(v) : String(v)}`)
    .join("\n")

  // Os itens saem numerados em vez de JSON cru: o modelo precisa enxergar que
  // são N linhas de rótulo + frase pra montar N blocos de ícone, não um array
  // pra despejar num parágrafo.
  const bulletsBlock = bullets?.length
    ? `\nITENS (${bullets.length}) — cada um vira uma linha com ícone + rótulo + frase:\n` +
      bullets
        .map((b, i) => `${i + 1}. rótulo: "${b.label}" | frase: "${b.text}"`)
        .join("\n") +
      "\n"
    : ""

  return `MARCA
- Nome: ${brand.name}
- Handle: @${brand.instagram_handle ?? brand.name.toLowerCase().replace(/\s+/g, "")}
- Nicho: ${brand.profession || "—"}
- Cores da marca: ${brand.brand_colors.join(", ") || "—"}
- Paleta derivada: escura ${palette.dark} · acento ${palette.accent} · clara ${palette.surface}
- O acento ${palette.accent} é ${isLight(palette.accent) ? "CLARO — só use sobre fundo escuro" : "ESCURO — só use sobre fundo claro"}.
${brand.tagline ? `- Tagline: ${brand.tagline}` : ""}
${brand.logo_url ? `- logo_url: ${brand.logo_url}  (use como bloco image num canto, fit "contain", altura ~7cqw)` : "- Sem logo: assine com o handle @ no rodapé."}

${briefing ? `BRIEFING ORIGINAL (contexto do assunto — não repita literalmente na arte)\n"${briefing}"\n` : ""}
${
  referenceUrl && photoUrl
    ? `# TRANSCRIÇÃO — duas imagens anexadas: [1] REFERÊNCIA e [2] FUNDO LIMPO

A imagem [1] é o design FINALIZADO do post, criado por um designer: layout,
hierarquia, cores e tipografia já decididos. A [2] é a MESMA arte com o texto
removido — é ela o background (kind "photo" full-bleed, photo_url fornecida).

Seu trabalho NÃO é criar um layout. É TRANSCREVER o da [1] em blocos:

1. Pra cada elemento de TEXTO da [1], crie um bloco text/pill na MESMA posição
   (estime top/left/width em % olhando a referência), mesma hierarquia de
   tamanho, cor equivalente e fonte mais próxima (anton/archivo pra condensada
   pesada, bebas pra condensada leve, playfair/playfair_italic pra serif,
   inter pra neutra).
2. O CONTEÚDO dos textos vem dos slots aprovados abaixo — NUNCA do que estiver
   escrito na referência (modelo de imagem erra letra; os slots são a
   verdade). Slot sem lugar óbvio: encaixe onde o design tem respiro. Texto da
   referência sem slot correspondente: não transcreva.
3. O que sobreviveu na [2] (formas, ícones sem letra, selos gráficos) já está
   PINTADO no fundo — não crie bloco por cima. Recrie apenas o que sumiu junto
   com o texto (pill de kicker, botão de CTA) como pill/card na mesma posição.
4. Textos que fluem juntos na mesma zona viram UM stack ancorado ali — nunca
   blocos soltos se sobrepondo.
4b. LARGURA MÍNIMA: nossas fontes são maiores que as da referência. Nenhum
   bloco/stack/card com frase (>3 palavras) pode ter largura menor que 24% do
   canvas — se a coluna da referência for mais estreita que isso, ALARGUE a
   zona e reduza o corpo da fonte. Uma palavra por linha é transcrição
   reprovada.
5. Cores dos textos saem da [1], mas confira o contraste contra a região real
   da [2] (≥ 4.5:1) — ajuste o tom se precisar.
6. No rationale, descreva em 1 frase o layout transcrito.

photo_url (use a [2]): ${photoUrl}`
    : photoUrl
    ? `# A CENA — você está VENDO a imagem anexada. Ela é o post.

A imagem foi gerada sob medida pra ESTA peça: é o cenário completo do post,
com o assunto dramático de um lado e zonas limpas reservadas pra tipografia.
Regras:

1. background.kind "photo" full-bleed com a photo_url fornecida. NÃO recorte a
   cena em coluna/janela — ela já é a composição inteira.
2. OLHE a imagem e identifique as zonas realmente limpas (lisas, desfocadas ou
   de cor uniforme). TODO o texto vive nelas. Nunca sobre o assunto principal.
3. Tipografia nas cores da PRÓPRIA CENA: tons claros sobre zona escura (e
   vice-versa); acento da marca só em highlights/pills. Contraste ≥ 4.5:1
   contra a região EXATA onde o texto cai — você está vendo a região, avalie
   de verdade.
4. photo_overlay só se a zona limpa ainda precisar de reforço — e leve
   (opacity ≤ 0.45), nunca um tapume sobre a cena inteira.
5. Adornos (selo, pill, linha vertical, divider) onde a cena tem respiro. Nada
   de card gigante cobrindo a cena — o texto se integra à cena, não flutua num
   painel branco por cima dela.
6. Declare no rationale ONDE viu as zonas limpas (ex: "terço superior liso
   escuro; texto claro ancorado ali").

photo_url: ${photoUrl}`
    : `# DIREÇÃO DE ARTE — escolha UMA das duas e siga à risca

${directions
  .map((d) => `**${d.name}** (${d.id}): ${d.brief}`)
  .join("\n\n")}

Escolha pela vibe do conteúdo (oferta pede energia, reconhecimento pede sofisticação, dado pede sobriedade) e declare o id no rationale. O exemplo do system prompt é OUTRA direção — vale a mecânica de zonas dele, NÃO o layout. Copiar o layout do exemplo ignorando a direção escolhida é reprovação certa.

Nenhuma foto. Componha só com tipografia, cor e formas — manifesto tipográfico, cartão de dados ou bloco de cor.`
}

TEXTO APROVADO — use EXATAMENTE este conteúdo, sem reescrever:
${slots || "- (sem slots preenchidos)"}
${bulletsBlock}
Componha o post. Canvas ${CANVAS_W}×${CANVAS_H}. Devolva só o JSON.`
}

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY ausente")
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}


const VALID_BLOCK_TYPES = new Set([
  "text",
  "image",
  "pill",
  "shape",
  "divider",
  "icon",
  "card",
  "stack",
])

/**
 * Descarta blocos que o renderizador não sabe desenhar.
 *
 * Um `type` inventado vira `null` no switch do renderer e some sem aviso; um
 * bloco de texto sem `text` renderiza uma caixa vazia que o usuário encontra
 * como um alvo de clique invisível no editor. Melhor podar aqui.
 */
function sanitizeBlocks(blocks: unknown, inFlow = false): FreeBlock[] {
  if (!Array.isArray(blocks)) return []
  const out: FreeBlock[] = []
  for (const raw of blocks) {
    if (!raw || typeof raw !== "object") continue
    const b = raw as Record<string, unknown>
    const type = b.type
    if (typeof type !== "string" || !VALID_BLOCK_TYPES.has(type)) continue
    if (type === "text" && !String(b.text ?? "").trim()) continue
    if (type === "image" && !String(b.url ?? "").trim()) continue
    if (type === "pill" && !String(b.text ?? "").trim()) continue
    if (type === "card" || type === "stack") {
      // Filhos de `stack` fluem — o renderizador ignora a `position` deles, e o
      // system prompt manda omiti-la. Exigir âncora aqui apagava exatamente os
      // stacks bem formados (título + corpo) e deixava o post sem conteúdo.
      const children = sanitizeBlocks(b.children, type === "stack")
      if (!children.length) continue
      out.push({ ...(b as object), children } as FreeBlock)
      continue
    }
    if (!inFlow && (!b.position || typeof b.position !== "object")) {
      // Fora de um stack não há fluxo: sem âncora o bloco empilha no canto
      // superior esquerdo por cima de tudo.
      continue
    }
    out.push(b as unknown as FreeBlock)
  }
  return out
}

/**
 * Força toda URL de imagem do spec a ser uma das que NÓS fornecemos.
 *
 * O modelo às vezes "completa" um url plausível (unsplash.com/photo-123,
 * cdn da marca) que não existe, ou reusa a foto do post num segundo bloco. Um
 * bloco image apontando pra fora vira imagem quebrada na arte final e, pior,
 * uma requisição a um host arbitrário na hora de exportar o PNG. Aqui o que
 * não está na allowlist é reescrito pra foto do post ou descartado.
 */
function pinImageUrls(
  blocks: FreeBlock[],
  allowed: Set<string>,
  fallback: string | null,
): FreeBlock[] {
  const out: FreeBlock[] = []
  for (const b of blocks) {
    if (b.type === "card" || b.type === "stack") {
      const children = pinImageUrls(b.children, allowed, fallback)
      if (!children.length) continue
      out.push({ ...b, children })
      continue
    }
    if (b.type === "image") {
      if (allowed.has(b.url)) {
        out.push(b)
      } else if (fallback) {
        out.push({ ...b, url: fallback })
      }
      // Sem fallback o bloco some — melhor um buraco no layout que um 404.
      continue
    }
    out.push(b)
  }
  return out
}

/**
 * Converte uma medida do spec pra porcentagem da largura do canvas, ou null
 * quando não dá pra saber. `%` e `cqw` já são a mesma escala (cqw = 1% da
 * largura); px e number cru são relativos a 1080.
 */
function toPercent(v: unknown): number | null {
  if (typeof v === "number") return (v / CANVAS_W) * 100
  if (typeof v !== "string") return null
  const s = v.trim()
  // Expressões como "min(7cqw, 48px)" não são âncoras — só aparecem em
  // font_size. Se aparecerem aqui, é mais seguro não mexer.
  if (/[a-z]\(/i.test(s)) return null
  const m = s.match(/^(-?[\d.]+)\s*(%|cqw|px)?$/i)
  if (!m) return null
  const n = parseFloat(m[1])
  if (Number.isNaN(n)) return null
  const unit = (m[2] ?? "px").toLowerCase()
  if (unit === "%" || unit === "cqw") return n
  return (n / CANVAS_W) * 100
}

/** Reescreve uma medida em % mantendo a intenção original. */
function pct(n: number): string {
  return `${Math.round(n * 100) / 100}%`
}

/**
 * Puxa blocos de volta pra dentro do canvas.
 *
 * Duas falhas reais do modelo, ambas silenciosas — nada quebra, o conteúdo
 * simplesmente some da área exportada:
 *
 * 1. âncora negativa (`left: "-8cqw"`);
 * 2. âncora somada à largura passando de 100% — o caso que motivou isto foi
 *    uma lista de itens emitida como blocos absolutos irmãos em `left: 96%`
 *    com `width: 44%`: os ícones ficaram visíveis e todo o texto ao lado saiu
 *    pela borda direita.
 *
 * A correção prefere encolher a largura (preserva a âncora que o modelo
 * escolheu); se não houver largura declarada, recua a âncora.
 */
function clampPositions(blocks: FreeBlock[]): FreeBlock[] {
  const AXES = ["top", "bottom", "left", "right"] as const
  const MARGIN = 2 // respiro mínimo em % pra não colar na borda
  return blocks.map((b) => {
    const next = { ...b } as FreeBlock & {
      position?: Record<string, unknown>
      children?: FreeBlock[]
    }
    if (next.position && typeof next.position === "object") {
      const pos = { ...next.position }
      for (const axis of AXES) {
        const v = pos[axis]
        if (typeof v === "number" && v < 0) pos[axis] = 0
        else if (typeof v === "string" && /^-/.test(v.trim())) {
          // "-8cqw" / "-5%" / "-12px" → preserva a unidade, zera o valor.
          pos[axis] = v.replace(/^-\s*[\d.]+/, "0")
        }
      }

      const left = toPercent(pos.left)
      const width = toPercent(pos.width)
      if (left != null && left > 100 - MARGIN) {
        // Âncora sozinha já fora: recua e deixa uma faixa utilizável.
        pos.left = pct(Math.max(0, 100 - MARGIN - (width ?? 20)))
      }
      const left2 = toPercent(pos.left)
      if (left2 != null && width != null && left2 + width > 100) {
        const room = 100 - left2 - MARGIN
        if (room > 5) pos.width = pct(room)
        else {
          pos.left = pct(Math.max(0, 100 - MARGIN - width))
        }
      }
      next.position = pos
    }
    if (Array.isArray(next.children)) {
      next.children = clampPositions(next.children)
    }
    return next as FreeBlock
  })
}

// =============================================================================
// Crítica programática — o revisor que reprova composição pobre
// =============================================================================
//
// O modelo às vezes entrega uma peça estruturalmente válida mas ruim: esquece
// os itens, solta texto saturado sobre foto, estoura o rodapé. Renderizar não
// dá pra fazer no servidor, mas dá pra AUDITAR o spec: os textos aprovados
// estão lá? os itens viraram lista com ícone? as cores têm contraste com o
// fundo declarado? a soma estimada das alturas cabe no canvas? Cada reprovação
// vira feedback textual e o modelo corrige na mesma conversa — compor custa só
// texto, então iterar aqui é barato e é o que separa "às vezes sai bom" de
// "sai bom sempre".

function normText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim()
}

/** Todo texto visível do spec, concatenado e normalizado. */
function collectAllText(blocks: FreeBlock[]): string {
  const out: string[] = []
  const walk = (bs: FreeBlock[]) => {
    for (const b of bs) {
      if (b.type === "text" || b.type === "pill") out.push(b.text)
      if (b.type === "card" || b.type === "stack") walk(b.children)
    }
  }
  walk(blocks)
  return normText(out.join(" "))
}

function countIcons(blocks: FreeBlock[]): number {
  let n = 0
  const walk = (bs: FreeBlock[]) => {
    for (const b of bs) {
      if (b.type === "icon") n++
      if (b.type === "card" || b.type === "stack") walk(b.children)
    }
  }
  walk(blocks)
  return n
}

/** Âncoras numéricas de lista: texts curtos tipo "01", "1.", "02)". */
function countNumericAnchors(blocks: FreeBlock[]): number {
  let n = 0
  const walk = (bs: FreeBlock[]) => {
    for (const b of bs) {
      if (b.type === "text" && /^0?\d{1,2}[.)]?$/.test(b.text.trim())) n++
      if (b.type === "card" || b.type === "stack") walk(b.children)
    }
  }
  walk(blocks)
  return n
}

/** Saturação HSL 0–1 — separa branco/cinza (ok sobre foto) de cor viva. */
function saturation(hex: string): number {
  const h = hex.replace("#", "").trim()
  if (!/^[0-9a-f]{6}$/i.test(h)) return 0
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === min) return 0
  const l = (max + min) / 2
  const d = max - min
  return l > 0.5 ? d / (2 - max - min) : d / (max + min)
}

interface HRange {
  l: number
  r: number
}

/** Faixa horizontal (em % da largura) que um bloco ocupa, se declarada. */
function hRange(pos: FreeBlock["position"] | undefined): HRange | null {
  if (!pos) return null
  const left = toPercent(pos.left)
  const width = toPercent(pos.width)
  const right = toPercent(pos.right)
  let l = left
  if (l == null && right != null && width != null) l = 100 - right - width
  let r: number | null = null
  if (l != null && width != null) r = l + width
  else if (right != null) r = 100 - right
  if (l == null && r == null) return null
  return { l: l ?? 0, r: r ?? 100 }
}

interface ExposedText {
  t: FreeTextBlock
  range: HRange
}

/**
 * Textos "desprotegidos": renderizados direto sobre o fundo do canvas, sem um
 * card/stack com bg próprio entre eles e a foto/cor de trás. Cada um sai com a
 * faixa horizontal herdada do container posicionado mais próximo — é ela que
 * diz SOBRE O QUÊ o texto realmente está (a coluna de foto ou a de cor).
 */
function collectExposedTexts(blocks: FreeBlock[]): ExposedText[] {
  const out: ExposedText[] = []
  const walk = (bs: FreeBlock[], shielded: boolean, inherited: HRange) => {
    for (const b of bs) {
      const range = hRange(b.position) ?? inherited
      if (b.type === "text" && !shielded) out.push({ t: b, range })
      if (b.type === "card") walk(b.children, true, range)
      if (b.type === "stack") walk(b.children, shielded || !!b.bg, range)
    }
  }
  walk(blocks, false, { l: 0, r: 100 })
  return out
}

/** Colunas de foto no nível raiz (imagem alta o bastante pra ser "fundo"). */
function photoZones(blocks: FreeBlock[]): HRange[] {
  const zones: HRange[] = []
  for (const b of blocks) {
    if (b.type !== "image") continue
    const h = toHeightPct(b.position?.height)
    if (h != null && h < 50) continue
    const range = hRange(b.position)
    if (range) zones.push(range)
  }
  return zones
}

/** Fração da faixa do texto coberta por alguma zona de foto. */
function photoOverlap(range: HRange, zones: HRange[]): number {
  const width = Math.max(range.r - range.l, 1)
  let covered = 0
  for (const z of zones) {
    covered = Math.max(
      covered,
      Math.min(range.r, z.r) - Math.max(range.l, z.l),
    )
  }
  return Math.max(0, covered) / width
}

/** Extrai o valor em cqw de "min(Xcqw, Ypx)" / "Xcqw" (fallback conservador). */
function cqwOf(size: string | undefined, fallback: number): number {
  if (!size) return fallback
  const m = size.match(/([\d.]+)\s*cqw/i)
  return m ? parseFloat(m[1]) : fallback
}

/** % da ALTURA do canvas (1350px). cqw entra na régua da largura (1080px). */
function toHeightPct(v: unknown): number | null {
  if (typeof v === "number") return (v / CANVAS_H) * 100
  if (typeof v !== "string") return null
  const m = v.trim().match(/^(-?[\d.]+)\s*(%|cqw|px)?$/i)
  if (!m) return null
  const n = parseFloat(m[1])
  const unit = (m[2] ?? "px").toLowerCase()
  if (unit === "%") return n
  if (unit === "cqw") return ((n * CANVAS_W) / 100 / CANVAS_H) * 100
  return (n / CANVAS_H) * 100
}

/** 1cqw de fonte ocupa ~esta fração da ALTURA do canvas, por linha. */
const CQW_TO_HEIGHT_PCT = ((CANVAS_W / 100) * 1.0) / (CANVAS_H / 100)

/**
 * Estimativa de altura (em % do canvas) de um bloco em fluxo, dada a largura
 * útil da coluna em cqw. Aproximação de auditoria, não de layout: serve pra
 * pegar estouro grosseiro do rodapé, não diferenças de 2%.
 */
/**
 * Caixa VISUAL de um texto, já considerando rotação.
 *
 * O `position` descreve a caixa antes de girar, e o CSS gira em torno do
 * centro — então pra um texto vertical (~±90°) a caixa que o olho vê é a mesma
 * com largura e altura trocadas em volta do mesmo centro. Sem isso, o texto
 * vertical "não sobrepunha" nada no papel e cobria a headline na tela.
 *
 * `null` quando não dá pra situar o bloco (sem left/right ou sem top): aí a
 * crítica não tem o que comparar e outra regra cuida.
 */
export function rotatedBox(
  b: FreeTextBlock,
): { h: HRange; top: number; height: number } | null {
  const h = hRange(b.position)
  const top = toHeightPct(b.position?.top)
  if (!h || top == null) return null

  const w = Math.max(h.r - h.l, 10)
  const height = estimateBlockHeightPct(b, w)

  const rot = Math.abs(((b.rotation ?? 0) % 180) + 180) % 180
  const vertical = rot > 60 && rot < 120
  if (!vertical) return { h, top, height }

  // Gira em torno do centro: o que era largura vira altura e vice-versa.
  // A largura em % do CANVAS e a altura em % da ALTURA não são a mesma
  // unidade — 1080×1350 —, então converte na troca.
  const cx = (h.l + h.r) / 2
  const cy = top + height / 2
  const newHalfW = (height * CANVAS_H) / CANVAS_W / 2
  const newHalfH = (w * CANVAS_W) / CANVAS_H / 2
  return {
    h: { l: cx - newHalfW, r: cx + newHalfW },
    top: cy - newHalfH,
    height: newHalfH * 2,
  }
}

function estimateBlockHeightPct(b: FreeBlock, colWidthCqw: number): number {
  switch (b.type) {
    case "text": {
      const f = cqwOf(b.font_size, 3.5) * (b.font_size_scale ?? 1)
      const lh = b.line_height ?? 1.15
      const segments = b.text.split("\n")
      let lines = 0
      for (const seg of segments) {
        // 0.6 char/cqw: um pouco pessimista de propósito — a régua otimista
        // (0.55) aprovava peça que na prática estourava o rodapé.
        lines += Math.max(
          1,
          Math.ceil((seg.length * 0.65 * f) / Math.max(colWidthCqw, 10)),
        )
      }
      return lines * f * lh * CQW_TO_HEIGHT_PCT
    }
    case "pill":
      return (cqwOf(b.font_size, 2.5) + 3.2) * CQW_TO_HEIGHT_PCT
    case "icon":
      return (cqwOf(b.size, 3.5) + 3.6) * CQW_TO_HEIGHT_PCT
    case "divider":
      return 0.6
    case "image":
      return toHeightPct(b.position?.height) ?? 8
    case "shape":
      return toHeightPct(b.position?.height) ?? 4
    case "card":
    case "stack": {
      const gap = cqwOf(
        typeof (b as { gap?: string }).gap === "string"
          ? (b as { gap?: string }).gap
          : undefined,
        2.5,
      )
      const kids = b.children
      if (b.type === "stack" && b.direction === "row") {
        // Linha: a altura é a do filho mais alto — mas o texto NÃO tem a
        // coluna inteira pra si: ícone e gaps comem largura. Descontar isso é
        // o que faz a régua bater com o render (era a folga que deixava item
        // estourar o rodapé com a crítica aprovando).
        const atomicWidth = kids.reduce((acc, k) => {
          if (k.type === "icon") {
            return (
              acc + cqwOf(k.size, 3.5) + 2 * cqwOf(k.padding ?? undefined, 1.8)
            )
          }
          if (k.type === "image" || k.type === "shape") {
            return acc + (toPercent(k.position?.width) ?? 10)
          }
          return acc
        }, 0)
        const flexWidth = Math.max(
          12,
          colWidthCqw - atomicWidth - gap * Math.max(0, kids.length - 1),
        )
        return Math.max(
          0,
          ...kids.map((k) => estimateBlockHeightPct(k, flexWidth)),
        )
      }
      const inner = kids.reduce(
        (acc, k) => acc + estimateBlockHeightPct(k, colWidthCqw),
        0,
      )
      return inner + Math.max(0, kids.length - 1) * gap * CQW_TO_HEIGHT_PCT
    }
    default:
      return 0
  }
}

/**
 * Audita o spec contra o conteúdo aprovado. Devolve a lista de reprovações —
 * vazia = aprovado. As mensagens são escritas PRO MODELO: dizem o que corrigir.
 *
 * `vocabulary` é o texto-fonte inteiro (slots + briefing + dados da marca):
 * é contra ele que a auditoria decide se um texto do spec foi INVENTADO.
 */
export function critiqueSpec(
  spec: FreePostSpec,
  content: SkeletonContent,
  vocabulary: string,
  /** Modo transcrição (Rota B2): as posições vêm de um design REAL renderizado
   * e boa parte da densidade está PINTADA na clean plate — as heurísticas de
   * densidade mínima e orçamento vertical estimado dão falso positivo. */
  transcription = false,
): string[] {
  const issues: string[] = []
  const allText = collectAllText(spec.blocks)

  // --- 1. Conteúdo aprovado presente, letra por letra -----------------------
  const requiredSlots: Array<[string, string | undefined]> = [
    ["title", content.title ?? content.title_lines?.join(" ")],
    ["subtitle", content.subtitle],
    ["body", content.body],
    ["cta_text", content.cta_text],
  ]
  for (const [slot, value] of requiredSlots) {
    if (value && !allText.includes(normText(value))) {
      issues.push(
        `O slot "${slot}" não aparece na arte (ou foi reescrito). Inclua EXATAMENTE: "${value}"`,
      )
    }
  }
  for (const [i, bl] of (content.bullets ?? []).entries()) {
    if (bl.label && !allText.includes(normText(bl.label))) {
      issues.push(
        `O rótulo do item ${i + 1} ("${bl.label}") não aparece na arte. Cada item vira um stack row com ícone + rótulo bold + frase.`,
      )
    }
    if (bl.text && !allText.includes(normText(bl.text))) {
      issues.push(
        `A frase do item ${i + 1} não aparece na arte. Inclua EXATAMENTE: "${bl.text}"`,
      )
    }
  }

  // --- 2. Itens têm âncora visual ------------------------------------------
  // Ícone circular OU número tipográfico ("01", "1.") — direções sóbrias
  // (data-poster, minimal-luxe) usam número, as demais usam ícone.
  const nBullets = content.bullets?.length ?? 0
  if (nBullets > 0) {
    const anchors = countIcons(spec.blocks) + countNumericAnchors(spec.blocks)
    if (anchors < nBullets) {
      issues.push(
        `Há ${nBullets} itens mas só ${anchors} âncora(s) visual(is). Cada item precisa de ícone circular OU número tipográfico ("01", "02"...) conforme a direção escolhida.`,
      )
    }
  }

  // --- 3. Contraste contra o que está ATRÁS de cada texto ------------------
  // O fundo declarado não é a história toda: uma coluna de foto cobre parte do
  // canvas, e o texto que vive nela responde às regras de foto, não à cor do
  // fundo (era o falso positivo que reprovava texto branco legítimo sobre a
  // foto escura de um split).
  const bg = spec.background
  const exposed = collectExposedTexts(spec.blocks)
  const zones = photoZones(spec.blocks)

  const checkOverPhoto = (t: FreeTextBlock, protectedByOverlay: boolean) => {
    // Transcrição (Rota B2): o fundo é a clean plate de um design REAL — as
    // zonas de texto já nascem protegidas NA PINTURA (painéis, gradientes), e
    // o compositor está VENDO os pixels. O crítico cego não pode exigir
    // overlay por cima do que não enxerga; fica só o veto de cor saturada.
    if (!transcription && !protectedByOverlay && !t.text_shadow) {
      issues.push(
        `Texto "${t.text.slice(0, 30)}" cru sobre foto sem proteção. Adicione overlay escura (photo_overlay opacity >= 0.5, ou um shape escuro sobre a zona da foto), ou mova o texto pra um card/stack com bg.`,
      )
      return
    }
    // Com text_shadow o texto ganha halo próprio — na Rota B o compositor VÊ
    // a cena e pode usar a paleta dela; reprovar toda cor viraria tudo
    // branco-sobre-escuro e mataria a integração com a cena.
    if (
      !t.text_shadow &&
      saturation(t.color) > 0.4 &&
      relativeLuminance(t.color) < 0.92
    ) {
      issues.push(
        `Cor saturada ${t.color} solta sobre foto ("${t.text.slice(0, 25)}"). Sobre foto, texto solto é branco/neutro (ou adicione text_shadow); cor da marca entra em pill, card ou highlight_color.`,
      )
    }
  }

  const ov = bg.kind === "photo" ? bg.photo_overlay : undefined
  const strongDarkOverlay =
    !!ov &&
    (ov.opacity ?? 0) >= 0.35 &&
    (ov.color === "black" || relativeLuminance(ov.color) < 0.35)

  for (const { t, range } of exposed) {
    if (bg.kind === "photo") {
      checkOverPhoto(t, strongDarkOverlay)
      continue
    }
    if (photoOverlap(range, zones) > 0.5) {
      // Texto dentro de uma coluna de foto: sem como medir a foto, aceita
      // branco/neutro (o modelo já escurece a coluna com shape) e reprova só
      // cor saturada — o caso que sempre dá errado.
      if (saturation(t.color) > 0.4 && relativeLuminance(t.color) < 0.92) {
        issues.push(
          `Cor saturada ${t.color} sobre a coluna de foto ("${t.text.slice(0, 25)}"). Ali o texto é branco/neutro.`,
        )
      }
      continue
    }
    if (bg.kind === "solid" && bg.color) {
      if (contrastRatio(t.color, bg.color) < 3) {
        issues.push(
          `Contraste insuficiente: texto ${t.color} sobre fundo ${bg.color} (${contrastRatio(t.color, bg.color).toFixed(1)}:1, mínimo 3:1). Troque a cor do texto "${t.text.slice(0, 30)}".`,
        )
      }
      if (t.highlight_color && contrastRatio(t.highlight_color, bg.color) < 3) {
        issues.push(
          `highlight_color ${t.highlight_color} ilegível sobre ${bg.color}. Use a cor escura da paleta ou remova o destaque.`,
        )
      }
    }
    if (bg.kind === "gradient" && bg.gradient_from && bg.gradient_to) {
      const worst = Math.min(
        contrastRatio(t.color, bg.gradient_from),
        contrastRatio(t.color, bg.gradient_to),
      )
      if (worst < 2.6) {
        issues.push(
          `Texto ${t.color} some numa das pontas do gradiente (${worst.toFixed(1)}:1). Ajuste a cor do texto ou do gradiente.`,
        )
      }
    }
  }

  // --- 3.5 Adorno atropelando conteúdo -------------------------------------
  // O modelo burla o campo `ghost` criando um bloco text gigante opaco por
  // cima do stack ("MANHÃ" em 28cqw sobre a headline). Ghost-like vira
  // reprovação direta; texto absoluto comum que invade a zona de um stack
  // também.
  {
    const stacks = spec.blocks.filter(
      (b): b is Extract<FreeBlock, { type: "stack" }> =>
        b.type === "stack" &&
        ((b as { direction?: string }).direction ?? "column") === "column" &&
        !!b.position,
    )
    for (const b of spec.blocks) {
      if (b.type !== "text") continue
      const f = cqwOf(b.font_size, 3.5)
      if (f >= 14) {
        issues.push(
          `Bloco de texto gigante "${b.text.slice(0, 20)}" (${f}cqw) por cima da arte. Palavra decorativa gigante vai no campo "ghost" do spec (que é translúcido) — nunca como bloco de texto.`,
        )
        continue
      }
      // Texto vertical (rotation ±90) NÃO é isento: ele é uma coluna
      // estreita, e era exatamente ele que atravessava a zona de conteúdo
      // sem reprovar. Modela a caixa girada: largura = ~5cqw, altura =
      // position.height (ou 40%).
      const vertical = b.rotation === -90 || b.rotation === 90
      const tRange = vertical
        ? (() => {
            const l = toPercent(b.position?.left)
            if (l == null) return null
            return { l, r: l + 5 }
          })()
        : hRange(b.position)
      const tTop = toHeightPct(b.position?.top)
      if (!tRange || tTop == null) continue
      const tHeight = vertical
        ? (toHeightPct(b.position?.height) ?? 40)
        : estimateBlockHeightPct(b, Math.max(tRange.r - tRange.l, 10))
      for (const s of stacks) {
        const sRange = hRange(s.position)
        const sTop = toHeightPct(s.position?.top)
        if (!sRange || sTop == null) continue
        const sHeight = estimateBlockHeightPct(
          s,
          Math.max(sRange.r - sRange.l, 10),
        )
        const hOverlap =
          Math.min(tRange.r, sRange.r) - Math.max(tRange.l, sRange.l)
        const vOverlap =
          Math.min(tTop + tHeight, sTop + sHeight) - Math.max(tTop, sTop)
        if (
          hOverlap > (tRange.r - tRange.l) * 0.3 &&
          vOverlap > 3
        ) {
          issues.push(
            `O texto absoluto "${b.text.slice(0, 25)}" cai em cima da zona do stack de conteúdo. Ou ele vira um filho do stack, ou muda pra um canto comprovadamente vazio.`,
          )
          break
        }
      }
    }

    // Coluna estreita demais: com nossas métricas de fonte, largura < 16%
    // com frase dentro vira uma palavra por linha vazando o canvas (visto na
    // transcrição do card lateral da cafeteria). Vale pra text solto e pra
    // stack/card inteiro.
    for (const b of spec.blocks) {
      const w = toPercent(b.position?.width)
      if (w == null || w >= 16) continue
      const texts: string[] = []
      const grab = (x: FreeBlock) => {
        if (x.type === "text" || x.type === "pill") texts.push(x.text)
        if (x.type === "card" || x.type === "stack") x.children.forEach(grab)
      }
      grab(b)
      const longo = texts.find((t) => t.trim().split(/\s+/).length > 3)
      if (longo) {
        issues.push(
          `Bloco de ${Math.round(w)}% de largura contém a frase "${longo.slice(0, 30)}" — estreito demais, sai uma palavra por linha. Alargue pra >= 24% e reduza a fonte.`,
        )
      }
    }

    // Dois textos absolutos irmãos um sobre o outro — a causa direta do
    // "subtítulo carimbado em cima do corpo". Estima a caixa dos dois e
    // reprova interseção real (não encostar de borda).
    // Bloco ROTACIONADO entra na checagem (antes era excluído por
    // `!b.rotation`, e era justamente ele que escapava): num post real o
    // "WARREN BUFFETT · INVESTIMENTO" vertical atravessou a headline sem
    // reprovar, porque ninguém comparava a caixa dele com nada.
    //
    // A caixa do `position` é a NÃO rotacionada; o CSS gira em torno do
    // centro. Pra ~±90° a caixa visual é a mesma com largura e altura
    // trocadas — é o que `rotatedBox` devolve. Ângulo oblíquo (ex: 30°) fica
    // de fora de propósito: a caixa envolvente exageraria e reprovaria peça
    // boa, e falso positivo aqui custa uma volta inteira do loop.
    const absTexts = spec.blocks.filter(
      (b): b is FreeTextBlock =>
        b.type === "text" && !!b.position && cqwOf(b.font_size, 3.5) < 14,
    )
    for (let i = 0; i < absTexts.length; i++) {
      for (let j = i + 1; j < absTexts.length; j++) {
        const a = absTexts[i]
        const c = absTexts[j]
        const ab = rotatedBox(a)
        const cb = rotatedBox(c)
        if (!ab || !cb) continue
        const { ar, aTop, aH } = { ar: ab.h, aTop: ab.top, aH: ab.height }
        const { cr, cTop, cH } = { cr: cb.h, cTop: cb.top, cH: cb.height }
        const hOv = Math.min(ar.r, cr.r) - Math.max(ar.l, cr.l)
        const vOv = Math.min(aTop + aH, cTop + cH) - Math.max(aTop, cTop)
        // O limiar de 8% foi calibrado pra dois blocos LARGOS; um texto
        // vertical tem ~5% de largura e jamais o alcançaria — sobrepor a
        // headline inteira ainda daria "sem conflito". Agora o limiar é
        // relativo ao MENOR dos dois: 8% para blocos largos (comportamento
        // idêntico ao anterior) e 60% da largura quando um deles é estreito.
        const minW = Math.min(ar.r - ar.l, cr.r - cr.l)
        const hThresh = Math.min(8, 0.6 * minW)
        if (hOv > hThresh && vOv > 2.5) {
          issues.push(
            `Os textos "${a.text.slice(0, 20)}" e "${c.text.slice(0, 20)}" se sobrepõem (mesma zona). Textos da mesma região são filhos de UM stack — reorganize.`,
          )
        }
      }
    }
  }

  // --- 4. Orçamento vertical -----------------------------------------------
  for (const b of spec.blocks) {
    if (b.type !== "stack" || (b.direction ?? "column") !== "column") continue
    const top = toHeightPct(b.position?.top)
    if (top == null) continue
    const widthCqw =
      toPercent(b.position?.width) ??
      (b.position?.left != null && b.position?.right != null ? 60 : 45)
    const est = estimateBlockHeightPct(b, widthCqw)
    // 91, não 100: os ~9% finais são do rodapé — invadi-los é o defeito
    // visível mais frequente (último item cortado, handle por cima do texto).
    if (transcription) continue
    if (top + est > 90) {
      issues.push(
        `O stack de conteúdo começa em ${Math.round(top)}% e soma ~${Math.round(est)}% de altura — invade a faixa do rodapé (os últimos 9% do canvas). SEM cortar nem encurtar nenhum texto: alargue a coluna de texto (>= 55% da largura, foto em 40-45%), diminua o corpo dos itens (rótulo min(2.8cqw,16px), frase min(2.4cqw,14px)), aperte gaps e comece o stack em top 5-6%. A soma top+altura precisa ficar <= 88%.`,
      )
    }
  }

  // --- 5. Texto inventado ---------------------------------------------------
  // O modelo cria CTAs e frases que não vieram de slot nenhum ("Leia a
  // história completa") — e texto fantasma desses estoura layout e polui a
  // peça. Um texto longo cujas palavras não existem no material fornecido só
  // pode ter sido inventado. (Selos e kickers curtos derivados passam: o
  // limite de 18 caracteres e o teste por palavra os deixam em paz.)
  {
    const vocab = new Set(normText(vocabulary).split(" "))
    const texts: string[] = []
    const walk = (bs: FreeBlock[]) => {
      for (const b of bs) {
        if (b.type === "text" || b.type === "pill") texts.push(b.text)
        if (b.type === "card" || b.type === "stack") walk(b.children)
      }
    }
    walk(spec.blocks)
    for (const raw of texts) {
      if (raw.length < 18) continue
      const words = normText(raw)
        .split(" ")
        .filter((w) => w.length >= 4)
      if (!words.length) continue
      const unknown = words.filter((w) => !vocab.has(w))
      if (unknown.length / words.length > 0.5) {
        issues.push(
          `Texto inventado na arte: "${raw.slice(0, 40)}" — não veio de nenhum slot. Remova o bloco; use apenas os textos fornecidos.`,
        )
      }
    }
  }

  // --- 5b. Handle que não é o da marca --------------------------------------
  // "@marca" do exemplo é corrigido deterministicamente (fixBrandHandle), mas
  // o modelo também inventa handles de terceiros — e a checagem de texto
  // inventado pula strings curtas.
  {
    // O vocabulário carrega o handle da marca (com ou sem @) — qualquer
    // @handle da arte cujo miolo não esteja no vocabulário foi inventado.
    const vocabWords = new Set(
      vocabulary
        .toLowerCase()
        .split(/[^a-z0-9_.@]+/)
        .flatMap((w) => [w, w.replace(/^@/, "")])
        .filter(Boolean),
    )
    const texts: string[] = []
    const walk = (bs: FreeBlock[]) => {
      for (const b of bs) {
        if (b.type === "text" || b.type === "pill") texts.push(b.text)
        if (b.type === "card" || b.type === "stack") walk(b.children)
      }
    }
    walk(spec.blocks)
    for (const raw of texts) {
      for (const m of raw.matchAll(/@[a-z0-9_.]{2,}/gi)) {
        const core = m[0].slice(1).toLowerCase()
        if (!vocabWords.has(core)) {
          issues.push(
            `Handle "${m[0]}" não é o da marca. Use exatamente o handle fornecido na seção MARCA.`,
          )
        }
      }
    }
  }

  // --- 6. Densidade mínima --------------------------------------------------
  const textBlocks = allText.split(" ").length
  if (!transcription && (spec.blocks.length < 3 || textBlocks < 8)) {
    issues.push(
      `A composição está rala (${spec.blocks.length} blocos). Um post editorial tem camadas: assinatura da marca, kicker, headline, apoio${nBullets ? ", os itens com ícone" : ""} e rodapé.`,
    )
  }

  return issues
}

function sumUsages(usages: Anthropic.Messages.Usage[]): Anthropic.Messages.Usage {
  const total = { ...usages[0] }
  for (const u of usages.slice(1)) {
    total.input_tokens += u.input_tokens
    total.output_tokens += u.output_tokens
    total.cache_creation_input_tokens =
      (total.cache_creation_input_tokens ?? 0) +
      (u.cache_creation_input_tokens ?? 0)
    total.cache_read_input_tokens =
      (total.cache_read_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0)
  }
  return total
}

export interface ComposeResult {
  spec: FreePostSpec
  usage: Anthropic.Messages.Usage
  /** Quantas chamadas ao modelo o loop gastou (1..MAX_COMPOSE_ATTEMPTS). */
  attempts: number
  /**
   * Tentativa em que a crítica aprovou. `null` = estourou o teto e entregou a
   * menos ruim. É a série que decide se `MAX_COMPOSE_ATTEMPTS = 4` se paga:
   * sem ela, baixar o teto é chute.
   */
  approvedOnAttempt: number | null
}

export interface ComposeOpts {
  brand: PostBrand
  content: SkeletonContent
  photoUrl: string | null
  /** Referência COMPLETA (com tipografia) da Rota B2 — quando presente, o
   * compositor TRANSCREVE o layout dela em vez de inventar um. */
  referenceUrl?: string | null
  briefing?: string | null
}

/**
 * Pede à IA a composição do post. Devolve `null` quando o modelo entrega algo
 * que não dá pra renderizar — quem chama decide o fallback (hoje: skeleton).
 */
/**
 * Ghost word é marca d'água: SEMPRE translúcida. O modelo às vezes manda a cor
 * da marca opaca e o ghost gigante atropela o conteúdo — corrigir aqui é
 * determinístico e não gasta uma volta de retry.
 */
function subtleGhostColor(color: string): string {
  const rgba = color.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/i)
  if (rgba) {
    const alphaRaw = rgba[4]
    let alpha = alphaRaw
      ? alphaRaw.endsWith("%")
        ? parseFloat(alphaRaw) / 100
        : parseFloat(alphaRaw)
      : 1
    if (!(alpha <= 0.14)) alpha = 0.09
    return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${alpha})`
  }
  const hex = color.replace("#", "").trim()
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, 0.09)`
  }
  return "rgba(255, 255, 255, 0.07)"
}

/**
 * Troca o handle do EXEMPLO do system prompt pelo handle real da marca.
 *
 * O exemplo completo do prompt assina o rodapé com "@marca", e o modelo copia
 * a mecânica COM o literal — a crítica de texto inventado pula strings curtas
 * (< 18 chars), então "@marca" atravessava as 4 tentativas sem reprovar.
 * Corrigir aqui é determinístico e não gasta retry.
 */
function fixBrandHandle(blocks: FreeBlock[], brand: PostBrand): FreeBlock[] {
  const core =
    brand.instagram_handle?.replace(/^@/, "").trim() ||
    brand.name.toLowerCase().replace(/\s+/g, "")
  const handle = "@" + core
  const fix = (bs: FreeBlock[]): FreeBlock[] =>
    bs.map((b) => {
      if (
        (b.type === "text" || b.type === "pill") &&
        /@[a-z0-9_.]{2,}/i.test(b.text)
      ) {
        // Qualquer @handle que não seja o da marca vira o handle real — cobre
        // o "@marca" do exemplo E handles inventados de terceiros.
        const fixed = b.text.replace(/@[a-z0-9_.]{2,}/gi, (m) =>
          m.slice(1).toLowerCase() === core.toLowerCase() ? m : handle,
        )
        if (fixed !== b.text) {
          console.info(`[compose] handle corrigido: "${b.text}" -> "${fixed}"`)
        }
        return { ...b, text: fixed }
      }
      if (b.type === "card" || b.type === "stack") {
        return { ...b, children: fix(b.children) }
      }
      return b
    })
  return fix(blocks)
}

/** Sanitiza/normaliza o input do tool use num FreePostSpec renderizável. */
function buildSpec(
  parsed: unknown,
  brand: PostBrand,
  photoUrl: string | null,
): FreePostSpec | null {
  const obj = parsed as Record<string, unknown>
  const allowed = new Set<string>()
  if (photoUrl) allowed.add(photoUrl)
  if (brand.logo_url) allowed.add(brand.logo_url)

  const blocks = fixBrandHandle(
    clampPositions(pinImageUrls(sanitizeBlocks(obj?.blocks), allowed, photoUrl)),
    brand,
  )
  if (!blocks.length) return null
  const background = obj?.background
  if (!background || typeof background !== "object") return null

  // Mesmo tratamento no fundo: se a IA pediu foto, ela só pode ser a nossa.
  const bg = { ...(background as FreePostSpec["background"]) }
  if (bg.kind === "photo") {
    if (photoUrl) {
      bg.photo_url = photoUrl
    } else {
      // Pediu foto sem foto disponível — vira sólido pra não renderizar vazio.
      bg.kind = "solid"
      bg.color = bg.color ?? buildPalette(brand).dark
      delete bg.photo_url
    }
  } else {
    delete bg.photo_url
  }

  const ghost = (obj?.ghost as FreePostSpec["ghost"]) ?? undefined
  if (ghost?.color) ghost.color = subtleGhostColor(ghost.color)

  return {
    version: 1,
    background: bg,
    blocks,
    ghost,
    rationale: typeof obj?.rationale === "string" ? obj.rationale : undefined,
  }
}

const COMPOSE_TOOL: Anthropic.Messages.Tool = {
  name: "entregar_composicao",
  description: "Entrega o FreePostSpec composto.",
  // `blocks` fica como array de objetos livres de propósito: a estrutura é
  // recursiva e quem valida é o sanitizador + a crítica, não o schema.
  input_schema: {
    type: "object" as const,
    properties: {
      version: { type: "number" },
      background: { type: "object" },
      blocks: { type: "array", items: { type: "object" } },
      ghost: { type: "object" },
      rationale: { type: "string" },
    },
    required: ["version", "background", "blocks"],
  },
}

/**
 * RETRY POR PATCH — a tentativa 2+ corrige, não reescreve.
 *
 * Até aqui toda reprovação pedia "reenvie o spec COMPLETO": o modelo regerava
 * os ~700 tokens inteiros pra mudar um `top` — e output é o token mais caro da
 * tabela (US$15/Mtok contra US$3 do input). Com o patch a volta custa ~200
 * tokens em vez de ~700, e o que já estava aprovado não corre risco de ser
 * reescrito pior (o modelo não "erra diferente" num bloco que ninguém pediu
 * pra mexer).
 *
 * Os índices vêm do spec JÁ SANEADO (ver `blockInventory`), não do que o
 * modelo emitiu: `buildSpec` descarta bloco inválido, então os dois arrays
 * podem divergir — e um índice fora de fase corromperia a peça em silêncio.
 */
const PATCH_TOOL: Anthropic.Messages.Tool = {
  name: "corrigir_blocos",
  description:
    "Corrige APENAS os pontos reprovados da composição anterior. Não reenvie o spec inteiro — mexa só no que a revisão apontou.",
  input_schema: {
    type: "object" as const,
    properties: {
      replace: {
        type: "array",
        description:
          "Blocos a substituir. `index` é a posição no inventário que veio na revisão. `block` é o bloco COMPLETO já corrigido.",
        items: {
          type: "object",
          properties: { index: { type: "number" }, block: { type: "object" } },
          required: ["index", "block"],
        },
      },
      remove: {
        type: "array",
        items: { type: "number" },
        description: "Índices de blocos a remover (ex: bloco sobrando).",
      },
      append: {
        type: "array",
        items: { type: "object" },
        description: "Blocos novos a acrescentar no fim.",
      },
      background: {
        type: "object",
        description: "SÓ se o fundo foi reprovado. Senão omita.",
      },
      ghost: {
        type: "object",
        description: "SÓ se o ghost foi reprovado. Senão omita.",
      },
      rationale: { type: "string" },
    },
  },
}

interface BlockPatch {
  replace?: { index?: number; block?: unknown }[]
  remove?: number[]
  append?: unknown[]
  background?: unknown
  ghost?: unknown
  rationale?: string
}

/**
 * Lista os blocos com o índice que o modelo deve usar no patch. Sai do spec
 * saneado — é ele que a gente tem em mãos pra aplicar a correção.
 */
export function blockInventory(spec: FreePostSpec): string {
  return spec.blocks
    .map((b, i) => {
      const rec = b as unknown as Record<string, unknown>
      const kind = String(rec.type ?? "?")
      const label =
        typeof rec.text === "string"
          ? ` "${rec.text.replace(/\n/g, " ").slice(0, 40)}"`
          : typeof rec.url === "string"
            ? " (imagem)"
            : typeof rec.shape === "string"
              ? ` (${String(rec.shape)})`
              : ""
      return `${i}. ${kind}${label}`
    })
    .join("\n")
}

/**
 * Aplica o patch sobre o spec anterior e devolve o objeto CRU — quem sanea é
 * o `buildSpec` de sempre, então patch e composição inteira passam pela mesma
 * porta. Índice inválido é ignorado em vez de derrubar a peça.
 */
export function applyBlockPatch(
  base: FreePostSpec,
  patch: BlockPatch,
): Record<string, unknown> {
  const blocks: unknown[] = [...(base.blocks as unknown[])]

  for (const r of patch.replace ?? []) {
    const i = r?.index
    if (
      typeof i === "number" &&
      Number.isInteger(i) &&
      i >= 0 &&
      i < blocks.length &&
      r.block &&
      typeof r.block === "object"
    ) {
      blocks[i] = r.block
    }
  }

  // Decrescente: remover de trás pra frente não desloca o que ainda falta.
  const remove = [...new Set(patch.remove ?? [])]
    .filter((i) => Number.isInteger(i) && i >= 0 && i < blocks.length)
    .sort((a, b) => b - a)
  for (const i of remove) blocks.splice(i, 1)

  for (const b of patch.append ?? []) {
    if (b && typeof b === "object") blocks.push(b)
  }

  return {
    version: 1,
    background: patch.background ?? base.background,
    blocks,
    ghost: patch.ghost ?? base.ghost,
    rationale: patch.rationale ?? base.rationale,
  }
}

/**
 * Move o breakpoint de cache pro fim da conversa: tira o marcador da volta
 * anterior e põe no bloco recém-acrescentado. Sem tirar o antigo a gente
 * estouraria os 4 breakpoints da API já na terceira tentativa.
 */
export function moveCacheBreakpoint(
  messages: Anthropic.Messages.MessageParam[],
): void {
  for (const m of messages.slice(1)) {
    if (!Array.isArray(m.content)) continue
    for (const b of m.content) {
      if (b && typeof b === "object" && "cache_control" in b) {
        delete (b as { cache_control?: unknown }).cache_control
      }
    }
  }
  const last = messages[messages.length - 1]
  if (last && Array.isArray(last.content) && last.content.length) {
    const tail = last.content[last.content.length - 1] as {
      cache_control?: unknown
    }
    tail.cache_control = { type: "ephemeral" }
  }
}

/**
 * Quantas vezes o compositor tenta até entregar uma peça aprovada.
 *
 * Continua 4 por padrão: baixar o teto sem a distribuição real de
 * `approved_on_attempt` (ver migration 0017) é degradar arte no escuro. Mas
 * agora sai por env — quando o dado disser que a 3ª e a 4ª volta não pagam,
 * `COMPOSE_MAX_ATTEMPTS=2` resolve sem deploy de código.
 */
const MAX_COMPOSE_ATTEMPTS = Math.min(
  6,
  Math.max(1, Number(process.env.COMPOSE_MAX_ATTEMPTS) || 4),
)

export async function composeSpec({
  brand,
  content,
  photoUrl,
  referenceUrl,
  briefing,
}: ComposeOpts): Promise<ComposeResult | null> {
  const client = getClient()

  // Conversa acumulativa: cada tentativa reprovada volta como tool_result com
  // a lista de reprovações, e o modelo corrige NO CONTEXTO do que já fez — em
  // vez de recomeçar do zero e errar diferente. O system prompt (grande) é
  // cacheado, então cada volta paga quase só o delta.
  // A dupla de direções é sorteada UMA vez por geração e vale pro loop
  // inteiro: o retry corrige a execução da direção, não a re-sorteia.
  const directions = pickDirections(!!photoUrl)
  const promptText = buildUserPrompt(
    brand,
    content,
    photoUrl,
    referenceUrl ?? null,
    briefing ?? null,
    directions,
  )
  // ROTA B2: com referência, o compositor VÊ o design pronto ([1]) e o fundo
  // limpo ([2]) e transcreve o layout. Sem referência mas com foto, vê a cena
  // e posiciona nas zonas limpas. Sem foto, tipográfico puro.
  //
  // As imagens vão INLINE (base64), não por URL: a Anthropic não baixa
  // upload.wikimedia.org, e o erro voltava como falha de rede — o loop queimava
  // as 3 tentativas e devolvia null, jogando toda peça de foto real no
  // skeleton. Ver lib/generation/fetch-image.ts. Se o download falhar,
  // `imageBlockFor` degrada pro bloco de URL (comportamento antigo).
  const imageBlocks: Anthropic.Messages.ContentBlockParam[] = (
    await Promise.all(
      [referenceUrl, photoUrl]
        .filter((u): u is string => !!u)
        .map((u) => imageBlockFor(u)),
    )
  ).map((b) => b as Anthropic.Messages.ContentBlockParam)
  // CACHE INCREMENTAL — o item mais caro da fatura, não o system prompt.
  // O system (~5k tokens) já era cacheado, mas as IMAGENS e a conversa
  // acumulada iam CRUAS em toda tentativa: 2 imagens de ~1,9k tokens cada,
  // reenviadas nas 4 voltas, davam mais que o output inteiro do loop.
  // Um breakpoint no fim da mensagem inicial congela imagens + prompt; outro,
  // MÓVEL (ver `moveCacheBreakpoint`), congela o que já foi corrigido a cada
  // volta. A API aceita 4 breakpoints — usamos 3 (system + inicial + móvel).
  const messages: Anthropic.Messages.MessageParam[] = [
    {
      role: "user",
      content: [
        ...imageBlocks,
        {
          type: "text" as const,
          text: promptText,
          cache_control: { type: "ephemeral" as const },
        },
      ],
    },
  ]
  const usages: Anthropic.Messages.Usage[] = []
  let best: { spec: FreePostSpec; issues: string[] } | null = null
  // Última composição RENDERIZÁVEL — é sobre ela que o patch da próxima volta
  // é aplicado. Diferente de `best`: aqui interessa a mais RECENTE (a que o
  // modelo tem no contexto), não a menos ruim.
  let lastSpec: FreePostSpec | null = null
  // Erro de rede não é reprovação: repete a MESMA tentativa (a conversa não
  // muda) em vez de abortar o loop — abortar entregava a última reprovada.
  let networkErrors = 0
  // Só dá pra pedir patch se existe uma composição anterior pra corrigir. Se a
  // 1ª tentativa vier irrenderizável, a 2ª recompõe do zero em vez de tentar
  // remendar o que não existe.
  let canPatch = false
  // Pendências da volta anterior — alimenta a parada por estagnação.
  let prevIssueCount: number | null = null

  let attempt = 1
  while (attempt <= MAX_COMPOSE_ATTEMPTS) {
    let response: Anthropic.Messages.Message
    try {
      response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        // A direção sorteada é o guard-rail; a temperatura fica no meio do
        // caminho — alta o bastante pra variar a execução, baixa o bastante
        // pra não degradar o spec (o schema vem do tool use, não da temp).
        temperature: 0.75,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        // Tool use em vez de JSON em bloco de texto: os textos aprovados vêm
        // cheios de aspas e travessões, e uma aspas não escapada derrubava o
        // parse — o post caía calado no skeleton.
        //
        // As DUAS tools vão sempre no array (elas moram no prefixo cacheado,
        // então listar as duas é de graça); quem muda por tentativa é só o
        // `tool_choice`: compõe do zero na 1ª, corrige por patch nas demais.
        tools: [COMPOSE_TOOL, PATCH_TOOL],
        tool_choice: canPatch
          ? { type: "tool", name: "corrigir_blocos" }
          : { type: "tool", name: "entregar_composicao" },
        messages,
      })
    } catch (err) {
      networkErrors++
      console.warn(
        `[compose] chamada ao Claude falhou (erro ${networkErrors}):`,
        err,
      )
      if (networkErrors > 2) break
      await new Promise((r) => setTimeout(r, 1500))
      continue
    }
    usages.push(response.usage)

    if (response.stop_reason === "max_tokens") {
      console.warn("[compose] resposta cortada no limite de tokens")
      break
    }
    const block = response.content.find((b) => b.type === "tool_use")
    if (!block || block.type !== "tool_use") {
      console.warn("[compose] Claude não retornou a composição estruturada")
      break
    }

    // Patch entra pela MESMA porta da composição inteira: aplica sobre o spec
    // anterior e sanea com `buildSpec`. Se o modelo devolveu patch mas não há
    // base (não deveria acontecer — `canPatch` guarda isso), trata como falha
    // de composição em vez de renderizar lixo.
    // Anotado: `lastSpec` recebe `spec` no fim da volta, então sem o tipo
    // explícito o TS entra em ciclo (raw → spec → lastSpec → raw).
    const raw: unknown =
      block.name === "corrigir_blocos"
        ? lastSpec
          ? applyBlockPatch(lastSpec, block.input as BlockPatch)
          : null
        : block.input
    const spec: FreePostSpec | null = raw
      ? buildSpec(raw, brand, photoUrl)
      : null
    const vocabulary = [
      ...Object.values(content).flatMap((v) =>
        Array.isArray(v)
          ? v.map((x) =>
              typeof x === "object" && x ? `${x.label} ${x.text}` : String(x),
            )
          : [String(v ?? "")],
      ),
      briefing ?? "",
      brand.name,
      brand.instagram_handle ?? "",
      // Mesmo fallback de handle do fixBrandHandle: sem isso, o handle
      // derivado do nome ("@perfilpessoal") reprovaria como inventado.
      brand.name.toLowerCase().replace(/\s+/g, ""),
      brand.tagline ?? "",
      brand.profession ?? "",
    ].join(" ")
    const issues = spec
      ? critiqueSpec(spec, content, vocabulary, !!referenceUrl)
      : [
          "O spec não tinha blocos renderizáveis ou veio sem background. Reenvie o spec COMPLETO seguindo o schema — todo bloco fora de stack precisa de position.",
        ]

    if (spec && issues.length === 0) {
      console.info(
        `[compose] aprovado na tentativa ${attempt} — ${spec.rationale ?? "sem rationale"}`,
      )
      return {
        spec,
        usage: sumUsages(usages),
        attempts: attempt,
        approvedOnAttempt: attempt,
      }
    }
    console.info(
      `[compose] tentativa ${attempt} reprovada (${issues.length}):`,
      issues.map((i) => i.slice(0, 90)),
    )
    if (spec && (best === null || issues.length < best.issues.length)) {
      best = { spec, issues }
    }
    if (spec) lastSpec = spec

    // PARADA POR ESTAGNAÇÃO. O retry só se paga enquanto converge: se a volta
    // corrigiu tanto quanto quebrou (contagem não caiu), a seguinte tende a
    // trocar seis por meia dúzia — e cada volta é uma chamada cheia. Sai com a
    // melhor tentativa em vez de gastar o teto até o fim.
    //
    // Regra deliberadamente conservadora: exige uma volta já feita, então a
    // 1ª→2ª sempre acontece. Quem corta o teto é a série de
    // `approved_on_attempt`; isto aqui só evita o caso claro de não-melhora.
    if (spec && prevIssueCount !== null && issues.length >= prevIssueCount) {
      console.info(
        `[compose] estagnou na tentativa ${attempt} (${prevIssueCount} → ${issues.length} pendências) — entregando a melhor`,
      )
      break
    }
    prevIssueCount = issues.length

    if (attempt < MAX_COMPOSE_ATTEMPTS) {
      // Com base renderizável a próxima volta CORRIGE (patch, ~200 tokens de
      // output); sem base, recompõe do zero. O inventário de índices só faz
      // sentido no primeiro caso.
      canPatch = lastSpec !== null
      const lista = issues.map((s, i) => `${i + 1}. ${s}`).join("\n")
      const instrucao = canPatch
        ? `Corrija TODOS os pontos com a tool \`corrigir_blocos\`, mexendo SÓ nos blocos envolvidos — não reenvie o que já está bom.\n\nCOMPOSIÇÃO ATUAL (use estes índices em replace/remove):\n${blockInventory(lastSpec as FreePostSpec)}`
        : "Reenvie o spec COMPLETO pela tool `entregar_composicao` seguindo o schema — todo bloco fora de stack precisa de position."
      messages.push(
        { role: "assistant", content: response.content },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: block.id,
              content: `REVISÃO REPROVADA — ${issues.length} problema(s):\n${lista}\n\n${instrucao}`,
            },
          ],
        },
      )
      moveCacheBreakpoint(messages)
    }
    attempt++
  }

  // Nenhuma tentativa saiu perfeita: devolve a menos ruim — continua melhor
  // que cair no skeleton. As pendências ficam no log pra calibrar a crítica.
  const spent = usages.length
  if (best) {
    console.warn(
      `[compose] entregando melhor tentativa com ${best.issues.length} pendência(s)`,
    )
    return {
      spec: best.spec,
      usage: sumUsages(usages),
      attempts: spent,
      approvedOnAttempt: null,
    }
  }
  return null
}
