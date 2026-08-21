# DIREÇÃO DE IMAGEM

## Regra crítica: sem metáforas

Pra tópicos abstratos (tech, business, política, finanças, conceito), JAMAIS gere metáfora literal. Clichês que modelos de imagem geram por default e ficam ridículos:
- "two ships drifting apart" pra distanciamento / separação corporativa
- "hands letting go" pra rompimento / fim de parceria
- "two paths diverging" pra escolha / decisão
- "broken chain" pra ruptura
- "puzzle pieces" pra colaboração
- "lightbulb" pra ideia
- "rocket launching" pra crescimento / startup
- "domino effect", "scales of justice", "sunrise/horizon": TODOS clichês.

Se o tópico é abstrato, a imagem deve ser **editorial-concreta**:
- **tech/empresas** → sedes corporativas (glass towers), server room, conferência, mesa de reunião
- **finanças** → bolsa de valores, gráficos em monitor, prédio bancário
- **política** → corredor governamental, pódio de imprensa
- **direito** → sala de tribunal, biblioteca jurídica
- **arquitetura/design/urbanismo** → a OBRA construída: fachada, interior, maquete, o material (concreto, madeira, vidro), o canteiro. NUNCA a pessoa que projetou.
- **arte/cultura/literatura** → a peça, o palco, a exposição, o objeto, a capa do livro
- **moda/beleza** → a peça de roupa, o tecido, o desfile, a vitrine
- **gastronomia** → o prato, o ingrediente, a cozinha, o salão
- **esporte** → o gesto atlético, o equipamento, o estádio
- **saúde/ciência** → o laboratório, o instrumento, a amostra

## Regra do sujeito (a mais importante deste bloco)

**Se o briefing nomeia uma OBRA, PRODUTO, EDIFÍCIO, LUGAR ou PEÇA concreta, o SUJEITO da imagem é ESSA COISA, não uma pessoa anônima fazendo o trabalho relacionado a ela.**

O erro mais caro que existe aqui é transformar um assunto concreto em "profissional genérico trabalhando". Uma notícia sobre uma arquiteta premiada não é uma foto de alguém numa mesa: é a CASA que ela construiu. Um post sobre um livro não é alguém lendo: é o livro. Um post sobre um restaurante não é um chef sorrindo: é o prato.

**Trava de veracidade, pessoa real nomeada:** se o post é sobre uma pessoa REAL nomeada, só existem duas saídas legítimas: a foto real dela (o sistema busca e valida) ou uma imagem SEM pessoa nenhuma (a obra, o objeto, o lugar). JAMAIS descreva uma pessoa inventada num post sobre alguém real: "Brazilian female architect in her studio" num post sobre a Marilia Pellegrini produz o retrato de uma estranha ao lado do nome dela. Isso é erro editorial, não questão de gosto. Na dúvida, tire a pessoa do quadro.

## Template do prompt de imagem (sempre em INGLÊS)

`[SUBJECT concreto e único: a coisa, não a função], [ACTION/STATE concreta, não posando], [ENVIRONMENT com 2 detalhes materiais], [LIGHTING nomeada: Rembrandt / golden hour / hard noon / soft window / studio softbox / fluorescent overhead / dim tungsten], [CAMERA: shot on 85mm shallow DoF / 35mm wide environmental / 24mm architectural / macro detail], [COMPOSITION: vertical 4:5 with subject in lower two thirds and clean negative space in the upper third for typography], [STYLE: editorial photography / architectural photography / photojournalism / still life], [MOOD]. Negative: text, watermark, logos, signs, illustrations, sketches, metaphors, blurry, deformed, cartoon, posing, stock photo, generic office, person at desk with laptop.`

**O slot de COMPOSIÇÃO com espaço negativo é OBRIGATÓRIO.** Sem ele o modelo centraliza o assunto e não sobra lugar pra manchete; metade dos problemas de legibilidade nasce aí.

- ✓ "White curved concrete house facade with full-height glazing, half-swallowed by dense tropical garden, late afternoon side light raking across the render, shot on 24mm architectural with corrected verticals, vertical 4:5 with the house in the lower two thirds and open sky in the upper third for typography, architectural magazine photography, natural color. Negative: text, watermark, logos, people, stock photo."
- ✓ "Wide shot of two glass corporate skyscrapers under heavy overcast Seattle sky, no people, cold gray atmosphere, shot on 35mm wide, vertical 4:5 with clean sky in the upper third, photojournalism, editorial press photo. Negative: text, logos, ships, metaphors."
- ✗ "person working" (vago) / ✗ "happy entrepreneur" (genérico) / ✗ "two ships in misty ocean" (metáfora)
- ✗ "Brazilian architect 40s reviewing blueprints at her desk in dim studio": este é EXATAMENTE o clichê proibido, transforma um assunto concreto (a obra) numa pessoa genérica numa mesa.

## Sinais de que o prompt vai sair genérico (revise antes de entregar)

- O sujeito é um abstrato ("inovação", "crescimento", "sucesso").
- O sujeito é uma FUNÇÃO sem contexto material ("uma profissional", "um empreendedor"); é o gatilho literal da imagem "pessoa numa mesa".
- Não há substantivo material (concreto, madeira, aço, papel, tecido, vidro).
- Não há hora do dia nem direção de luz.
- Não há lente/distância.
- Não há espaço negativo declarado.
- O prompt caberia em qualquer outro post do mesmo nicho. Se cabe, reescreva.
