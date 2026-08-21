# Estudo: hook, copy e direção de arte

**Data:** 19/08/2026
**Motivação:** o carrossel gerado a partir do artigo da arquiteta Marilia Pellegrini (culturizese.com.br) saiu com uma capa que não tem relação com o assunto — uma foto escura de uma mulher qualquer escrevendo numa mesa — e um hook que sonega o fato principal.
**Método:** 6 frentes de pesquisa em paralelo (manchete de jornal, dois perfis de referência, copy de carrossel, direção de arte editorial, autópsia do nosso pipeline) + leitura direta de 14 capas reais do concorrente.

---

## 0. TL;DR — as 8 mudanças que valem mais

| # | Mudança | Onde | Impacto |
|---|---|---|---|
| 1 | Trocar `searchWikimedia` por `searchWikimediaPerson` na cascata do carrossel | `lib/carousel/generate-images.ts:111-131` | Mata a classe de bug "foto de outra pessoa". Já foi corrigido no post único e nunca chegou no carrossel |
| 2 | Devolver e usar o `og:image` do artigo como candidata nº1 de capa | `app/api/extract-content/route.ts:104-108` | A foto certa já estava na mão e foi jogada fora. É grátis e economiza 25 tokens |
| 3 | `extract-content` devolver JSON estruturado (entidades, obras, números, vocabulário visual) em vez de um parágrafo | `app/api/extract-content/route.ts:8-19` | O gargalo do pipeline inteiro. A imagem nunca soube do que o artigo falava |
| 4 | Ligar o grounding (busca web) também no modo link | `app/dashboard/criar/page.tsx:741` | Hoje o fluxo que mais precisa de contexto é o único sem ele |
| 5 | Regra de veracidade como código, não como instrução de prompt | novo, em `lib/carousel/` | Nome próprio de pessoa no texto ⇒ proibido rosto gerado e proibido rosto de banco de imagens |
| 6 | Reescrever o bloco de `image_prompt` (categorias + espaço negativo + sujeito = obra) | `lib/generation/claude.ts:192-223` | É literalmente o texto que produziu a foto errada |
| 7 | Adicionar o registro "briefing é notícia" na copy | `lib/generation/claude.ts:131-166` | Hoje todo prompt é de copy de funil; notícia vira slogan |
| 8 | Fallback tipográfico (família D) sempre disponível | renderer | Capa tipográfica honesta é melhor que foto genérica mentirosa |

---

## 1. Autópsia do caso Marilia Pellegrini

### 1.1 O que o artigo era
A arquiteta brasileira Marilia Pellegrini entrou no **Architects' Directory 2026 da revista Wallpaper\***. Obras citadas: Casa das Palmeiras (Alphaville), Casa Contêiner (Casacor SP 2019, 60 m²), Casa 1111. Vocabulário visual do texto: volumes brancos e baixos, curvas precisas, grandes aberturas, integração com jardim e mata, pedra, madeira, paleta neutra. A própria página tem **duas fotos da arquiteta** e um `og:image`.

### 1.2 O que saiu
- **Capa:** foto escura de uma mulher desconhecida escrevendo numa mesa.
- **Hook:** "30 ESCRITÓRIOS NO MUNDO. UM É DE SÃO PAULO." com subtítulo "A Wallpaper escolheu Marilia Pellegrini pro Architects' Directory 2026."

O hook não é ruim como slogan — é ruim como manchete. Ele **sonega o protagonista, o feito e a fonte**, e joga tudo isso para o subtítulo. Manchete de jornal faria o contrário: o fato na frente.

### 1.3 Por que a imagem deu errado — cadeia completa

Nenhum elo da cadeia carrega o assunto do artigo.

