// Paleta SyncPost — toda baseada em roxo/violeta/magenta com nuances
const BRAND_GRADIENTS = [
  "bg-gradient-to-br from-purple-500 to-violet-700",
  "bg-gradient-to-br from-fuchsia-500 to-purple-700",
  "bg-gradient-to-br from-violet-400 to-purple-700",
  "bg-gradient-to-br from-purple-400 to-fuchsia-700",
  "bg-gradient-to-br from-indigo-500 to-purple-700",
  "bg-gradient-to-br from-pink-500 to-purple-700",
  "bg-gradient-to-br from-violet-500 to-indigo-700",
  "bg-gradient-to-br from-purple-600 to-pink-700",
] as const

const PROJECT_GRADIENTS = [
  "bg-gradient-to-br from-purple-600 to-violet-800",
  "bg-gradient-to-br from-fuchsia-600 to-purple-800",
  "bg-gradient-to-br from-violet-500 to-purple-800",
  "bg-gradient-to-br from-purple-500 to-fuchsia-800",
  "bg-gradient-to-br from-indigo-600 to-purple-800",
  "bg-gradient-to-br from-pink-600 to-purple-800",
  "bg-gradient-to-br from-violet-600 to-indigo-800",
  "bg-gradient-to-br from-purple-700 to-pink-800",
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
