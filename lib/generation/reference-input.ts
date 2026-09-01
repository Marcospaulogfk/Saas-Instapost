/**
 * Validação compartilhada do "prompt adicional" + imagens de referência do
 * wizard (Step3 de app/dashboard/criar/page.tsx). Os dois endpoints de texto
 * (post único e carrossel) recebem os mesmos dois campos no payload e
 * precisam do mesmo portão de sanidade — daí viver num lugar só em vez de
 * duplicar a validação em cada route.ts.
 */

export interface ReferenceImage {
  mediaType: string
  data: string
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
])

// O cliente comprime pra no máx ~1024px no maior lado em JPEG q~0.8 antes de
// mandar (ver page.tsx) — isso fica bem abaixo disto. A margem é generosa de
// propósito: só existe pra barrar payload claramente fora do padrão esperado
// (ex.: alguém batendo direto na API sem passar pelo wizard).
const MAX_IMAGE_BASE64_CHARS = 6_000_000
const MAX_IMAGES = 3
const MAX_INSTRUCOES_CHARS = 4000

/** Valida e normaliza as imagens de referência vindas do wizard. */
export function validarImagensReferencia(
  raw: unknown,
): ValidationResult<ReferenceImage[]> {
  if (raw === undefined || raw === null) return { ok: true, value: [] }
  if (!Array.isArray(raw)) {
    return { ok: false, error: "imagensReferencia deve ser uma lista." }
  }
  if (raw.length > MAX_IMAGES) {
    return {
      ok: false,
      error: `Máximo de ${MAX_IMAGES} imagens de referência.`,
    }
  }
  const images: ReferenceImage[] = []
  for (const item of raw) {
    const mediaType =
      item && typeof item === "object" && typeof (item as Record<string, unknown>).mediaType === "string"
        ? ((item as Record<string, unknown>).mediaType as string)
        : ""
    const data =
      item && typeof item === "object" && typeof (item as Record<string, unknown>).data === "string"
        ? ((item as Record<string, unknown>).data as string)
        : ""
    if (!ALLOWED_IMAGE_TYPES.has(mediaType)) {
      return {
        ok: false,
        error: "Formato de imagem de referência não suportado.",
      }
    }
    if (!data || data.length > MAX_IMAGE_BASE64_CHARS) {
      return {
        ok: false,
        error: "Imagem de referência excede o tamanho máximo permitido.",
      }
    }
    images.push({ mediaType, data })
  }
  return { ok: true, value: images }
}

/** Valida o texto livre de instruções adicionais do usuário. */
export function validarInstrucoesAdicionais(
  raw: unknown,
): ValidationResult<string> {
  if (raw === undefined || raw === null) return { ok: true, value: "" }
  if (typeof raw !== "string") {
    return { ok: false, error: "instrucoesAdicionais deve ser texto." }
  }
  const trimmed = raw.trim()
  if (trimmed.length > MAX_INSTRUCOES_CHARS) {
    return {
      ok: false,
      error: `Instruções adicionais muito longas (máx ${MAX_INSTRUCOES_CHARS} caracteres).`,
    }
  }
  return { ok: true, value: trimmed }
}
