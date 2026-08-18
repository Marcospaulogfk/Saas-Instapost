// =====================================================================
// lib/brands/copy-name.ts
// Nome da marca duplicada. Função pura — o server action só passa a lista de
// nomes que já existem na conta.
// =====================================================================

/** Prefixo padrão da cópia. */
const COPY_PREFIX = "Cópia de "

/** Limite de sufixos antes de desistir e cair no timestamp. */
const MAX_ATTEMPTS = 50

/**
 * Monta "Cópia de X" e, se esse nome já estiver em uso, "Cópia de X (2)",
 * "(3)"... A agência que duplica a mesma marca base várias vezes não pode
 * acabar com três "Cópia de Acme" indistinguíveis na lista.
 *
 * Se a marca de origem já for uma cópia ("Cópia de Acme"), NÃO empilha prefixo
 * ("Cópia de Cópia de Acme") — reusa a base e só numera.
 */
export function buildCopyName(
  sourceName: string,
  existingNames: string[],
): string {
  const base = sourceName.trim() || "Marca"
  const root = base.startsWith(COPY_PREFIX) ? base : `${COPY_PREFIX}${base}`

  const taken = new Set(
    existingNames.map((n) => n.trim().toLowerCase()).filter(Boolean),
  )

  if (!taken.has(root.toLowerCase())) return root

  for (let i = 2; i <= MAX_ATTEMPTS; i++) {
    const candidate = `${root} (${i})`
    if (!taken.has(candidate.toLowerCase())) return candidate
  }

  // Fallback improvável: garante unicidade sem loop infinito.
  return `${root} (${Date.now()})`
}
