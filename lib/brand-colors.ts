const BRAND_GRADIENTS = [
  "bg-gradient-to-br from-orange-500 to-red-600",
  "bg-gradient-to-br from-blue-500 to-purple-600",
  "bg-gradient-to-br from-green-500 to-teal-600",
  "bg-gradient-to-br from-purple-500 to-pink-600",
  "bg-gradient-to-br from-cyan-500 to-blue-600",
  "bg-gradient-to-br from-yellow-500 to-orange-600",
  "bg-gradient-to-br from-rose-500 to-red-700",
  "bg-gradient-to-br from-emerald-500 to-green-700",
] as const

const PROJECT_GRADIENTS = [
  "bg-gradient-to-br from-orange-600 to-red-700",
  "bg-gradient-to-br from-blue-600 to-purple-700",
  "bg-gradient-to-br from-green-600 to-teal-700",
  "bg-gradient-to-br from-purple-600 to-pink-700",
  "bg-gradient-to-br from-cyan-600 to-blue-700",
  "bg-gradient-to-br from-yellow-600 to-orange-700",
  "bg-gradient-to-br from-rose-600 to-red-800",
  "bg-gradient-to-br from-emerald-600 to-green-800",
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