1. **O grounding está desligado no modo link.** `app/dashboard/criar/page.tsx:741` só chama `/api/refine-prompt` quando `comoCriar !== "link"`. O fluxo que mais precisa de contexto externo é o único que não tem.
2. **O artigo vira um parágrafo de 3-5 frases.** O prompt de `extract-content` (`app/api/extract-content/route.ts:8-19`) não pede nada visual: nem entidades nomeadas, nem obras, nem substantivos concretos. Tudo que o pipeline de imagem vai saber do artigo passa por esse funil.
3. **As fotos reais do artigo são descartadas.** `lib/extract-url.ts:90` captura o `og:image`; `app/api/extract-content/route.ts:104-108` devolve só `briefing`, `title` e `source_url`.
4. **O prompt de imagem empurra para o clichê.** `lib/generation/claude.ts:192-223` tem um menu de categorias (tech, finanças, política, direito) que **não inclui arquitetura/design/cultura**. Uma arquiteta cai em "retrato profissional" → *"pessoa no CONTEXTO da profissão"* (`:211`) → e o menu de luz oferece `dim tungsten`, `cold blue monitor light` (`:215`). O exemplo canônico do próprio prompt é uma pessoa digitando numa mesa em luz baixa (`:218`). Depois a capa ainda recebe `STYLE_PROMPTS.cinematic` = *"dramatic lighting, deep shadows, moody atmosphere"* (`lib/editorial/ai-images.ts:23-24`).

   **"Mulher escrevendo numa mesa, escuro" é o output esperado desse prompt.** A regra "sem metáforas" matou o clichê antigo (navios, lâmpadas) e criou um novo: o clichê do profissional genérico.
5. **Se veio da Wikimedia, veio sem validação nenhuma.** `searchWikimedia` (`lib/generation/wikimedia.ts:209-256`) faz `wbsearchentities` com `limit=1` e **usa o primeiro hit sem comparar o label com a query**; se falha, cai em busca full-text `gsrlimit=1` e pega a `pageimage` do primeiro artigo que contenha os tokens. Marilia Pellegrini não tem verbete — então volta a foto de outra pessoa. As travas `isHuman` e `isUsablePhoto()` existem, mas só em `searchWikimediaPerson` (`:264-284`), que **não é usada nesse caminho**. O único filtro aplicado é de proporção (rejeita logo largo).

   O próprio código documenta que isso já queimou antes: `lib/single-posts/free-generate.ts:200-205` conta que a busca genérica trouxe o pôster da novela "Terra e Paixão" como fundo. **O post único foi corrigido; o carrossel nunca foi.**
6. **A rede de segurança tem um bug de ordenação.** `properNounCandidates` ordena candidatos do mais longo para o mais curto (`lib/carousel/extract-entities.ts:63`). No subtítulo real, `"Architects' Directory"` (21 caracteres) é testado **antes** de `"Marilia Pellegrini"` (18). E como o título saiu em caixa alta, `isCapitalized` (`:26-28`) descarta tudo dele.
7. **Não existe validação de relevância no final.** Nada compara a imagem com o assunto. A única crítica existente é sobre layout e o próprio comentário admite que é cega aos pixels (`lib/single-posts/compose.ts:958`).

### 1.4 Um achado que precisa de decisão

O exemplo canônico dentro do system prompt do post único (`lib/single-posts/free-generate.ts:63-108`) é **literalmente o caso Marilia Pellegrini**, incluindo a linha *"30 escritórios do mundo. Um é de São Paulo."* — quase idêntica ao hook que você recebeu.

Ou o exemplo foi escrito a partir dessa geração, ou a geração copiou o few-shot. Nos dois casos é um problema: um exemplo tão colado a um caso real vaza para posts de outros temas. **Trocar por um exemplo de domínio neutro.**

---

## 2. Como os grandes jornais escrevem manchete

Evidência dura, não opinião de guru:

- **NYT roda A/B em ~29% das manchetes**, até 8 variantes, janelas de ~30 min. Artigos testados são **80% mais propensos** a entrar na lista de mais lidos. As variantes vencedoras são consistentemente **as mais tensas**.
- **Cada palavra negativa a mais aumenta o CTR em ~2,3%** (Robertson et al., *Nature Human Behaviour* 2023 — 105 mil variantes, 5,7M cliques). Palavras **tristes** batem raiva/medo. Palavras **positivas reduzem** o CTR. Isso contraria o senso comum de marketing.
- **Curiosity gap puro tem retorno decrescente** (*Scientific Reports* 2024, 8.977 experimentos). Concretude é o que salva: o leitor precisa saber **o assunto** e não saber só **a resolução**.
- **As 2 primeiras palavras decidem** (eyetracking NN/G — o leitor consome ~28% das palavras).

### Os princípios que viram regra de prompt

