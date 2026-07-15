# Handoff — Editor de carrossel reformulado (MyPostFlow) + 4 features (2026-07-15)

> Sessão longa, **nada commitado** — tudo em disco. Retomar lendo os arquivos abaixo.

## O que foi feito
Editor `components/carousel/carousel-editor.tsx` reformulado no padrão do concorrente
**MyPostFlow**: overlay tela cheia (`fixed inset-0 z-50`, cobre a nav — 1 sidebar só),
sidebar PRETA à esquerda com accordions (`Section`), toolbar no topo com dropdown de formato
(ícones), filmstrip horizontal centrado (slides 420px). Undo/Redo/Salvar só aparecem após
alteração (`dirty`).

Seções da sidebar: **Estilo do Post · Tipografia · Identidade Visual · Fundo do Slide ·
Conteúdo — Slide 0X · Imagem do Slide**.

## As 4 features (todas verificadas ao vivo via Chrome MCP)
Padrão: **CONTEXT** pra não tocar nos ~17 templates de capa/split.

1. **Imagem: posição + zoom + excluir** — `ImageTransformContext` (`editorial-shared.tsx`)
   provido pelo `SlidePreview`, consumido pelo `SmartSlideImage`. Dados em `slide.image.posX/
   posY/zoom`. UI na seção Imagem.
2. **Tipografia (fonte/tamanho/peso)** — família via prop `fontClass` (`carousel-fonts.ts`,
   novo, 10 fontes); peso+escala via `TypographyContext` consumido pelo `FitText`. O estilo
   "Auto" (legado em `slide-preview.tsx`) teve 5 títulos `<h1>` convertidos pra `FitText`.
   Dados: `font/titleWeight/titleScale` em `CarouselV2Data`.
3. **Fundo do slide (cor)** — `slide.bg` por slide, aplicado no `LegacySlideRenderer` (split)
   com contraste automático. Seção "Fundo do Slide" (swatches `BG_PRESETS` + picker). **Só no
   estilo "Auto" por ora.**
4. **Identidade Visual** — `colors` virou estado editável (3 pickers) + **extrair paleta de
   foto** (`lib/carousel/extract-palette.ts`, canvas via proxy).

## Fix importante
**Loop de re-render** que travava o editor: removido `console.log` no `EditorialSlideRouter`
+ `React.memo` em `SlidePreview` e `SlideCanvas`. Agora só o slide alterado re-renderiza.

## Arquivos-chave
- `components/carousel/carousel-editor.tsx` — o editor (layout + todas as UIs).
- `components/carousel/slide-preview.tsx` — render dos slides (Providers, legado→FitText, memo).
- `components/carousel/editorial-shared.tsx` — `FitText`, `SmartSlideImage`, os 2 contexts.
- `components/carousel/carousel-fonts.ts` (novo) — fontes.
- `lib/carousel/extract-palette.ts` (novo) — extração de paleta.
- `app/actions/carousel.ts` — `CarouselV2Data` (persistência: font/titleWeight/titleScale/
  coverImageUrl; slides carregam bg/transform; colors).
- `app/dashboard/carrossel/page.tsx` — load (lê tudo do carousel_data).

## Pendências / próximos passos
- **Limpar rotas de debug**: `app/preview-editor`, `app/preview-cards`, `app/preview-cover`,
  `app/preview-dashboard` (harness visual criado no caminho).
- **Estender** fundo do slide (e checar tipografia) aos outros 7 estilos (hoje foco no "Auto").
- **Commitar** o trabalho (nada foi commitado).
- Ver editor no navegador: **usar Chrome MCP** — o `preview_screenshot` trava com muitos
  SlidePreviews vivos (loop do FitText); pelo Chrome real funciona.

## Rodadas anteriores desta branch
Ver `HANDOFF-DESIGN-AGENDAMENTO.md`, `DESIGN.md`, e a memória em `.claude`.
