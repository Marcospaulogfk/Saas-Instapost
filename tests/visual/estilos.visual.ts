// Fotografa cada estilo de carrossel (5 slides lado a lado) na página de
// prévia sem login e compara com a referência em __referencias__/.
// Se alguém mudar um layout sem querer, este teste acusa.
import { test, expect, type Page } from "@playwright/test"
import { CAROUSEL_STYLES } from "../../components/carousel/carousel-styles"

// Estilos que ainda estão sendo desenhados: a aparência muda a toda hora, então
// não têm referência ainda e ficam de fora. Quando um ficar pronto, tire-o
// daqui e rode `npm run test:visual:update` pra gerar a foto de referência.
export const ESTILOS_EM_CONSTRUCAO: string[] = []

// Estilos que respeitam o "Fundo do Slide" escolhido pelo usuário: ganham duas
// fotos extras (fundo claro e fundo escuro) pra proteger a troca de fundo.
const ESTILOS_COM_FUNDO = ["minimal", "gradient", "cards"]
const FUNDO_CLARO = "#FAF8F5"
const FUNDO_ESCURO = "#0A0A0F"

// Imagem de fundo (?fundo=dark|light na prévia): um estilo de cada família —
// conteúdo com foto embaixo (wesley), capa clara que vira escura (minimal),
// cartões por cima do fundo (cards) e estilo novo com título na cor da marca
// (poster). A foto de fundo é a mesma fixa da prévia (BG_IMG).
const ESTILOS_COM_IMAGEM_DE_FUNDO = ["wesley", "minimal", "cards", "poster"]
const IMAGEM_DE_FUNDO = "/refs-posts-unicos/empresa/03/referencia.jpg"

const ESTILOS = CAROUSEL_STYLES.map((s) => s.style).filter(
  (id) => !ESTILOS_EM_CONSTRUCAO.includes(id),
)

/** Abre a prévia e espera fontes, imagens e o ajuste de fonte (FitText) assentarem. */
async function abrirPrevia(
  page: Page,
  estilo: string,
  bg?: string,
  fundo?: "dark" | "light",
) {
  const params = new URLSearchParams({ estilo, todos: "1" })
  if (bg) params.set("bg", bg)
  if (fundo) params.set("fundo", fundo)
  await page.goto(`/preview-estilos?${params.toString()}`)

  const todos = page.getByTestId("slides-todos")
  await expect(todos).toBeVisible()
  await expect(page.getByTestId("slide-5")).toBeVisible()

  // Fontes (Inter via next/font e as dos estilos) carregadas.
  await page.evaluate(() => document.fonts.ready.then(() => true))

  // Todas as <img> dentro dos slides decodificadas (complete && naturalWidth > 0).
  await page.waitForFunction(() => {
    const raiz = document.querySelector('[data-testid="slides-todos"]')
    if (!raiz) return false
    const imgs = Array.from(raiz.querySelectorAll("img"))
    return imgs.every((img) => img.complete && img.naturalWidth > 0)
  })

  // A imagem de fundo é CSS (não é <img>): espera ela carregar também.
  if (fundo) {
    await page.evaluate(
      (src) =>
        new Promise<void>((ok) => {
          const im = new Image()
          im.onload = im.onerror = () => ok()
          im.src = src
        }),
      IMAGEM_DE_FUNDO,
    )
  }

  // FitText e afins ajustam o tamanho da letra em efeitos; dá um fôlego.
  await page.waitForTimeout(300)
  return todos
}

for (const estilo of ESTILOS) {
  test.describe(`estilo ${estilo}`, () => {
    test("5 slides lado a lado", async ({ page }) => {
      const todos = await abrirPrevia(page, estilo)
      await expect(todos).toHaveScreenshot(`${estilo}.png`)
    })

    if (ESTILOS_COM_FUNDO.includes(estilo)) {
      test("fundo claro trocado", async ({ page }) => {
        const todos = await abrirPrevia(page, estilo, FUNDO_CLARO)
        await expect(todos).toHaveScreenshot(`${estilo}-fundo-claro.png`)
      })

      test("fundo escuro trocado", async ({ page }) => {
        const todos = await abrirPrevia(page, estilo, FUNDO_ESCURO)
        await expect(todos).toHaveScreenshot(`${estilo}-fundo-escuro.png`)
      })
    }

    if (ESTILOS_COM_IMAGEM_DE_FUNDO.includes(estilo)) {
      test("imagem de fundo escurecida", async ({ page }) => {
        const todos = await abrirPrevia(page, estilo, undefined, "dark")
        await expect(todos).toHaveScreenshot(`${estilo}-imagem-escura.png`)
      })

      test("imagem de fundo clareada", async ({ page }) => {
        const todos = await abrirPrevia(page, estilo, undefined, "light")
        await expect(todos).toHaveScreenshot(`${estilo}-imagem-clara.png`)
      })
    }
  })
}