**Estrutura**
1. Sujeito → verbo de ação no presente → objeto concreto. Nenhuma subordinada antes do verbo.
2. Front-load: as duas primeiras palavras carregam o tema. Nunca abrir com "Você", "Eu", "Existe", "Sabia que".
3. Corte de gordura: "que é", "está sendo", "a maneira como", "o fato de que", "existe/existem".
4. Verbo forte obrigatório. Banidos como verbo principal: ser, estar, ter, haver, fazer, ficar, ir. Verbos-cavalo em PT-BR: trava, sangra, come, some, quebra, engole, esvazia, encolhe, despenca.

**Psicologia**
5. Enquadramento de **perda** antes de ganho — mas no registro de decepção/desperdício, não de pânico.
6. Curiosity gap **ancorado**: a curiosidade vem do resultado omitido, nunca do assunto omitido.
7. Sujeito = pessoa afetada, não a instituição que agiu. "Meta atualiza política" → "Seu anúncio pode parar de rodar amanhã".
8. Emoção **mostrada**, nunca nomeada. Se apagar o adjetivo emocional o hook fica mais fraco, o fato é fraco — troque o fato.
9. Contraste em duas partes separadas por **ponto final**, não vírgula: "Investiu R$ 30 mil em tráfego. Vendeu 4."

**Especificidade**
10. Número não-redondo sempre que o dado real permitir. Listas em ímpares. **Nunca inventar número.**
11. Nome próprio e objeto concreto no lugar de categoria. Todo hook precisa de ao menos um substantivo fotografável.
12. Ancoragem temporal: "em 9 dias" é mais crível que "em 30 dias".

**Anti-padrões (o que jornal bom nunca faz)**
Voz passiva · generalidade que serviria para 500 posts · clickbait que o post não paga · nominalização · sensacionalismo que distorce o fato · emoção anunciada ("chocante", "surreal", "inacreditável") · pergunta sem âncora · abrir com o autor · palavras positivas genéricas como isca ("incrível", "poderoso", "definitivo") · números redondos inventados · duas ideias ligadas por "e".

---

## 3. BrandsDecoded decodificado — 14 capas reais

Baixei os screenshots dos 14 carrosséis mais virais deles (servidos abertos na LP `oficina.brandsdecoded.com.br`) e li capa por capa. Este é o dado mais valioso do estudo, porque é o formato que você quer alcançar.

### 3.1 As capas, verbatim

| Curtidas | Headline da capa |
|---|---|
| 42,3 mil | *A NOVA REGRA DO TRABALHO* — **POR QUE A GEN Z PAROU DE "VESTIR A CAMISA" E COMEÇOU A TRATAR EMPRESA COMO CONTRATO** |
| 36,5 mil | **A Geração Z encaretou o Brasil: por que os jovens vivem vidas mais chatas que seus pais?** |
| 28,9 mil | *A LENDA QUE VIROU CARICATURA:* — **COMO UM CASAL QUE SUMIU SEM EXPLICAÇÃO INSPIROU O DESENHO CORAGEM** |
| 24,6 mil | **O curioso caso da "Xeque Mate": a bebida que se infiltrou no carrinho dos ambulantes nesse Carnaval e se tornou o maior modelo da AMBEV** |
| 22,1 mil | **O novo 'CEO' do Carnaval do Rio de Janeiro: como Gabriel David criou a edição mais lucrativa (e polêmica) da história do samba?** |
| 20,2 mil | **Influenciadores na mira da lei: o projeto que pode mudar a internet** |
| 16,8 mil | **O 'tênis de pai' que virou febre entre os jovens: como a New Balance voltou a ser o tênis da moda da Geração Z?** |
| 16,5 mil | **Por que livros de ficção ensinam lições melhor do que clássicos da autoajuda?** |
| 16,3 mil | *A CRISE QUE A GENTE FINGE NÃO VER:* — **FAZ SENTIDO TRABALHARMOS SEM PROPÓSITO EM UM PLANETA QUE ESTÁ MORRENDO?** |
| 14,3 mil | **A mulher mais relevante do Brasil: o que a 'disputa' entre ciência e likes revela sobre o país?** |
| 13,7 mil | **Mulheres Precisam De Uma "Noite Das Garotas" A Cada 22 Dias: Como Isso Virou Uma Necessidade De Saúde e Não Um Luxo** |
| 12,9 mil | **A música brasileira como centro da cultura POP Global: como o novo single de Anitta pode ser um marco na carreira da cantora** |
| 12,1 mil | **Cimed entra no mercado Wellness e pode redefinir o mercado de suplementos com Cariani e Toguro como possíveis parceiros** |
| — | **O Fim do Complexo de Vira Lata: por que a estética brasileira vai dominar o mundo em 2026** |

