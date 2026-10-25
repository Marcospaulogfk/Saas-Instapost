// Substituto de next/font/google nos testes: cada fonte vira uma classe fixa
// ("font-inter"), sem baixar nada. Só o nome entra no HTML, o que basta pra
// comparar o render dos slides.
type FontFn = (opts?: unknown) => { className: string; style: { fontFamily: string } }

function makeFont(name: string): FontFn {
  const slug = name.replace(/_/g, "-").toLowerCase()
  return () => ({ className: `font-${slug}`, style: { fontFamily: name } })
}

export default new Proxy(
  {},
  { get: (_t, prop: string) => makeFont(prop) },
) as Record<string, FontFn>

export const Inter = makeFont("Inter")
export const Space_Grotesk = makeFont("Space_Grotesk")
export const Syne = makeFont("Syne")
export const Outfit = makeFont("Outfit")
export const DM_Sans = makeFont("DM_Sans")
export const Montserrat = makeFont("Montserrat")
export const Playfair_Display = makeFont("Playfair_Display")
export const Bebas_Neue = makeFont("Bebas_Neue")
export const Manrope = makeFont("Manrope")
export const Archivo = makeFont("Archivo")
export const Anton = makeFont("Anton")
export const Oswald = makeFont("Oswald")
export const Instrument_Serif = makeFont("Instrument_Serif")
export const Cormorant_Garamond = makeFont("Cormorant_Garamond")
export const Caveat = makeFont("Caveat")
export const Barlow_Condensed = makeFont("Barlow_Condensed")
export const Fraunces = makeFont("Fraunces")
export const Libre_Caslon_Display = makeFont("Libre_Caslon_Display")
