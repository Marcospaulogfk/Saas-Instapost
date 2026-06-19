/**
 * Tamanho de fonte que se ADAPTA ao comprimento do texto, pra o título caber no
 * template sem estourar — em vez de um tamanho fixo. A ideia: o post se adequa
 * ao template (encolhe quando o texto é longo) e não segue 100% na risca.
 *
 * @param lines    linhas do título (title_lines)
 * @param maxCqw   tamanho máximo em cqw (pra textos curtos) — o teto do template
 * @param widthCqw largura útil da caixa do título, em cqw (% da largura do canvas)
 * @param charRatio largura média de um caractere ≈ charRatio * fontSize (serif ~0.5)
 */
export function autoTitleSize(
  lines: string[],
  maxCqw = 15,
  widthCqw = 55,
  charRatio = 0.5,
): string {
  const longest = Math.max(1, ...lines.map((l) => (l ?? "").trim().length))
  const cqw = Math.max(6, Math.min(maxCqw, widthCqw / (longest * charRatio)))
  // teto em rem proporcional (no template original, 15cqw → 4rem).
  const rem = cqw * (4 / 15)
  return `min(${cqw.toFixed(1)}cqw, ${rem.toFixed(2)}rem)`
}
