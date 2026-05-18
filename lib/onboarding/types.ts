export type EntryMethod = "website" | "instagram" | "manual"

export type Objective =
  | "sell"
  | "authority"
  | "engagement"
  | "leads"

export interface OnboardingState {
  // Tela 1
  entryMethod: EntryMethod | null
  sourceUrl: string | null
  instagramHandle: string | null

  // Tela 2 (preenchido pela IA)
  detectedLogoUrl: string | null
  extractedColors: string[]

  // Passo 1
  objective: Objective | null

  // Passo 2
  brandName: string
  country: string
  countryName: string
  description: string

  // Passo 3
  idealCustomer: string
  pains: string
  desires: string

  // Passo 4
  tones: string[]
  archetype: string | null
  visualStyle: string

  // Passo 5
  logoUrl: string | null
  logoFileName: string | null
  customColors: boolean
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

export const DEFAULT_STATE: OnboardingState = {
  entryMethod: null,
  sourceUrl: null,
  instagramHandle: null,
  detectedLogoUrl: null,
  extractedColors: [],
  objective: null,
  brandName: "",
  country: "BR",
  countryName: "Brasil",
  description: "",
  idealCustomer: "",
  pains: "",
  desires: "",
  tones: [],
  archetype: null,
  visualStyle: "",
  logoUrl: null,
  logoFileName: null,
  customColors: false,
  primaryColor: "#7C5CFF",
  secondaryColor: "#5B8FF9",
  accentColor: "#E2D5FF",
}

export const STEP_ROUTES = [
  "/onboarding/objetivo",
  "/onboarding/marca",
  "/onboarding/publico",
  "/onboarding/identidade",
  "/onboarding/estilo",
] as const

export type StepRoute = (typeof STEP_ROUTES)[number]

export const STEPS = [
  { route: "/onboarding/objetivo", label: "Objetivo", index: 1 },
  { route: "/onboarding/marca", label: "Marca", index: 2 },
  { route: "/onboarding/publico", label: "Público", index: 3 },
  { route: "/onboarding/identidade", label: "Identidade", index: 4 },
  { route: "/onboarding/estilo", label: "Estilo", index: 5 },
] as const
