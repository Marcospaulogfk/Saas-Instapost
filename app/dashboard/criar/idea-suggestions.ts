// =====================================================================
// Sugestões de ideia do passo 4, derivadas da MARCA ATIVA.
//
// Heurística local, ZERO chamada de IA: o passo 4 abre pra todo mundo que
// chega no wizard, e uma chamada de modelo aqui seria custo de COGS antes
// de qualquer intenção de gerar. As sugestões saem de nome + público +
// objetivo + abordagem que já estão em memória, e viram briefing pronto no
// textarea (o refino com IA continua acontecendo no "Gerar", como antes).
// =====================================================================

import type { ActiveBrandLite } from "@/app/actions/brands"

export type Objetivo = "vender" | "engajar" | "informar" | "comunidade"
export type Abordagem =
  | "viral"
  | "educativo"
  | "comunidade"
  | "storytelling"
  | "dados"
  | "oferta"

export interface IdeaSuggestion {
  /** Rótulo curto do card. */
  title: string
  /** Uma linha explicando o ângulo. */
  desc: string
  /** O que entra no textarea ao clicar. */
  briefing: string
}

interface Ctx {
  nome: string
  publico: string
  foco: string
}

/**
 * Extrai um "foco" curto da descrição da marca pra costurar nas frases.
 * Corta na primeira pontuação forte e limita o tamanho — descrição longa
 * viraria briefing ilegível.
 */
function focoFromBrand(brand: ActiveBrandLite | null, nome: string): string {
  const raw = brand?.description?.trim()
  if (!raw) return `o que a ${nome} resolve`
  const first = raw.split(/[.!?;\n]/)[0]?.trim() ?? ""
  if (first.length < 8) return `o que a ${nome} resolve`
  const cut = first.length > 70 ? `${first.slice(0, 70).trim()}...` : first
  return cut.charAt(0).toLowerCase() + cut.slice(1)
}

type Angle = (c: Ctx) => IdeaSuggestion