### 3.2 A estrutura mestre da headline

```
[SINTAGMA NOMINAL COM APELIDO ENTRE ASPAS]  +  :  +  [PERGUNTA "por que/como" OU TESE]
```

É **manchete de revista**, não headline de post. Observações que contrariam o senso comum do nicho:

- **O hook deles é LONGO: 15 a 25 palavras.** Não é "≤9 palavras". Eles não competem por brevidade, competem por **densidade de informação editorial**. A regra dos ≤9 vale para hook de *frase de efeito*; para conteúdo de análise cultural, a manchete longa com dois-pontos performa melhor porque **entrega o assunto e a promessa ao mesmo tempo**.
- **Dois-pontos em 11 das 14.** O padrão é: primeiro a coisa nomeada (o gancho de reconhecimento), depois a pergunta ou a tese (o gancho de curiosidade).
- **Aspas em apelido/expressão em 7 das 14**: "vestir a camisa", "Xeque Mate", 'CEO', 'tênis de pai', 'disputa', "Noite Das Garotas". As aspas sinalizam "estou nomeando um fenômeno que você reconhece" — é o que cria a sensação de leitura de revista.
- **Pergunta com "por que"/"como" em 9 das 14** — mas sempre **ancorada num fato concreto**, nunca pergunta genérica.
- **Zero emoji. Zero hashtag. Zero "arrasta pro lado". Zero numeração de slide.** Nenhum artifício de UI. A retenção vem do loop temático.
- **Número aparece pouco** e quando aparece é específico e estranho: "a cada 22 dias".

### 3.3 Os dois sistemas visuais

**Formato A — "manchete de revista" (10 de 14, os de maior alcance de nicho)**
- Foto full-bleed ocupando o quadro inteiro.
- Headline em **serifa editorial** (tipo Playfair/Tiempos), branca, 2-4 linhas, centralizada no terço inferior.
- **Sublinhado** como destaque — não caixa alta, não cor. Uma expressão sublinhada por capa.
- Subtítulo em sans pequena abaixo, 1-2 linhas.
- Handle `@brandsdecoded` com selo azul, centralizado acima da headline.
- Gradiente escuro forte do rodapé para cima garantindo contraste.

**Formato B — "dossiê" (4 de 14, os mais provocativos)**
- Kicker pequeno em caixa alta acima: *"A CRISE QUE A GENTE FINGE NÃO VER:"*, *"A LENDA QUE VIROU CARICATURA:"*, *"A NOVA REGRA DO TRABALHO"*.
- Headline em **sans condensada pesada, caixa alta**.
- Destaque por **marca-texto vermelho/laranja** em uma expressão.
- Rodapé com selo "DOSSIÊ BRANDS DECODED →".

### 3.4 O achado mais importante: como eles resolvem a imagem

**Toda capa tem um sujeito visual nomeável e inequívoco.** Nenhuma exceção nas 14.

- Dwight de *The Office* e o personagem de *Severance* (Gen Z / trabalho)
- Foto de festa dos anos 2000 com camisetas Brahma (Geração Z encaretou)
- Um casal de idosos abraçando o cachorro do desenho Coragem
- Miss, mestre-sala e turista segurando latas de Xeque Mate na Sapucaí
- Gabriel David caminhando na Marquês de Sapucaí
- Três homens segurando tênis New Balance
- Gandalf, Darth Vader e Luke Skywalker segurando livros de autoajuda
- Um homem de terno diante de um monitor CRT numa praia inundada
- Anitta
- Zeca Pagodinho com faixa presidencial diante da bandeira do Brasil
- Os garotos-propaganda da Cimed com ursos

Duas conclusões que aplicam direto no nosso produto:

1. **Eles não fazem capa de conceito, fazem capa de sujeito.** O tema é escolhido já sabendo qual é a imagem. "Xeque-mate" vira lata na Sapucaí; "New Balance" vira o tênis; "Anitta" vira a Anitta. Nunca "uma pessoa representando o conceito de X".
2. **Quando usam IA, usam para montar cenas impossíveis com personagens reconhecíveis** — Zeca Pagodinho presidente, Gandalf com livro de autoajuda, executivos com ursos. **Nunca para inventar uma pessoa genérica.** É o oposto exato do que o nosso pipeline faz.

