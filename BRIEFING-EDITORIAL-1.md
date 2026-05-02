# Template Editorial SyncPost — Sessão 1 de 3

> Briefing recebido em 2026-05-02. Implementação na branch `feature/template-editorial`.

## Escopo desta sessão
- Foundation: configs, types, shared components.
- 4 layouts rígidos: Capa (01), Problema (02), Sépia (07), Serif (08).

## Adaptações do briefing pra esse repo
- Pastas em `components/templates/editorial/` e `app/test-editorial/` (não usa `src/`).
- Tokens CSS Editorial isolados (`--editorial-*`) pra não conflitar com paleta SyncPost.
- Bebas Neue + Playfair Display **adicionadas** ao `app/layout.tsx`. Space Grotesk continua principal.
- `next.config.mjs` já tem `images.unoptimized: true` — Unsplash funciona sem `domains`.

## Próximas sessões
- Sessão 2: layouts flexíveis + integração IA
- Sessão 3: interface + export

## Inspiração
@brandsdecoded__ (Content Machine) com paleta SyncPost (preto + roxo).

## Canvas
1080×1350 (formato 4:5 Instagram).

## Layouts rígidos = template fixo, conteúdo IA preenche slots fixos
- 01 Capa: foto fullbleed + título hero embaixo + paginação
- 02 Problema: bg preto + tag + título + body + número 02 translúcido
- 07 Sépia: foto sépia + título com múltiplos highlights roxos
- 08 Serif: bg navy + Playfair Display + subtítulo roxo claro
