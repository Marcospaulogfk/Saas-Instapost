# Carrossel: blocos livres (estilo Elementor) — plano

Data: 22/08/2026. Branch: `feat/post-unico-editavel`.

## Contexto

O editor de carrossel hoje é um **overlay Canva-like sobre layouts fixos**:
cada estilo (10) tem componentes de capa/split pré-compostos; o usuário só mexe
no que o layout expõe via `data-edit` (`title | text | badge | image | meta`),
com override por elemento em `slide.el[key]` (mover/escala/cor). Tudo é
JSONB em `editorial_carousels.carousel_data` (sem migration).

### Corrigido em 22/08 (P0)

- **Rodapé não era editável**: "arrasta →", contador `01/08`, marca/@handle,
  categoria e avatar eram `<span>` crus sem `data-edit`. Agora carregam
  `data-edit="meta"` (rótulo "Rodapé") nos 3 arquivos de layout, com a mesma
  prioridade de hit-test da Tag. Dá pra mover, escalar e recolorir.
- **Fundo da capa ignorava a sidebar**: nenhuma das 10 capas recebia
  `bgOverride`; o campo "Fundo do Slide" só funcionava em slide de conteúdo.
  Agora `slide.bg` vale pra capa também (glow radial do estilo gradiente
  continua derivado do accent; vira editável no P2 abaixo).

## Objetivo

Deixar o usuário **adicionar blocos novos** (título, texto, imagem, forma,
logo/marca) em qualquer slide, posicionar/redimensionar livremente, sem
quebrar o render gerado nem o export PNG.

## Princípio: camada aditiva, nunca reescrever os layouts

Os layouts continuam intocados. Entra **uma camada por cima** (`BlockLayer`)
que renderiza `slide.blocks[]`. Sem blocos → DOM idêntico ao de hoje. Isso
mantém as 3 garantias que já existem: slide gerado = slide padrão, export
pelo render oculto, undo limpo (1 commit por gesto).

## Modelo (JSONB, sem migration)

```ts
// em PreviewSlide (slide-preview.tsx)
blocks?: SlideBlock[]

type SlideBlock =
  | { id: string; type: "heading" | "text"; x; y; w; h; z; rot?: number
      text: string; color?: string; size?: number; weight?: number
      align?: "left" | "center" | "right"; font?: string }
  | { id; type: "image"; x; y; w; h; z; url: string; fit?: "cover" | "contain"
      radius?: number; posX?: number; posY?: number; zoom?: number }
  | { id; type: "shape"; x; y; w; h; z; shape: "rect" | "circle" | "line"
      fill?: string; stroke?: string; radius?: number; opacity?: number }
  | { id; type: "pill"; x; y; w; h; z; text: string; variant: "dark" | "light" }
  | { id; type: "brand"; x; y; w; h; z; /* avatar + nome + @handle */ }
```

- Coordenadas em **px da largura de design (420)**, igual `dx/dy` do `el`.
  Escala junto do slide (filmstrip, canvas, export).
- `id` = `crypto.randomUUID()` (não índice): a chave do override do
  editor precisa ser estável quando o usuário apaga um bloco do meio.
- Limite: 12 blocos por slide (guard no reducer, evita JSON gigante).

## Render: `BlockLayer`

- Componente novo `components/carousel/block-layer.tsx`, montado **dentro do
  root do `SlidePreview`** depois do layout (`position:absolute; inset:0;
  z-index` acima do layout). Cada bloco = `<div data-edit="block"
  data-edit-key={id} style={{left,top,width,height,transform}}>`.
- `collectEditableNodes` passa a preferir `data-edit-key` quando existe
  (senão mantém `tipo-índice`). Uma linha; não muda nada pros layouts.
- Texto de bloco usa o mesmo `fontClass` do carrossel por padrão.
- Imagem de bloco passa pelo `proxiedImageUrl` (export PNG precisa de CORS).
- **Sem `backdrop-filter`** em bloco (vira sombra borrada no html-to-image,
  já aprendido na Pill).

## Interação: reaproveitar o overlay

