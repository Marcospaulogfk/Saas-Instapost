/**
 * Utilities pra trabalhar com quebras de linha.
 * IMPORTANTE: A IA já manda os títulos quebrados.
 * Esta função é fallback se vier título não quebrado.
 */
export function breakTitleSmart(title: string, maxWordsPerLine: number = 4): string[] {
  const words = title.split(' ')
  const lines: string[] = []
  let currentLine: string[] = []

  for (const word of words) {
    currentLine.push(word)
    if (currentLine.length >= maxWordsPerLine) {
      lines.push(currentLine.join(' '))
      currentLine = []
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '))
  }
  return lines
}
