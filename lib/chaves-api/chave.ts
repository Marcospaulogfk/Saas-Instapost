import { createHash, randomBytes } from "node:crypto"

// =====================================================================
// lib/chaves-api/chave.ts
// O formato da chave de integração e as duas contas que se faz com ela:
// gerar e transformar em hash.
//
// Formato: nxc_live_ + 32 caracteres.
//   nxc  = Nexus Content
//   live = ambiente. Existe desde já porque o dia em que houver chave de
//          teste, ninguém vai conseguir distinguir as antigas.
//
// Alfabeto base58: fora dele ficam 0, O, I e l — os quatro que trocam de
// lugar quando alguém lê a chave em voz alta, copia de um print ou digita
// à mão num campo do n8n. Ambiguidade aqui vira ticket de suporte, não
// vira segurança.
//
// Entropia: 32 caracteres de um alfabeto de 58 ~ 187 bits. É por isso que
// o hash pode ser um sha256 seco, sem salt nem KDF: não existe dicionário
// nem força bruta contra isso, e o hash direto é o que permite achar a
// linha por índice, numa consulta só, em toda requisição.
// =====================================================================

export const PREFIXO_CHAVE = "nxc_live_"

/** Quantos caracteres aleatórios vêm depois do prefixo. */
const CORPO = 32

/** Base58 (Bitcoin): sem 0, O, I e l. O 1 fica, porque o l saiu. */
const ALFABETO = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

/** Quanto da chave fica visível na tela e no banco (com o prefixo junto). */
const VISIVEL = 6

export interface ChaveNova {
  /** A chave completa. Existe uma vez, na resposta da criação, e some. */
  chave: string
  /** Pedaço mostrável, ex.: "nxc_live_a1B2c3". Não é segredo. */
  prefixo: string
  /** sha256 hex — o que vai pro banco. */
  hash: string
}

/**
 * Sorteia por rejeição em vez de `% 58`: o resto do módulo daria peso maior
 * aos primeiros caracteres do alfabeto. Custa alguns bytes a mais e tira o
 * viés inteiro da conta.
 */
function sortear(quantidade: number): string {
  let saida = ""
  const limite = Math.floor(256 / ALFABETO.length) * ALFABETO.length
  while (saida.length < quantidade) {
    for (const byte of randomBytes(quantidade)) {
      if (byte >= limite) continue
      saida += ALFABETO[byte % ALFABETO.length]
      if (saida.length === quantidade) break
    }
  }
  return saida
}

export function gerarChave(): ChaveNova {
  const chave = PREFIXO_CHAVE + sortear(CORPO)
  return {
    chave,
    prefixo: chave.slice(0, PREFIXO_CHAVE.length + VISIVEL),
    hash: hashChave(chave),
  }
}

export function hashChave(chave: string): string {
  return createHash("sha256").update(chave, "utf8").digest("hex")
}

/** Tem cara de chave nossa? Barra o lixo antes de bater no banco. */
export function pareceChave(valor: string): boolean {
  if (!valor.startsWith(PREFIXO_CHAVE)) return false
  const corpo = valor.slice(PREFIXO_CHAVE.length)
  if (corpo.length !== CORPO) return false
  for (const c of corpo) if (!ALFABETO.includes(c)) return false
  return true
}

/** Como a chave aparece numa lista: "nxc_live_a1B2c3••••••". */
export function mascarar(prefixo: string): string {
  return `${prefixo}${"•".repeat(8)}`
}