---

## 4. @viverdeia.ai — o outro modelo

Perfil institucional (~140K) da plataforma de IA para empresas; o fundador @rafaelmilagre (119K) carrega os hooks mais provocativos. A coleta foi parcial (o Instagram bloqueia scraping; o que veio foi via alt-text de OCR do grid), então trate as frequências como indicativas.

**Capas reais coletadas:** "Como se tornar INSUBSTITUÍVEL na era da IA" · "As melhores Ferramentas de IA em 2026" · "Seu processo vira um agente de IA" · "Todo mundo quer IA na empresa. Mas ninguém quer arrumar o processo antes." · "Essa IA pensa ANTES de desenhar" · "INVADIU? — DISPONÍVEL NO YOUTUBE".

**Padrões que valem copiar:**
- **6 a 8 palavras** na capa (bem mais curto que o BrandsDecoded — são categorias de conteúdo diferentes).
- **Exatamente uma palavra em caixa alta** por capa, e ela carrega o benefício ou a virada: INSUBSTITUÍVEL, ANTES, INVADIU. O resto em peso normal. É o oposto de capa toda em caps.
- **Número como credibilidade, não como listicle.** Eles quase não usam "7 ferramentas que…". Usam número para ano ("em 2026"), prova de resultado ("R$100M em 18 meses", "20 milhões no primeiro ano") e transformação de tempo ("5h de trabalho manual para 30min"). Valor sempre em par com prazo.
- **Negação de crença que não ataca o seguidor:** "Todo mundo quer IA na empresa. Mas ninguém quer arrumar o processo antes." A crítica é a "todo mundo" — o leitor se sente do lado de dentro.
- **Promessa de status profissional**, não de dinheiro para o seguidor. O dinheiro aparece como prova do autor.
- **Imperativo só no CTA**, nunca no hook. CTA de palavra-chave no DM: `Comenta GESTOR`, `Comenta EVENTO`, `Comenta TEMPO`.
- **Capa promete um mapa → o miolo entrega o mapa inteiro.** Não existe slide 2 de apresentação. No carrossel "insubstituível", o miolo é uma escada de 5 níveis nomeados (consumir conteúdo → usar no dia a dia → criar processos → resolver problemas reais → pensar estrategicamente), cada um com 2 exemplos concretos. O leitor se auto-localiza num degrau — é esse o motor do comentário e do salvamento.

---

## 5. Blueprint de carrossel (slide a slide)

Cinco papéis funcionais, independentemente do número de slides:
**CAPA → REHOOK → CORPO (1 ideia/slide) → SÍNTESE → CTA**

| Slide | Papel | Teto de palavras |
|---|---|---|
| 1 — Capa | Vender o swipe, não o conteúdo | ≤20 (headline 4-10 + subhead ≤12) |
| 2 — Rehook | Dor + custo + promessa específica. **Nunca apresentação pessoal** | 20-35 |
| 3..N-2 — Corpo | 1 ideia, 1 título, 1 exemplo | título 3-7 + corpo 15-35, teto 50 |
| N-1 — Síntese | Consolidar; é o slide que dispara o save | 25-45 |
| N — CTA | **Um único pedido** | 10-25 |

Orçamento total para 7 slides: 180-260 palavras. Acima de 350 a conclusão despenca.

**Regras que mais mudam resultado:**
- **A melhor ideia vai no slide 3**, não no final. Quem abandona no meio nunca vê o final.
- **O slide 2 é re-servido como capa** pelo algoritmo quando o usuário não interage na primeira exposição. Ele precisa se sustentar sozinho.
- **Cada slide do corpo termina com tensão**, não com fechamento. "Mas isso só funciona se…", "E é aqui que a maioria trava." Usar em 2-3 slides, não em todos — vira maneirismo.
- **A capa se escreve por último**, depois do corpo pronto. Só assim ela promete algo que existe.
- **Um CTA só.** Empilhar salva+comenta+compartilha derruba a conversão de todos.
- **Consistência de promessa:** prometeu 5 erros, entrega 5 erros.

