import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Regras de copy como FONTE DA VERDADE em markdown neutro
 * (`lib/copy/regras/*.md`), independentes de fornecedor de IA.
 *
 * Decisão de produto (21/08/2026, CUSTOS-IA-MARGEM): as regras não podem
 * ficar calibradas pra um modelo específico, porque o escritor vai a teste
 * cego (Gemini / Haiku / Sonnet) e pode ser trocado a qualquer momento. O
 * código monta o prompt concatenando estes blocos com o contrato de saída
 * (que é formato, e esse sim fica no TS de cada gerador).
 *
 * Leitura: `fs` no primeiro uso, cacheado por processo. O deploy roda
 * `next start` no repositório inteiro (sem `output: standalone`), então os
 * .md estão no disco. Se algum dia migrar pra standalone, incluir
 * `lib/copy/regras/**` em `outputFileTracingIncludes`.
 */

export type RegraCopy =
  | "principios"
  | "capa"
  | "estrutura"
  | "profundidade"
  | "legenda"
  | "imagem"

const ARQUIVOS: Record<RegraCopy, string> = {
  principios: "01-principios.md",
  capa: "02-capa.md",
  estrutura: "03-estrutura.md",
  profundidade: "04-profundidade.md",
  legenda: "05-legenda.md",
  imagem: "06-imagem.md",
}

const DIR = join(process.cwd(), "lib", "copy", "regras")
const cache = new Map<RegraCopy, string>()

/** Conteúdo de um bloco de regras (markdown cru, sem o cabeçalho H1 removido). */
export function regraCopy(nome: RegraCopy): string {
  const hit = cache.get(nome)
  if (hit !== undefined) return hit
  const texto = readFileSync(join(DIR, ARQUIVOS[nome]), "utf-8").trim()
  cache.set(nome, texto)
  return texto
}

/** Vários blocos concatenados, na ordem pedida, separados por linha em branco. */
export function regrasCopy(...nomes: RegraCopy[]): string {
  return nomes.map(regraCopy).join("\n\n")
}

/**
 * Só a seção "Regra do sujeito" do bloco de imagem: é o que o post único
 * precisa (ele tem o próprio template de prompt, que descreve o design
 * inteiro e não só uma foto).
 */
export function regraSujeitoImagem(): string {
  const md = regraCopy("imagem")
  const ini = md.indexOf("## Regra do sujeito")
  const fim = md.indexOf("## Template do prompt")
  if (ini === -1) return ""
  return md.slice(ini, fim === -1 ? undefined : fim).trim()
}
