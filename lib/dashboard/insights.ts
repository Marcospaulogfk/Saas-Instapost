import type { NovaInsight } from "@/components/dashboard/nova/nova-insights"

/**
 * Monta os insights do dashboard a partir do estado real da conta.
 *
 * A ordem importa: o que exige ação vem primeiro (agenda vazia, saldo baixo,
 * marca parada), depois oportunidade de calendário, e as dicas de ofício
 * fecham a lista só pra ela nunca ficar curta demais pra virar carrossel.
 *
 * Cada regra é uma frase que só aparece quando é VERDADE pra aquela conta —
 * é isso que separa insight de recheio.
 */

export interface DadosInsights {
  /** Tudo que a conta já produziu (carrosséis + posts + projetos). */
  totalConteudo: number
  /** Peças criadas nos últimos 7 dias. */
  criadosUltimos7: number
  /** Pautas ativas no calendário. */
  agendadosTotal: number
  /** Pautas com data dentro dos próximos 7 dias. */
  agendadosProximaSemana: number
  /** Nome de uma marca cadastrada que ainda não tem conteúdo. */
  marcaSemConteudo: string | null
  /** Saldo de tokens. */
  creditos: number
  /** Data comemorativa mais próxima (só se estiver perto). */
  proximaData: { nome: string; emDias: number } | null
}

/** Abaixo disso não dá pra fechar nem um carrossel completo (41 tokens). */
const SALDO_BAIXO = 45

const DICAS_DE_OFICIO: NovaInsight[] = [
  {
    id: "dica-gancho",
    kicker: "Dica",
    texto:
      "Abra a legenda com um gancho. Pergunta provocativa retém mais que afirmação — o primeiro segundo decide o resto.",
  },
  {
    id: "dica-formatos",
    kicker: "Dica",
    texto:
      "Varie os formatos na semana: carrossel para ensinar, post único para posicionar. Repetir o mesmo formato cansa a audiência.",
  },
  {
    id: "dica-briefing",
    kicker: "Dica",
    texto:
      'Briefing específico gera copy melhor. "Curso de Excel pra contadores" rende mais que "vender curso".',
  },
  {
    id: "dica-comentarios",
    kicker: "Dica",
    texto:
      "Responda os comentários na primeira hora. É o sinal de engajamento que sustenta o alcance do post.",
  },
]

export function montarInsights(d: DadosInsights): NovaInsight[] {
  const acionaveis: NovaInsight[] = []

  if (d.agendadosTotal === 0) {
    acionaveis.push({
      id: "agenda-vazia",
      kicker: "Agenda",
      texto:
        "Você não tem nenhuma pauta no calendário. As Recomendações IA montam a semana inteira de graça — só gera token quando você decide criar o post.",
      href: "/dashboard/calendario",
      cta: "Montar minha semana",
    })
  } else if (d.agendadosProximaSemana === 0) {
    acionaveis.push({
      id: "semana-vazia",
      kicker: "Agenda",
      texto: `Suas ${d.agendadosTotal} pautas estão todas depois desta semana. Os próximos 7 dias estão vazios.`,
      href: "/dashboard/calendario",
      cta: "Abrir calendário",
    })
  }

  if (d.creditos < SALDO_BAIXO) {
    acionaveis.push({
      id: "saldo-baixo",
      kicker: "Saldo",
      texto: `Restam ${d.creditos} tokens — abaixo do que custa um carrossel completo. Vale repor antes de começar a próxima peça.`,
      href: "/pricing",
      cta: "Ver planos",
    })
  }

  if (d.marcaSemConteudo) {
    acionaveis.push({
      id: "marca-parada",
      kicker: "Marca",
      texto: `A marca ${d.marcaSemConteudo} está cadastrada mas ainda não tem nenhum conteúdo.`,
      href: "/dashboard/criar",
      cta: "Criar pra ela",
    })
  }

  if (d.totalConteudo > 0 && d.criadosUltimos7 === 0) {
    acionaveis.push({
      id: "ritmo-parado",
      kicker: "Ritmo",
      texto:
        "Faz uma semana que você não cria nada novo. Constância pesa mais no alcance do que volume concentrado.",
      href: "/dashboard/criar",
      cta: "Criar conteúdo",
    })
  } else if (d.criadosUltimos7 >= 3) {
    acionaveis.push({
      id: "ritmo-bom",
      kicker: "Ritmo",
      texto: `${d.criadosUltimos7} peças nos últimos 7 dias. Esse é exatamente o ritmo que o algoritmo premia — mantenha.`,
    })
  }

  if (d.proximaData) {
    const quando =
      d.proximaData.emDias === 0
        ? "é hoje"
        : d.proximaData.emDias === 1
          ? "é amanhã"
          : `chega em ${d.proximaData.emDias} dias`
    acionaveis.push({
      id: "data-proxima",
      kicker: "Oportunidade",
      texto: `${d.proximaData.nome} ${quando}. Data comemorativa rende quando conversa com o seu nicho — vale uma pauta.`,
      href: "/dashboard/calendario",
      cta: "Agendar pauta",
    })
  }

  // Completa até 4 cartões: um carrossel de um item só não é carrossel.
  const faltam = Math.max(0, 4 - acionaveis.length)
  return [...acionaveis, ...DICAS_DE_OFICIO.slice(0, faltam)]
}
