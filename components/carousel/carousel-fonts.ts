import {
  Inter,
  Space_Grotesk,
  Syne,
  Outfit,
  DM_Sans,
  Montserrat,
  Playfair_Display,
  Bebas_Neue,
  Manrope,
  Archivo,
  Oswald,
  Caveat,
} from "next/font/google"

// Fontes disponíveis pra tipografia do carrossel. Cada uma carrega os pesos que
// os templates usam (o FitText aplica o peso via style). Curado — não a lista
// inteira do Google, pra não estourar o bundle.
const inter = Inter({ subsets: ["latin"], weight: ["400", "700", "800", "900"] })
const space = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"] })
const syne = Syne({ subsets: ["latin"], weight: ["600", "700", "800"] })
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "600", "800"] })
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "700"] })
const montserrat = Montserrat({ subsets: ["latin"], weight: ["600", "800", "900"] })
// Playfair carrega o itálico de verdade: os estilos de revista (Lookbook,
// Cinema) destacam uma palavra em serifa inclinada, e sem o arquivo itálico o
// navegador inventa uma inclinação feia.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  style: ["normal", "italic"],
})
const bebas = Bebas_Neue({ subsets: ["latin"], weight: ["400"] })
const manrope = Manrope({ subsets: ["latin"], weight: ["500", "700", "800"] })
const archivo = Archivo({ subsets: ["latin"], weight: ["600", "800", "900"] })
// Condensada (Cinema/Pôster) e manuscrita (Colagem) dos estilos novos.
const oswald = Oswald({ subsets: ["latin"], weight: ["500", "700"] })
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"] })

export interface CarouselFont {
  id: string
  label: string
  className: string
}

export const CAROUSEL_FONTS: CarouselFont[] = [
  { id: "inter", label: "Inter", className: inter.className },
  { id: "space", label: "Space", className: space.className },
  { id: "syne", label: "Syne", className: syne.className },
  { id: "outfit", label: "Outfit", className: outfit.className },
  { id: "dmsans", label: "DM Sans", className: dmSans.className },
  { id: "montserrat", label: "Montserrat", className: montserrat.className },
  { id: "playfair", label: "Playfair", className: playfair.className },
  { id: "bebas", label: "Bebas Neue", className: bebas.className },
  { id: "manrope", label: "Manrope", className: manrope.className },
  { id: "archivo", label: "Archivo", className: archivo.className },
  { id: "oswald", label: "Oswald", className: oswald.className },
  { id: "caveat", label: "Caveat", className: caveat.className },
]

/** Classe da fonte por id — cai no Inter se não achar. */
export function fontClassById(id: string | undefined | null): string {
  return CAROUSEL_FONTS.find((f) => f.id === id)?.className ?? inter.className
}
