"use client"

// ============================================================================
// SANDBOX DEV do editor Canva-like (/teste-editor) — rota pública de teste,
// irmã do /teste. Monta o CarouselEditor com slides mockados pra exercitar
// seleção/drag/painéis sem login. Não é linkada em lugar nenhum do app.
// initialCarouselId="sandbox" pula o auto-save (sem sessão, save manual
// falharia com "Não autenticado" — esperado aqui).
// ============================================================================

import { CarouselEditor } from "@/components/carousel/carousel-editor"
import type { PreviewSlide } from "@/components/carousel/slide-preview"

const NO_IMAGE = { url: null, source: null, attribution: null, error: null } as const

const SLIDES: PreviewSlide[] = [
  {
    order_index: 0,
    title: "3 erros que travam o seu crescimento no Instagram",
    highlight_words: ["travam"],
    subtitle: "O que separa quem cresce de quem estaciona.",
    cta_badge: "Crescimento",
    image: { ...NO_IMAGE, url: "/creator-1.png", source: "ai" },
  },
  {
    order_index: 1,
    title: "Poste com constância, não com intensidade",
    highlight_words: ["constância"],
    subtitle: "O algoritmo premia quem aparece toda semana.",
    body: "Escolha 3 formatos, monte um calendário simples e rode sem falhar. Consistência bate volume.",
    cta_badge: "Dica 01",
    image: { ...NO_IMAGE, url: "/creator-2.png", source: "ai" },
  },
  {
    order_index: 2,
    title: "Conteúdo salvo vale mais que curtida",
    highlight_words: ["salvo"],
    subtitle: "Salvamento é o sinal mais forte pro alcance.",
    body: "Crie posts de referência: listas, checklists e guias que a pessoa quer rever depois.",
    cta_badge: "Dica 02",
    image: { ...NO_IMAGE },
  },
  {
    order_index: 3,
    title: "Salve este post e comece hoje",
    highlight_words: ["hoje"],
    subtitle: "Toque em salvar e volte quando for criar.",
    cta_badge: "Siga @sandbox",
    image: { ...NO_IMAGE },
  },
]

export default function TesteEditorPage() {
  return (
    <CarouselEditor
      initialSlides={SLIDES}
      initialTitle="Sandbox do editor"
      caption="Sandbox"
      brandName="Sandbox"
      handle="@sandbox"
      colors={["#7320E6", "#0A0A0F", "#FAF8F5"]}
      template="editorial"
      editorialStyle="minimal"
      initialCarouselId="sandbox"
    />
  )
}
