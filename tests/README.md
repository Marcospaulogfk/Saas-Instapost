# Testes do Nexus Content — o que são e como usar

Este texto é para quem é dono do negócio e não programa. Explica o que os
testes protegem, como rodar e o que fazer quando um deles acusa problema.

## O que é um teste, em uma frase

É um robô que abre o produto, faz uma conta ou monta um slide, e compara o
resultado com o que a gente combinou que é o certo. Se bater, passa. Se não
bater, acusa — antes de chegar no cliente.

## O que está protegido hoje

### 1. Funções de cálculo (`lib/**/*.test.ts`)

Regras de negócio que não dependem de tela: contraste de cores, limpeza do @
da marca, limites de texto etc.

### 2. Os 10 estilos de carrossel que já funcionam (`tests/regressao/estilos-originais.test.tsx`)

Minimalista, Perfil, Gradiente, Cards, Impacto, Revista, Lista Cream,
Seamless, Chamada Final e Automático. Para cada um, o robô monta um carrossel
de 5 slides com textos e fotos fixos — e também variações: formato stories,
slide sem foto, fundo claro, fundo escuro, degradê, ajustes do editor e blocos
livres. O resultado (o HTML de cada slide) fica gravado em
`tests/regressao/__snapshots__/`. Na próxima vez que rodar, ele compara com o
gravado. **Mudou um pixel de código que afeta esses estilos, o teste avisa.**

### 3. O contrato de todo estilo (`tests/regressao/estilos-contrato.test.tsx`)

Vale para os 18 estilos, inclusive os 8 novos que ainda estão sendo
desenhados. Não compara o desenho; garante o mínimo:

- a capa e o conteúdo mostram o título e o texto;
- a tag (chamada) aparece na capa ou no último slide;
- título e foto são clicáveis no editor (marcados com `data-edit`);
- sem foto, aparece a caixa "IMAGEM" no lugar (e nenhuma URL sobra);
- o @ da marca aparece quando existe e **nunca** aparece "@marca" de exemplo;
- trocar o fundo muda a cor do slide;
- não sai "undefined", "NaN" ou efeito de desfoque que quebra a exportação;
- em stories o quadro vira 9:16.

Também confere que a lista de estilos do catálogo e a lista do código batem
uma a uma, sem nome repetido ou descrição vazia. **Estilo novo que nascer sem
alguma dessas peças falha aqui na hora.**

### Imagem de fundo (`tests/regressao/fundo-imagem.test.tsx`)

A foto que o usuário põe atrás do slide ("Fundo do Slide" → Imagem de fundo).
Confere a camada de escurecer/clarear, a intensidade e a posição; que a cor
da marca continua legível sobre a foto (clareia ou escurece só o necessário);
e que os 18 estilos abrem com o título, com a foto escurecida e clareada.

### Formas decorativas (`formas-editaveis.test.ts` e `formas-estilos.test.tsx`)

Enfeites do slide (círculos, faixas, réguas, post-its, palavras-fantasma) são
"formas": o usuário clica, troca a cor, move, escala e apaga. Os testes
conferem onde a cor pinta (preenchimento, letras ou contorno), que o giro
original da forma continua depois de mover, que restaurar devolve tudo, e
quantas formas cada estilo tem. Forma nova ou removida de propósito: atualize
o número em `formas-estilos.test.tsx`. Para marcar uma forma num estilo novo,
use `{...shapeAttrs()}` de `components/carousel/styles/shared.tsx`.

### 4. O modelo de edição (`tests/regressao/modelo-edicao.test.ts`)

Blocos livres (nascem centralizados, não saem do slide, limite de 12), a
trava da capa (capa tem que nomear o assunto, não abrir com "Você", caber em
26 palavras), a política de imagem (quando pode ou não aparecer rosto) e a
detecção de nomes de pessoa no texto.

### 5. Um carrossel salvo ontem (`tests/regressao/carrossel-salvo.test.tsx`)

Um carrossel completo, no formato exato que vai pro banco, com tudo
preenchido (fonte, pesos, degradê, colagem, blocos, ajustes). Tem que abrir em
cada um dos 10 estilos sem erro. Protege as peças que os clientes já criaram.

## Como rodar

Na pasta do projeto:

```
npm test
```

Leva uns 3 segundos. No fim aparece algo como:

```
Test Files  30 passed (30)
     Tests  757 passed | 5 skipped | 2 todo
```

- **passed** = tudo certo.
- **skipped** = regras que, por decisão de design, não valem para 3 estilos
  (Revista, Perfil e Seamless não têm tag; Perfil e Seamless não mostram a
  caixa "IMAGEM"). Está documentado dentro do teste.
- **todo** = problemas REAIS encontrados no código, ainda não consertados
  (lista abaixo). O teste já está escrito; quando alguém consertar, basta
  trocar `it.todo` por `it`.
- **failed** = alguma coisa mudou. Leia a próxima seção.

## Quando um snapshot "quebra"

O teste mostra um diff: em vermelho o que estava gravado, em verde o que saiu
agora. Pergunte: **essa mudança foi de propósito?**

### Foi de propósito (alguém redesenhou um estilo, trocou um texto fixo, mudou uma cor padrão)

Regrave o combinado:

```
npx vitest run -u
```

Confira o diff antes. Regravar é dizer "a partir de hoje, o certo é isso".

### NÃO foi de propósito (mexeu em outra coisa e um estilo que não devia mudar, mudou)

**Não regrave.** O teste acabou de pegar um estrago colateral. Peça para
quem fez a mudança olhar o diff e consertar o código. Rodar `-u` aqui
esconde o problema e ele vai aparecer no post de um cliente.

Regra prática: se o diff toca um estilo que ninguém pediu para mudar, é
acidente.

## O que os testes NÃO cobrem

- Como o slide fica **visualmente** (tamanho da letra que encolhe pra caber,
  posição final de um elemento arrastado). Isso é feito no navegador e é
  coberto pelos testes visuais, em `tests/visual/`.
- Salvar e carregar do banco (precisa de login e Supabase).
- Estilo novo em construção: enquanto não estiver aprovado, ele fica fora da
  lista `ESTILOS_ORIGINAIS` em `tests/regressao/helpers.tsx` (só passa pelo
  contrato). Aprovou, acrescenta o nome lá e roda com `-u`. Os 8 estilos de
  24/10/2026 já estão na lista.

## Achados no código atual (registrados, não corrigidos pelos testes)

1. ~~**Perfil mostra "@perfil"** quando a marca não tem @ cadastrado~~ —
   corrigido em 24/10/2026 (a linha do @ some, como nos outros estilos); o
   contrato agora cobra isso de todo estilo.
2. **Seamless, slides de conteúdo**: a foto é um `<img>` sem a marca
   `data-edit="image"`, então no editor ela não pode ser selecionada nem
   reenquadrada. A capa está certa. Marcado como `todo`.
3. ~~**Bloco "Divisor" nasce com 10px de altura**~~ — corrigido em 24/10/2026
   (nasce com os 16px mínimos).
4. **A tag (cta_badge) só aparece em alguns estilos**: Minimalista, Lista
   Cream, Cards e Automático mostram em todo slide; Impacto, Gradiente e
   Chamada Final só na capa; Revista, Perfil e Seamless em nenhum. Se a
   intenção é que a tag apareça sempre, hoje não acontece.
5. **Nomes ligados por "e"** ("Maria da Silva e Vincent van Gogh") viram um
   candidato só na detecção de pessoas — limitação conhecida, documentada no
   teste.
