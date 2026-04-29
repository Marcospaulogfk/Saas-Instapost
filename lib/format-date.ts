export function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 0) return "agora mesmo"

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  const year = 365 * day

  if (diff < minute) return "agora mesmo"
  if (diff < hour) {
    const v = Math.floor(diff / minute)
    return `ha ${v} ${v === 1 ? "minuto" : "minutos"}`
  }
  if (diff < day) {
    const v = Math.floor(diff / hour)
    return `ha ${v} ${v === 1 ? "hora" : "horas"}`
  }
  if (diff < week) {
    const v = Math.floor(diff / day)
    return v === 1 ? "ontem" : `ha ${v} dias`
  }
  if (diff < month) {
    const v = Math.floor(diff / week)
    return `ha ${v} ${v === 1 ? "semana" : "semanas"}`
  }
  if (diff < year) {
    const v = Math.floor(diff / month)
    return `ha ${v} ${v === 1 ? "mes" : "meses"}`
  }
  const v = Math.floor(diff / year)
  return `ha ${v} ${v === 1 ? "ano" : "anos"}`
}