**Legenda:** primeira linha é um segundo hook (5-12 palavras, não repetir a capa) → linha em branco obrigatória → parágrafos de 1-3 linhas → CTA sozinho na própria linha → hashtags no fim.

---

## 6. Direção de arte e veracidade

### 6.1 A ordem certa das decisões

O erro estrutural não é o modelo de imagem, é a ordem. Hoje fazemos `texto → prompt → gerar`. O certo é:

```
texto → ENTIDADE ÂNCORA → CLASSE de imagem → FONTE (real/gerada/gráfica) → produzir → VALIDAR → publicar ou degradar
```

### 6.2 As quatro famílias de imagem

| Família | Quando usar |
|---|---|
| **A. Retrato do sujeito** | A notícia É sobre a pessoa (prêmio, nomeação, entrevista). **Exige foto real verificada** |
| **B. Objeto simbólico** | Tema abstrato ou sistêmico. O objeto tem que ser concreto e único, não uma cena de pessoas trabalhando |
| **C. Cena / lugar** | Arquitetura, cidade, cultura, indústria, evento |
| **D. Composição gráfica** | Dados, listas, opinião. **É o fallback que nunca mente** |

### 6.3 Árvore de decisão

```
[1] O texto cita uma PESSOA REAL nomeada como assunto central?
    ├─ SIM → existe foto real verificável (Wikidata P18, og:image do artigo, press kit)?
    │        ├─ SIM → FAMÍLIA A, com crédito. FIM.
    │        └─ NÃO → PROIBIDO gerar rosto. PROIBIDO usar foto de outra pessoa.
    │                 Vai para [2] usando a OBRA dela como sujeito.
    └─ NÃO → [2]
[2] Cita OBRA, PRODUTO, EDIFÍCIO, LUGAR ou MARCA específicos?
    ├─ SIM → foto real disponível? SIM → família C/A. NÃO → imagem gerada
    │        genérica-de-categoria que NÃO reivindica ser aquele objeto. Rotular.
[3] Conceito/dado/opinião → família D (se tem número) ou B (se tem metáfora concreta).
[4] Nada se aplica → FAMÍLIA D. Nunca foto de pessoa aleatória.
```

Prioridade de entidade: `pessoa citada > obra/produto > organização > lugar > evento > conceito`.

### 6.4 Regras de veracidade (implementar como código, não como prompt)

- **R1** — Nome próprio de pessoa como sujeito da manchete ⇒ trava de rosto: proibido rosto gerado e proibido rosto de banco de imagens. Só foto real verificada ou imagem sem rosto.
- **R2** — Foto de pessoa só acompanha o nome dela. Legenda + imagem formam uma afirmação factual mesmo sem manipulação. *(Este é exatamente o erro do caso Marilia.)*
- **R3** — Contexto negativo (crime, doença, dívida, golpe, demissão) ⇒ zero rostos identificáveis.
- **R4** — Não representar categoria demográfica ("jovens", "MEIs") com foto genérica de modelo.
- **R5** — Imagem gerada que pareça fotografia recebe rotulagem. Padrão já adotado por Guardian, CBC, DPA; FT e AP não publicam fotorrealista gerado em contexto informativo.
- **R6** — Guardar `license`, `author`, `source_url` junto da imagem quando vier do Commons.

### 6.5 Template de prompt de imagem

```
[SUJEITO CONCRETO E ÚNICO] + [AÇÃO/ESTADO] + [AMBIENTE COM 2 DETALHES MATERIAIS]
+ [LUZ: qualidade, direção, hora] + [CÂMERA: lente/distância/ângulo]
+ [COMPOSIÇÃO: enquadramento + ESPAÇO NEGATIVO DECLARADO onde o texto vai]
+ [ESTILO/ACABAMENTO] + [PALETA] + [4:5]
```

O slot **espaço negativo declarado** é o mais esquecido e resolve metade dos problemas de legibilidade sem tocar no renderer. Sem ele o modelo centraliza o sujeito e não sobra lugar para a manchete.

**Sinais de que o prompt vai sair genérico** (checar antes de gerar): sujeito é abstrato ("inovação") · sujeito é uma função sem contexto material ("uma profissional") · não há substantivo material (concreto, madeira, aço, papel) · não há hora do dia · não há lente/distância · não há espaço negativo · o prompt caberia em qualquer outro post do nicho.

