# Regras de copy (fonte da verdade, independente de modelo)

Estes arquivos são as regras de PRODUTO da copy do Nexus Content. São escritos
em português neutro, sem referência a nenhum fornecedor de IA: o mesmo texto
vale pra Claude, Gemini, Haiku ou qualquer modelo que entre no teste cego.

O que fica AQUI: o que faz uma copy ser boa ou ruim pro leitor (princípios,
manchete, estrutura do carrossel, profundidade, legenda, direção de imagem).

O que fica NO CÓDIGO (`lib/generation/claude.ts`, `lib/single-posts/free-generate.ts`):
o contrato de saída (nomes de campo, JSON, contagem de slides, escape de aspas),
a persona de abertura e a estética por template. Isso é formato, não copy.

Carregamento: `lib/copy/regras.ts` (`regrasCopy()`). Os arquivos são lidos do
disco uma vez por processo; editar um .md não exige mudar código, só reiniciar.

Ordem de montagem no prompt do carrossel:
01-principios → 02-capa → 03-estrutura → 04-profundidade → 05-legenda → 06-imagem.
Post único usa 01 e o bloco de sujeito de 06.

Regras que também existem em CÓDIGO (rede de segurança de qualquer modelo):
- travessão: `lib/copy/sanitize.ts` remove em qualquer saída;
- capa nomeia o sujeito: `lib/carousel/cover-guard.ts` (hoje só log).
