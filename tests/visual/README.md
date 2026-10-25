# Teste visual dos estilos de carrossel

## O que é isso

É um "fiscal de aparência". Ele abre cada estilo de carrossel no navegador,
tira uma foto dos 5 slides lado a lado e compara, pixel por pixel, com uma
foto de referência guardada aqui no projeto (pasta `__referencias__/`).

Se alguém mexer no código e um layout mudar sem querer (uma letra que cresceu,
uma foto que sumiu, uma cor que trocou), o teste acusa e mostra onde mudou.

Hoje ele protege os 10 estilos originais (auto, wesley, brandsdecoded, bolo,
mypostflow, gradient, minimal, seamless, cards, perfil). Para `minimal`,
`gradient` e `cards` ele também fotografa com o fundo trocado pelo usuário
(claro e escuro), porque esses estilos respeitam a cor de fundo escolhida.

Ele usa a página de prévia sem login `http://localhost:3010/preview-estilos`
(fora do produto) com textos e fotos fixos, então a foto só muda se o
layout mudar.

## Como rodar

1. Deixe o site rodando em `http://localhost:3010` (`npx next dev -p 3010`).
   Se ninguém estiver rodando, o teste sobe um sozinho, mas demora mais.
2. No terminal, dentro da pasta do projeto:

```
npm run test:visual
```

Leva uns 20 a 30 segundos com o site já no ar. No final aparece
`16 passed` quando está tudo igual às referências.

Na primeira vez numa máquina nova, instale o navegador do teste uma vez:

```
npx playwright install chromium
```

## Quando quebra: como ver a diferença

Quando um estilo sai diferente da referência, o teste marca `failed` e
guarda três fotos em `tests/visual/.saida/<nome-do-teste>/`:

- `...-expected.png`: a referência (como deveria ser)
- `...-actual.png`: como ficou agora
- `...-diff.png`: as diferenças pintadas de rosa/vermelho

O jeito mais fácil de olhar é o relatório em página web:

```
npx playwright show-report
```

Abre no navegador uma lista dos testes; clique no que falhou e use a aba
"Diff" (tem um controle deslizante para comparar antes e depois).

Pequenas diferenças (até 1% dos pixels) são toleradas, para não acusar
por qualquer sombra de renderização.

## Quando atualizar a referência de propósito

Se a mudança no layout foi INTENCIONAL (você quis mudar o estilo), a foto
de referência antiga fica desatualizada e o teste vai acusar sempre. Nesse
caso, depois de conferir no relatório que o novo visual está certo, gere a
referência nova:

```
npm run test:visual:update
```

Isso sobrescreve as fotos em `__referencias__/`. Essas fotos são versionadas
no git: ao fazer commit, elas entram junto, e quem revisar vê a foto antiga
e a nova lado a lado no GitHub.

Regra de ouro: só rode o `update` quando tiver certeza de que a mudança foi
de propósito. Se rodar sem conferir, o teste "aprende" o erro como certo.

## Estilos em construção

No topo de `estilos.visual.ts` existe a lista `ESTILOS_EM_CONSTRUCAO`.
Estilo que está lá é pulado pelo teste, porque ainda está sendo desenhado
e a aparência muda toda hora.

Quando um estilo ficar pronto:

1. Abra `tests/visual/estilos.visual.ts` e apague o id dele da lista
   `ESTILOS_EM_CONSTRUCAO` (por exemplo, a linha `"lookbook",`).
2. Rode `npm run test:visual:update` para gerar a foto de referência dele.
3. Olhe a foto gerada em `__referencias__/estilos.visual.ts/<id>.png` e
   confira que está como esperado.
4. Rode `npm run test:visual` de novo: tem que passar.
5. Faça commit do arquivo de teste e da foto nova.

Estilo novo que entrar em `components/carousel/carousel-styles.ts` passa a
ser testado automaticamente; se ainda não tiver referência, o teste falha
avisando que a foto não existe, e aí basta rodar o `update` (ou colocar o id
na lista de "em construção" até ficar pronto).

## Onde fica cada coisa

- `playwright.config.ts` (raiz): configuração (navegador, tamanho da tela,
  tolerância, onde salvar as fotos).
- `tests/visual/estilos.visual.ts`: o teste em si.
- `tests/visual/__referencias__/`: fotos de referência (versionadas).
- `tests/visual/.saida/` e `playwright-report/`: fotos de erro e relatório
  de cada rodada (NÃO versionados; podem ser apagados a qualquer momento).

O teste é separado do `npm test` (Vitest): um não interfere no outro.
