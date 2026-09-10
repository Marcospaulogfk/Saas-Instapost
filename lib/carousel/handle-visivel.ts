/**
 * O @ do Instagram como deve APARECER no slide, ou "" pra esconder a linha.
 *
 * Existe por causa do R4-10 (rodada 4 do testador, 10/09/2026): marca sem @
 * cadastrado saía com "@MARCA" no post pronto. Os fallbacks de exemplo
 * ("marca", "@marca", "@brand") foram removidos na criação, mas carrosséis
 * JÁ SALVOS guardaram o marcador no próprio slide. Filtrar na hora de mostrar
 * é o que conserta as peças antigas também, sem migrar dado nenhum.
 *
 * Marcador de exemplo = "sem handle": a linha some, em vez de publicar texto
 * de mentira no perfil do cliente.
 */
const MARCADORES = new Set(["marca", "brand", "suamarca", "sua_marca", "seuperfil", "handle"])

export function handleVisivel(handle: string | null | undefined): string {
  const limpo = (handle ?? "").trim()
  const semArroba = limpo.replace(/^@+/, "")
  if (!semArroba) return ""
  if (MARCADORES.has(semArroba.toLowerCase())) return ""
  return limpo.startsWith("@") ? limpo : `@${limpo}`
}
