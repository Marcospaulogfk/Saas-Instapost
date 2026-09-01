/**
 * Objetivo de uso da conta ("como você vai usar o Nexus?", estilo Canva).
 * Espelha o `check` da migration 0026 — mantido em UM lugar pra não divergir
 * do banco. Mora fora de app/actions porque arquivo "use server" só pode
 * exportar função async — validador síncrono não tem o que fazer lá.
 */
export const OBJETIVOS_VALIDOS = ["negocio", "criador", "clientes", "estudo"] as const
export type ObjetivoUso = (typeof OBJETIVOS_VALIDOS)[number]

export function isObjetivoUsoValido(v: unknown): v is ObjetivoUso {
  return typeof v === "string" && (OBJETIVOS_VALIDOS as readonly string[]).includes(v)
}
