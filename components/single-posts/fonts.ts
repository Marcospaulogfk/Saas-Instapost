import {
  Playfair_Display,
  Inter,
  Anton,
  Allura,
  Bebas_Neue,
  Montserrat,
  Archivo_Black,
  Space_Grotesk,
} from "next/font/google"

export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
})

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-inter",
})

export const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
})

export const allura = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-allura",
})

export const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
})

export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-montserrat",
})

export const archivo = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo",
})

export const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
})

export const POST_FONT_CLASSES = {
  serif: playfair.className,
  sans: inter.className,
  condensed: anton.className,
  script: allura.className,
}