**Negative prompt padrão:**
```
stock photo, generic office, person at desk with laptop, business handshake,
smiling model looking at camera, lens flare, 3D render, CGI plastic skin,
watermark, text, extra fingers, flat even lighting
```

**Como o caso Marilia deveria ter sido resolvido:**
1. Foto real dela — estava no `og:image` do artigo. Fim.
2. Se não houvesse: foto/imagem da **obra** (casa branca curva contra a mata), não do rosto.
3. Se não houvesse nada: capa tipográfica com o nome e o selo "WALLPAPER ARCHITECTS' DIRECTORY 2026".

### 6.6 Checklist de validação imagem↔texto

**Relevância** — A imagem mostra uma entidade que aparece no texto? Um leitor descreveria o assunto olhando só a imagem? A imagem serviria para qualquer outro post do nicho? *(Se sim, reprovar — este é o teste mais eficiente contra look de banco de imagens.)*
**Veracidade** — Há nome de pessoa no texto? A imagem tem rosto? É comprovadamente aquela pessoa?
**Composição 4:5** — Área de respiro ≥35% da altura · contraste ≥4,5:1 medido no pior pixel sob o texto, não na média · topo da cabeça preservado · zona segura 960×1140 · imagem não sobrepõe texto · acento via `readableAccent()`.

---

## 7. Especificação de implementação

### 7.1 `extract-content` devolve estrutura, não prosa

Trocar o parágrafo por JSON:

```json
{
  "tese": "frase única com o fato central",
  "fonte": "quem afirma/premia (Wallpaper*)",
  "entidades": [{"nome": "Marilia Pellegrini", "tipo": "PERSON", "papel": "protagonista"}],
  "obras": ["Casa das Palmeiras", "Casa Contêiner", "Casa 1111"],
  "numeros": [{"valor": "60 m²", "contexto": "área da Casa Contêiner"}],
  "vocabulario_visual": ["volumes brancos", "curvas", "jardim tropical", "concreto"],
  "imagens_da_pagina": ["url do og:image", "..."],
  "registro": "noticia | educativo | opiniao | case"
}
```

O campo `registro` decide qual conjunto de regras de copy aplicar.

### 7.2 Bloco de copy — adicionar o registro "notícia"

Hoje `lib/generation/claude.ts:131-166` está 100% calibrado para copy de marca vendendo serviço (todos os exemplos são de funil: propostas, concorrente, vender). Notícia precisa de regras próprias:

```
QUANDO registro = "noticia":
- A capa carrega FATO + PROTAGONISTA + FONTE. Nunca deixe o protagonista para o subtítulo.
- Estrutura preferida (padrão de manchete de revista):
  [o fenômeno nomeado, com apelido entre aspas se houver] : [pergunta "por que/como" ou tese]
- Aqui o limite de 9 palavras NÃO se aplica: manchete de análise cultural funciona com 15-25
  palavras, porque entrega assunto e promessa ao mesmo tempo.
- Atribuição obrigatória quando o fato depende de uma fonte: "segundo a Wallpaper*".
- Distinga fato de leitura: o fato vai na capa, a interpretação vai no corpo.
- Proibido transformar o fato em slogan publicitário.
```

Aplicado ao caso: em vez de *"30 ESCRITÓRIOS NO MUNDO. UM É DE SÃO PAULO."*, algo como
**"A brasileira que a Wallpaper\* colocou entre os 30 escritórios do mundo: como Marilia Pellegrini virou concreto branco em cartão de visita internacional"**.

### 7.3 Bloco de `image_prompt` — reescrita

Trocar `lib/generation/claude.ts:192-223`:

1. **Adicionar categorias faltantes**: arquitetura/design → *a obra construída, fachada, interior, maquete, material*; cultura/arte → *a peça, o palco, o objeto*; moda → *a peça de roupa, o desfile*; esporte, gastronomia.
2. **Nova regra de sujeito**: *"Quando o briefing nomeia uma obra, produto, edifício ou lugar concreto, o SUBJECT do prompt é essa coisa, não uma pessoa anônima."*
3. **Trava explícita**: *"Se o post é sobre uma pessoa real nomeada, ou a imagem é dela (foto real verificada), ou não há pessoa nenhuma na imagem. Nunca invente um figurante."*
4. **Slot obrigatório de espaço negativo.**
5. **Remover o exemplo do empreendedor digitando no laptop** — ele é o molde do erro.
6. Substituir `STYLE_PROMPTS.cinematic` como default de capa por um estilo escolhido pela família de imagem.

