// ============================================================================
// Registro dos estilos novos de carrossel. Um arquivo por estilo; o
// SlidePreview consulta este mapa antes de cair nos estilos originais.
// Pra adicionar um estilo: (1) id na união EditorialStyle (slide-preview.tsx),
// (2) ficha em carousel-styles.ts, (3) arquivo aqui e linha no mapa abaixo.
// ============================================================================
import type { EditorialStyle } from "../slide-preview"
import type { StyleRenderer } from "./types"
import { lookbookStyle } from "./lookbook"
import { cinemaStyle } from "./cinema"
import { estudioStyle } from "./estudio"
import { colagemStyle } from "./colagem"
import { cartazStyle } from "./cartaz"
import { agenciaStyle } from "./agencia"
import { posterStyle } from "./poster"
import { geometricoStyle } from "./geometrico"

export const EXTRA_STYLE_RENDERERS: Partial<Record<EditorialStyle, StyleRenderer>> = {
  lookbook: lookbookStyle,
  cinema: cinemaStyle,
  estudio: estudioStyle,
  colagem: colagemStyle,
  cartaz: cartazStyle,
  agencia: agenciaStyle,
  poster: posterStyle,
  geometrico: geometricoStyle,
}

export type { StyleRenderer, StyleRouteContext, StyleBaseProps } from "./types"