const BY_ABORDAGEM: Record<Abordagem, Angle[]> = {
  viral: [
    (c) => ({
      title: "Os 3 erros",
      desc: "Gancho de erro — o formato que mais salva",
      briefing: `3 erros que ${c.publico} comete sem perceber, e o que fazer no lugar de cada um.`,
    }),
    (c) => ({
      title: "Verdade impopular",
      desc: "Opinião forte, com argumento que sustenta",
      briefing: `Uma verdade impopular sobre ${c.foco} que ${c.publico} precisa ouvir — com o argumento que sustenta a afirmação.`,
    }),
    (c) => ({
      title: "Antes e depois",
      desc: "Contraste que prende até o último slide",
      briefing: `O antes e depois de ${c.publico} que parou de improvisar e passou a seguir um método. O que muda na prática, ponto a ponto.`,
    }),
    (c) => ({
      title: "Faça hoje",
      desc: "Lista rápida de aplicação imediata",
      briefing: `5 coisas que ${c.publico} consegue aplicar hoje mesmo e já ver diferença nesta semana.`,
    }),
  ],
  educativo: [
    (c) => ({
      title: "Passo a passo",
      desc: "Do zero ao resultado, em etapas numeradas",
      briefing: `Passo a passo completo de como ${c.publico} chega no resultado do zero, em etapas numeradas e sem pular nada.`,
    }),
    (c) => ({
      title: "Guia do iniciante",
      desc: "O básico que ninguém explica direito",
      briefing: `Guia do iniciante: o que ${c.publico} precisa entender sobre ${c.foco} antes de tomar qualquer decisão.`,
    }),
    (c) => ({
      title: "Mitos x fatos",
      desc: "Desfaz crença errada e ensina o certo",
      briefing: `Mitos e fatos sobre ${c.foco}: o que ${c.publico} acredita que é verdade, o que realmente é, e por quê.`,
    }),
    (c) => ({
      title: "Checklist",
      desc: "Lista de conferência pra salvar",
      briefing: `Checklist que ${c.publico} deveria conferir antes de começar. Item por item, com o motivo de cada um.`,
    }),
  ],
  comunidade: [
    (c) => ({
      title: "Pergunta aberta",
      desc: "Puxa comentário de quem lê",
      briefing: `Pergunta pra ${c.publico}: qual o maior desafio de vocês hoje? Apresente 3 desafios comuns e convide a contar o seu nos comentários.`,
    }),
    (c) => ({
      title: "Isso é você?",
      desc: "Identificação — o público se reconhece",
      briefing: `Situações que só quem é ${c.publico} entende. Lista de identificação com um convite pra marcar alguém que se encaixa.`,
    }),
    (c) => ({
      title: "Bastidores",
      desc: "Aproxima mostrando o processo real",
      briefing: `Os bastidores da ${c.nome} que ${c.publico} nunca viu: como as coisas funcionam por dentro, sem filtro.`,
    }),
    (c) => ({
      title: "Enquete",
      desc: "Duas visões, o público escolhe lado",
      briefing: `Dois jeitos opostos de encarar ${c.foco}. Apresente os dois lados de forma justa e pergunte com qual ${c.publico} se identifica.`,
    }),
  ],
  storytelling: [
    (c) => ({
      title: "A virada",
      desc: "Narrativa com começo, conflito e fim",
      briefing: `A história de uma virada: onde ${c.publico} estava, o que travava, o que mudou e onde chegou. Com começo, conflito e desfecho.`,
    }),
    (c) => ({
      title: "O erro que ensinou",
      desc: "Vulnerabilidade que gera confiança",
      briefing: `Um erro que custou caro e o que ele ensinou. Conte o episódio, o prejuízo e a lição que ${c.publico} pode aproveitar.`,
    }),
    (c) => ({
      title: "Como começou",
      desc: "Origem da marca em narrativa",
      briefing: `Como a ${c.nome} começou: o incômodo que deu origem, a primeira tentativa e o que só ficou claro depois.`,
    }),
    (c) => ({
      title: "Um dia na vida",
      desc: "Rotina que mostra o método sem vender",
      briefing: `Um dia na rotina de quem trabalha com ${c.foco}. Mostre o processo real, hora a hora, e o que isso entrega pra ${c.publico}.`,
    }),
  ],
  dados: [
    (c) => ({
      title: "O número que choca",
      desc: "Abre com estatística e sustenta",
      briefing: `Um número que ${c.publico} não espera sobre ${c.foco}. Abra com o dado, explique de onde vem e o que fazer com essa informação.`,
    }),
    (c) => ({
      title: "Comparativo",
      desc: "Lado a lado com números",
      briefing: `Comparativo lado a lado: fazer do jeito comum x fazer do jeito certo. Com números que mostram a diferença.`,
    }),
    (c) => ({
      title: "Resultado real",
      desc: "Prova concreta, sem promessa vaga",
      briefing: `Um resultado real e mensurável que ${c.publico} pode alcançar. Mostre o ponto de partida, o processo e o número final.`,
    }),
    (c) => ({
      title: "Custo de não agir",
      desc: "Quantifica a inércia",
      briefing: `Quanto custa pra ${c.publico} continuar adiando. Quantifique a perda por mês e mostre o ponto em que vira problema grande.`,
    }),
  ],
  oferta: [
    (c) => ({
      title: "Pra quem é",
      desc: "Qualifica e chama pra ação",
      briefing: `Pra quem a ${c.nome} é (e pra quem não é). Deixe claro o encaixe e feche com uma chamada direta.`,
    }),
    (c) => ({
      title: "Objeções",
      desc: "Derruba o que trava a decisão",
      briefing: `As 3 objeções que fazem ${c.publico} hesitar antes de fechar — e a resposta honesta pra cada uma.`,
    }),
    (c) => ({
      title: "O que está incluso",
      desc: "Entrega clara, sem letra miúda",
      briefing: `O que ${c.publico} recebe ao escolher a ${c.nome}: entrega por entrega, sem letra miúda, com a chamada no final.`,
    }),
    (c) => ({
      title: "Por que agora",
      desc: "Urgência com motivo real",
      briefing: `Por que ${c.publico} deveria resolver ${c.foco} agora e não daqui a seis meses. Com o motivo concreto por trás da urgência.`,
    }),
  ],
}

/** Sem abordagem escolhida: cai numa mistura coerente com o objetivo. */
const FALLBACK_BY_OBJETIVO: Record<Objetivo, Abordagem[]> = {
  vender: ["oferta", "dados"],
  engajar: ["viral", "storytelling"],
  informar: ["educativo", "dados"],
  comunidade: ["comunidade", "storytelling"],
}

/**
 * Monta 4 sugestões de ideia pra marca ativa.
 * Determinístico: a mesma marca + mesmas escolhas sempre dá o mesmo conjunto
 * (o usuário não vê os cards "pularem" ao voltar um passo).
 */
export function buildIdeaSuggestions(
  brand: ActiveBrandLite | null,
  objetivo: Objetivo,
  abordagem: Abordagem | null,
): IdeaSuggestion[] {
  const nome = brand?.name?.trim() || "sua marca"
  const publico = brand?.target_audience?.trim() || "seu público"
  const ctx: Ctx = { nome, publico, foco: focoFromBrand(brand, nome) }

  const angles = abordagem
    ? BY_ABORDAGEM[abordagem]
    : FALLBACK_BY_OBJETIVO[objetivo].flatMap((a) => BY_ABORDAGEM[a].slice(0, 2))

  return angles.slice(0, 4).map((fn) => fn(ctx))
}