### 7.4 Bloco de `image_entity` — inverter a responsabilidade

O prompt atual (`claude.ts:225-243`) manda o modelo julgar se a entidade **tem foto na Wikipedia** — algo que ele não pode saber e vai chutar. Como está marcado "PRIORIDADE MÁXIMA / OBRIGATÓRIO", ele preenche nomes inexistentes em enciclopédia (arquiteta emergente é o caso exato) e a busca aceita qualquer coisa.

Correção: o LLM só declara **a entidade e o tipo**; quem decide se existe foto usável é o **código**, validando label ↔ query, `P31=Q5`, ocupação/nacionalidade contra o artigo, e `isUsablePhoto`. Se falhar, **degrada de família** (pessoa → obra → objeto → tipográfico) em vez de tentar "a próxima foto parecida".

### 7.5 Busca de imagem em camadas

```
Camada 1  nome exato → wbsearchentities (Wikidata)
Camada 2  validar P31=human + P106 (ocupação) + P27 (nacionalidade) contra o texto
Camada 3  P18 do item validado → Special:FilePath
Camada 4  Commons haswbstatement:P180=<QID>
Camada 5  categoria do Commons (P373)
```

Nunca busca textual livre para uma `PERSON` — é exatamente o que trouxe a foto errada.

### 7.6 Geração de hook em 6 arquétipos com pontuação

Espelhar o método do NYT (que gera até 8 variantes e deixa o dado escolher). Sem A/B, força-se diversidade estrutural + rubrica:

```
Gere 6 hooks de arquétipos OBRIGATORIAMENTE diferentes:
1) dado/número  2) contraste em duas partes separadas por ponto  3) erro/perda
4) pergunta ancorada em fato  5) afirmação contraintuitiva  6) cena visual concreta
Pontue cada um 0-2 em: concretude, força do verbo, front-load, tensão, concisão.
Retorne os 3 melhores com a nota.
```

Isso também alimenta a UI: o usuário escolhe entre 3 hooks em vez de aceitar 1.

---

## 8. Ordem de execução sugerida

**P0 — para o sangramento (nada quebra, tudo é ganho imediato)**
1. `searchWikimediaPerson` na cascata do carrossel
2. `og:image` como candidata de capa
3. Remover o exemplo "Marilia Pellegrini" do system prompt do post único
4. Corrigir a ordenação de `properNounCandidates`

**P1 — qualidade de conteúdo**
5. `extract-content` estruturado
6. Registro "notícia" na copy
7. Reescrita do bloco `image_prompt`
8. Grounding no modo link

**P2 — arquitetura**
9. Classe de imagem + árvore de decisão + degradação de família
10. Trava de veracidade como código
11. Validação de relevância imagem↔texto
12. 6 arquétipos de hook com escolha na UI

---

## Anexo — fontes

**Jornalismo e headline:** Nieman Lab e TJCX (A/B do NYT) · Robertson et al., *Nature Human Behaviour* 2023 · *Scientific Reports* 2024 (curiosity gap) · Upworthy Research Archive · Poynter (9 tips, nut graf) · Axios *Smart Brevity* · The Economist Style Guide · NN/G (First 2 Words, Microcontent) · Morning Brew Style Blog.

**Carrossel:** Hootsuite · Socialinsider · PostNitro · CreatorFlow · Justin Welsh (via Meet-Lea) · Hormozi (Hook-Retain-Reward).

**Direção de arte e veracidade:** Creative Bloq (editorial design) · RMCAD (editorial illustration) · guias oficiais de prompt do Flux (BFL) e do Nano Banana (Google Cloud) · Ethics in Journalism (Univ. of Arkansas) · iMediaEthics (casos de troca de foto) · Journalist's Resource (políticas de IA em 52 redações) · EDPS joint statement on AI-generated imagery · Wikidata P18 / Commons Depicts.

**Perfis analisados:** 14 capas de @brandsdecoded\_\_ lidas diretamente dos screenshots publicados em `oficina.brandsdecoded.com.br` · @viverdeia.ai e @rafaelmilagre via alt-text de OCR do grid público (coleta parcial — o Instagram bloqueia scraping, viewers de terceiros retornaram 403).
