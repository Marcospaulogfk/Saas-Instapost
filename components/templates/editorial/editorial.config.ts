export const CANVAS_CONFIG = {
  width: 1080,
  height: 1350,
  safeArea: 64,
  headerHeight: 80,
  footerHeight: 80,
}

// IMPORTANTE: Konva renderiza no <canvas> e NÃO resolve CSS variables.
// Os nomes aqui são literais — next/font carrega as @font-face com esses nomes
// e o Konva consegue achar via document.fonts.
export const EDITORIAL_FONTS = {
  display: {
    // Anton — sans bold condensed grosso (style das refs @brandsdecoded__).
    family: '"Anton", "Bebas Neue", Impact, "Arial Black", sans-serif',
    weight: 700,
  },
  serif: {
    family: '"Playfair Display", Georgia, "Times New Roman", serif',
    weight: 900,
  },
  body: {
    family: '"Space Grotesk", Inter, system-ui, sans-serif',
    weight: 400,
  },
  bodyBold: {
    family: '"Space Grotesk", Inter, system-ui, sans-serif',
    weight: 600,
  },
  tag: {
    family: '"Space Grotesk", Inter, system-ui, sans-serif',
    weight: 500,
  },
}

/**
 * Famílias usadas pra preload de fontes via document.fonts.load().
 * Garantimos que carregam antes do Konva renderizar.
 */
export const EDITORIAL_FONT_LOAD_SPECS = [
  '700 130px "Anton"',
  '900 64px "Playfair Display"',
  '400 30px "Space Grotesk"',
  '600 30px "Space Grotesk"',
  '500 14px "Space Grotesk"',
] as const

export const EDITORIAL_SIZES = {
  header: { fontSize: 14, paddingTop: 32, paddingX: 48 },
  footer: { fontSize: 12, paddingBottom: 40, paddingX: 48 },
  tag: { fontSize: 16, marginBottom: 20 },
  titleHero: { fontSize: 130, lineHeight: 0.92 },
  titleLarge: { fontSize: 105, lineHeight: 0.95 },
  titleMedium: { fontSize: 85, lineHeight: 0.95 },
  titleSerif: { fontSize: 64, lineHeight: 1.15 },
  bodyLarge: { fontSize: 38, lineHeight: 1.4 },
  bodyMedium: { fontSize: 30, lineHeight: 1.4 },
  bodySmall: { fontSize: 24, lineHeight: 1.4 },
  subtitle: { fontSize: 26, lineHeight: 1.4 },
  bigNumber: { fontSize: 320, opacity: 0.04 },
}

export const EDITORIAL_COLORS = {
  bg: {
    dark: '#0A0A0F',
    darker: '#050507',
    cream: '#F5F2EC',
    white: '#FFFFFF',
    // navy/sepia mapeados pra preto puro pra carrosseis legados não quebrarem.
    navy: '#0A0A0F',
    sepia: '#0A0A0F',
  },
  brand: {
    primary: '#7C3AED',
    light: '#A78BFA',
    pale: '#DDD6FE',
  },
  text: {
    white: '#FFFFFF',
    dark: '#0A0A0F',
    grayLight: '#C4C4C4',
    grayDark: '#4A4A4A',
    mutedLight: 'rgba(255,255,255,0.5)',
    mutedDark: 'rgba(0,0,0,0.5)',
  },
}
