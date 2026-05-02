// Paleta SyncPost — só roxo + neutros, sem rosa/fuchsia/indigo.
const BRAND_GRADIENTS = [
  "bg-gradient-to-br from-purple-500 to-violet-700",
  "bg-gradient-to-br from-violet-500 to-purple-800",
  "bg-gradient-to-br from-purple-600 to-violet-900",
  "bg-gradient-to-br from-violet-600 to-purple-900",
  "bg-gradient-to-br from-purple-400 to-purple-800",
  "bg-gradient-to-br from-violet-400 to-violet-800",
  "bg-gradient-to-br from-purple-700 to-zinc-900",
  "bg-gradient-to-br from-violet-700 to-zinc-950",
] as const

const PROJECT_GRADIENTS = [
  "bg-gradient-to-br from-purple-600 to-violet-900",
  "bg-gradient-to-br from-violet-600 to-purple-950",
  "bg-gradient-to-br from-purple-700 to-violet-950",
  "bg-gradient-to-br from-violet-700 to-purple-950",
  "bg-gradient-to-br from-purple-500 to-zinc-900",
  "bg-gradient-to-br from-violet-500 to-zinc-950",
  "bg-gradient-to-br from-purple-800 to-black",
  "bg-gradient-to-br from-violet-800 to-zinc-950",
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
