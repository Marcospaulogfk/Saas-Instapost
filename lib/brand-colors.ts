// Paleta SyncPost — base escura (zinc) com acento roxo brand-700/800/900 nos extremos.
// Texto branco sobre estes gradientes mantém legibilidade.
const BRAND_GRADIENTS = [
  "bg-gradient-to-br from-brand-800 to-zinc-950",
  "bg-gradient-to-br from-brand-900 to-zinc-900",
  "bg-gradient-to-br from-brand-700 to-brand-950",
  "bg-gradient-to-br from-zinc-800 to-brand-900",
  "bg-gradient-to-br from-brand-800 to-black",
  "bg-gradient-to-br from-brand-900 to-zinc-950",
  "bg-gradient-to-br from-zinc-900 to-brand-950",
  "bg-gradient-to-br from-brand-700 to-zinc-900",
] as const

const PROJECT_GRADIENTS = [
  "bg-gradient-to-br from-brand-800 to-zinc-950",
  "bg-gradient-to-br from-brand-900 to-zinc-900",
  "bg-gradient-to-br from-brand-700 to-brand-950",
  "bg-gradient-to-br from-zinc-800 to-brand-900",
  "bg-gradient-to-br from-brand-900 to-black",
  "bg-gradient-to-br from-zinc-900 to-brand-950",
  "bg-gradient-to-br from-brand-800 to-zinc-950",
  "bg-gradient-to-br from-brand-700 to-zinc-950",
] as const

function hashId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getBrandGradient(id: string): string {
  return BRAND_GRADIENTS[hashId(id) % BRAND_GRADIENTS.length]!
}

export function getProjectGradient(id: string): string {
  return PROJECT_GRADIENTS[hashId(id) % PROJECT_GRADIENTS.length]!
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}