`editable-canvas.tsx` já faz hover/seleção/drag com clamp, snap, menu de
contexto. Para `type === "block"`:

1. Drag move `x/y` (não `dx/dy`), commit no `pointerup`.
2. Alças de canto fazem **resize real** (`w/h`), não `scale`. Texto re-flui
   dentro da caixa (sem FitText; tamanho de fonte é do bloco).
3. Menu de contexto ganha: Trazer pra frente / Enviar pra trás / Duplicar /
   Excluir / Aplicar em todos os slides.
4. `Delete`/`Backspace` com bloco selecionado → remove (já existe atalho de
   teclado no overlay; só estender).

## Sidebar: section "Adicionar"

Nova `Section` no editor (`carousel-editor.tsx`) com botões: Título, Texto,
Imagem (upload ou biblioteca), Forma, Tag, Marca. Ao clicar, o bloco nasce
no centro do slide com tamanho padrão e já selecionado. Com bloco
selecionado a section "Elemento" mostra os campos do tipo (texto, cor,
tamanho, alinhamento, preenchimento, raio, opacidade).

## Ocultar elemento nativo (complemento necessário)

Pra trocar o "arrasta →" ou a marca do layout pela versão do usuário, precisa
poder **esconder** o nativo: `ElementOverride.hidden?: boolean` →
`applyElementOverrides` seta `visibility:hidden` (mantém o fluxo do layout,
então nada reflui nem colide). Reversível igual cor/transform.

## Fundo com degradê (o que faltou no P0)

`slide.bgGradient?: { from: string; to: string; angle: number }`. Quando
presente, o root da capa/split usa `linear-gradient(angle, from, to)` em vez
de `backgroundColor`. No estilo `gradient`, expor também a cor do glow
(`slide.glow?: string`, default = accent). Controle na section "Fundo do
Slide": toggle Sólido / Degradê + 6 presets + dois color pickers + ângulo.
`accentForBg` passa a avaliar a luminância do `from`.

## Fases

| Fase | Entrega | Risco |
|------|---------|-------|
| P0 (feito) | `meta` editável + `bgOverride` nas capas | nenhum |
| P1 (feito 22/08) | `slide-blocks.ts` (modelo) + `block-layer.tsx` (render) + `block-panel.tsx` (barra estilo Elementor: + Elementos / Editar / Histórico rotulado) + drag/resize/Delete/setas/menu (duplicar, frente/trás, alinhar) + section "Bloco" com propriedades por tipo. Tipos: título, texto, imagem (upload), tag, forma, divisor. Persistência automática (carousel_data). | baixo: aditivo |
| P2 (feito 22/08) | Bloco Marca (avatar+nome+@+selo, puxa identidade do carrossel) · `ElementOverride.hidden` (menu "Ocultar elemento" + botão na section; chips "Elementos ocultos" no Conteúdo pra restaurar) · fundo degradê (`slide.bgGradient`, 6 presets + from/to/ângulo, pintado no nó raiz via layout effect do SlidePreview) · glow editável (`slide.glow`) nos estilos gradient/seamless. Biblioteca de imagens NÃO entrou (depende de migration pendente). | baixo |
| P3 (feito 22/08) | Fonte por bloco (CAROUSEL_FONTS), sombra suave, opacidade, snap a bordas/centros dos outros elementos com guia posicionada, "Aplicar em todos os slides" (menu do bloco). Pendente: biblioteca de imagens (migration). | baixo |

Tudo validado via DOM no `/teste-editor` (mesmo `CarouselEditor` do `/dashboard/carrossel`). Falta revisão visual do Marcos no editor principal + export PNG com blocos.

## O que NÃO fazer

- Não converter os layouts em árvore de blocos "de verdade" (o Elementor
  completo): o valor do produto é o slide sair pronto; layout livre total é
  o caminho do resultado pobre já diagnosticado no post único (skeletons).
- Não mexer em `FitText`/`bodyScale`: blocos têm caixa própria.
- Não criar migration: tudo vive em `carousel_data`.
