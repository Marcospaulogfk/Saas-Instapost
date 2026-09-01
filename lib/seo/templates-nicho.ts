// Catálogo de templates por nicho pra galeria pública de SEO programático
// (/modelos/carrossel e /modelos/carrossel/[nicho]). Diferente de
// lib/seo/nichos.ts (que tem 1 demoSlides genérico por nicho), aqui cada
// nicho ganha 2 templates com tema e estilo visual próprios, curados a mão
// (decisão do revisor, 01/09/2026) a partir das fichas de
// SEO-PROGRAMATICO-NICHOS.md. Arquivo server-safe (sem "use client"): a
// galeria client e as páginas server importam o mesmo array.

import type { EditorialStyle, PreviewSlide } from "@/components/carousel/slide-preview"
import { slides } from "./nichos"

export interface TemplateNicho {
  /** Kebab-case, ex. "nutricionista-mitos-dieta". Estável: vira id no CRM. */
  id: string
  nichoSlug: string
  /** Nome curto do template, ex. "Mitos da Dieta". */
  nome: string
  estilo: EditorialStyle
  /** Capa + 1 slide de conteúdo + CTA, no shape que o SlidePreview consome. */
  demoSlides: PreviewSlide[]
  /** Briefing de 1-2 frases usado pra pré-preencher o wizard no CTA. */
  brief: string
}

// Curadoria fixa: 2 templates por nicho ativo, estilo escolhido pelo revisor
// pra combinar com o tom de cada tema (sério/sóbrio pro jurídico, acolhedor
// pro emocional, alto impacto pro treino).
export const TEMPLATES_NICHO: TemplateNicho[] = [
  // ── Nutricionista ────────────────────────────────────────────────
  {
    id: "nutricionista-mitos-dieta",
    nichoSlug: "nutricionista",
    nome: "Mitos da Dieta",
    estilo: "minimal",
    demoSlides: slides(
      {
        title: "7 mitos da dieta que ainda enganam seus pacientes",
        highlight: ["7 mitos"],
        subtitle: "Separe o que é ciência do que é só repetição nas redes.",
        badge: "Nutrição",
      },
      {
        title: "Mito: suco detox limpa o fígado",
        highlight: ["Mito"],
        subtitle: "O órgão já faz esse trabalho sozinho, todos os dias.",
        body: "Fígado e rim já filtram o corpo sem ajuda de suco especial. O que existe é uma refeição mais leve depois de um período de excesso, não uma limpeza mágica em 24 horas. Explique isso e o paciente para de gastar dinheiro à toa.",
        badge: "Mito 02",
      },
      {
        title: "Salve este post e leve pro seu próximo paciente",
        highlight: ["Salve"],
        subtitle: "Toque em salvar e use na próxima consulta.",
        badge: "Siga @suaclinica",
      },
    ),
    brief:
      "Carrossel para nutricionista sobre mitos da dieta que os pacientes ainda acreditam, com linguagem acolhedora e visual clean de clínica de nutrição.",
  },
  {
    id: "nutricionista-cafe-da-manha",
    nichoSlug: "nutricionista",
    nome: "Café da Manhã Saudável",
    estilo: "bolo",
    demoSlides: slides(
      {
        title: "O café da manhã que sustenta o seu dia até o almoço",
        highlight: ["café da manhã"],
        subtitle: "3 trocas simples pra parar de sentir fome às 10h.",
        badge: "Nutrição",
      },
      {
        title: "Troca 1: pão branco por ovo com fruta",
        highlight: ["Troca 1"],
        subtitle: "Proteína logo na primeira refeição segura a fome por mais tempo.",
        body: "Um café da manhã só de carboidrato refinado passa rápido e deixa a fome voltar antes do meio-dia. Combine uma fonte de proteína com uma fruta e a saciedade dura o dobro, sem precisar de mais quantidade.",
        badge: "Dica 01",
      },
      {
        title: "Salve este post e comece amanhã de manhã",
        highlight: ["comece"],
        subtitle: "Toque em salvar e leve pra rotina do seu paciente.",
        badge: "Siga @suaclinica",
      },
    ),
    brief:
      "Carrossel para nutricionista sobre trocas simples no café da manhã pra sustentar a fome até o almoço, tom prático e visual leve.",
  },

  // ── Advogado ─────────────────────────────────────────────────────
  {
    id: "advogado-voce-tem-direito",
    nichoSlug: "advogado",
    nome: "Você Tem Direito",
    estilo: "wesley",
    demoSlides: slides(
      {
        title: "Você sabia que tem direito a indenização por voo atrasado?",
        highlight: ["direito"],
        subtitle: "Um caso comum que a maioria das pessoas nunca reclama.",
        badge: "Direito do Consumidor",
      },
      {
        title: "A partir de 4 horas de atraso, o direito já existe",
        highlight: ["4 horas"],
        subtitle: "A companhia aérea deve assistência e pode dever indenização.",
        body: "Comida, hospedagem e reacomodação são obrigação da companhia a partir de certo tempo de atraso. Se o transtorno passou disso, guarde o cartão de embarque e a prova do horário: isso sustenta o pedido de indenização.",
        badge: "Passo a passo",
      },
      {
        title: "Salve este post pra consultar quando precisar",
        highlight: ["Salve"],
        subtitle: "Toque em salvar e volte quando for útil.",
        badge: "Siga @seuescritorio",
      },
    ),
    brief:
      "Carrossel para advogado explicando um direito do consumidor pouco conhecido, como indenização por atraso de voo, em tom sério e educativo.",
  },
  {
    id: "advogado-erros-custam-causa",
    nichoSlug: "advogado",
    nome: "Erros que Custam a Causa",
    estilo: "brandsdecoded",
    demoSlides: slides(
      {
        title: "5 erros que fazem você perder uma causa simples",
        highlight: ["5 erros"],
        subtitle: "Descuidos antes mesmo de procurar um advogado.",
        badge: "Direito Trabalhista",
      },
      {
        title: "Erro 1: guardar print de conversa sem a data visível",
        highlight: ["Erro 1"],
        subtitle: "Uma prova sem data conta muito menos no processo.",
        body: "Print de mensagem sem hora e data completas perde força como prova. Sempre capture a tela mostrando o cabeçalho da conversa inteiro, e guarde o arquivo original, não só o print recortado.",
        badge: "Erro comum",
      },
      {
        title: "Salve este post pra consultar quando precisar",
        highlight: ["Salve"],
        subtitle: "Toque em salvar e volte quando fizer sentido.",
        badge: "Siga @seuescritorio",
      },
    ),
    brief:
      "Carrossel para advogado sobre erros comuns que fazem uma pessoa perder uma causa simples, tom sério e visual editorial sóbrio.",
  },

  // ── Dentista ─────────────────────────────────────────────────────
  {
    id: "dentista-mitos-clareamento",
    nichoSlug: "dentista",
    nome: "Mitos do Clareamento",
    estilo: "cards",
    demoSlides: slides(
      {
        title: "4 mitos sobre clareamento dental que atrasam seu sorriso",
        highlight: ["4 mitos"],
        subtitle: "O que é medo infundado e o que é cuidado de verdade.",
        badge: "Odontologia",
      },
      {
        title: "Mito: clareamento estraga o esmalte do dente",
        highlight: ["Mito"],
        subtitle: "Feito com acompanhamento, o procedimento é seguro.",
        body: "O clareamento supervisionado por dentista usa concentração e tempo controlados, o que preserva o esmalte. O risco existe mesmo é no clareamento caseiro sem orientação, feito por conta própria e sem dosagem correta.",
        badge: "Mito 01",
      },
      {
        title: "Salve este post e agende sua avaliação",
        highlight: ["agende"],
        subtitle: "Toque em salvar e marque sua consulta.",
        badge: "Siga @suaclinica",
      },
    ),
    brief:
      "Carrossel para dentista desmentindo mitos comuns sobre clareamento dental, tom acolhedor e visual clínico e confiável.",
  },
  {
    id: "dentista-sinais-de-alerta",
    nichoSlug: "dentista",
    nome: "Sinais de Alerta",
    estilo: "minimal",
    demoSlides: slides(
      {
        title: "5 sinais que seu corpo dá antes de um problema no dente",
        highlight: ["5 sinais"],
        subtitle: "Nem toda dor de dente espera a consulta de rotina.",
        badge: "Odontologia",
      },
      {
        title: "Sinal 1: gengiva sangrando toda vez que escova",
        highlight: ["Sinal 1"],
        subtitle: "Sangramento constante não é normal, mesmo que não doa.",
        body: "Gengiva saudável não sangra na escovação. Se isso acontece toda vez, pode ser sinal de inflamação inicial, que é simples de tratar agora e complicado se ignorado por meses.",
        badge: "Alerta 01",
      },
      {
        title: "Salve este post e agende sua avaliação",
        highlight: ["agende"],
        subtitle: "Toque em salvar e marque sua consulta.",
        badge: "Siga @suaclinica",
      },
    ),
    brief:
      "Carrossel para dentista sobre sinais de alerta que indicam que o paciente precisa marcar uma consulta, tom direto e visual clínico.",
  },

  // ── Psicólogo ────────────────────────────────────────────────────
  {
    id: "psicologo-sinais-ansiedade",
    nichoSlug: "psicologo",
    nome: "Sinais de Ansiedade",
    estilo: "bolo",
    demoSlides: slides(
      {
        title: "6 sinais de ansiedade que passam por estresse do dia a dia",
        highlight: ["6 sinais"],
        subtitle: "O corpo costuma avisar antes da mente admitir.",
        badge: "Saúde mental",
      },
      {
        title: "Sinal 1: dificuldade de dormir mesmo cansado",
        highlight: ["Sinal 1"],
        subtitle: "A mente segue ligada mesmo com o corpo pedindo descanso.",
        body: "Cansaço físico não garante sono tranquilo quando a cabeça continua repassando o dia. Se isso se repete há semanas, vale conversar sobre o que está sustentando esse estado de alerta constante.",
        badge: "Sinal 01",
      },
      {
        title: "Salve este post pra quando precisar lembrar",
        highlight: ["Salve"],
        subtitle: "Toque em salvar e volte quando fizer sentido.",
        badge: "Siga @seuconsultorio",
      },
    ),
    brief:
      "Carrossel para psicólogo sobre sinais de ansiedade que costumam passar despercebidos, tom acolhedor e visual leve.",
  },
  {
    id: "psicologo-terapia-sem-tabu",
    nichoSlug: "psicologo",
    nome: "Terapia Sem Tabu",
    estilo: "perfil",
    demoSlides: slides(
      {
        title: "Terapia não é só pra quem está em crise",
        highlight: ["não é só"],
        subtitle: "O acompanhamento preventivo também vale muito.",
        badge: "Saúde mental",
      },
      {
        title: "Ideia central: cuidar antes de precisar apagar incêndio",
        highlight: ["antes"],
        subtitle: "Quem chega sem crise trabalha padrões, não só sintomas.",
        body: "Buscar terapia como manutenção é como fazer check up antes de adoecer. Dá mais espaço pra entender padrões de comportamento, e não só reagir quando algo já dói.",
        badge: "Sem tabu",
      },
      {
        title: "Salve este post pra quando precisar lembrar",
        highlight: ["Salve"],
        subtitle: "Toque em salvar e volte quando fizer sentido.",
        badge: "Siga @seuconsultorio",
      },
    ),
    brief:
      "Carrossel para psicólogo explicando que terapia não é só pra momento de crise, tom acolhedor e sem apelo clínico.",
  },

  // ── Personal trainer ─────────────────────────────────────────────
  {
    id: "personal-trainer-treino-do-dia",
    nichoSlug: "personal-trainer",
    nome: "Treino do Dia",
    estilo: "wesley",
    demoSlides: slides(
      {
        title: "O treino de hoje: pernas completo em 25 minutos",
        highlight: ["25 minutos"],
        subtitle: "Sem precisar de academia lotada nem equipamento raro.",
        badge: "Treino",
      },
      {
        title: "Sequência: agachamento, afundo e panturrilha",
        highlight: ["Sequência"],
        subtitle: "3 séries de cada exercício, descanso curto entre elas.",
        body: "Faça 3 séries de 12 repetições em cada exercício, com 40 segundos de descanso. O volume curto funciona porque a intensidade é alta: sinta o músculo trabalhando antes de aumentar carga.",
        badge: "Treino do dia",
      },
      {
        title: "Salve este post e comece hoje mesmo",
        highlight: ["hoje"],
        subtitle: "Toque em salvar e leve pro seu próximo treino.",
        badge: "Siga @seutreino",
      },
    ),
    brief:
      "Carrossel para personal trainer com o treino de pernas do dia, linguagem direta e motivadora, visual de academia moderna.",
  },
  {
    id: "personal-trainer-erros-execucao",
    nichoSlug: "personal-trainer",
    nome: "Erros na Execução",
    estilo: "seamless",
    demoSlides: slides(
      {
        title: "3 erros de execução que travam seu resultado no treino",
        highlight: ["3 erros"],
        subtitle: "Não é falta de esforço, é ajuste de técnica.",
        badge: "Treino",
      },
      {
        title: "Erro 1: soltar o peso na descida do exercício",
        highlight: ["Erro 1"],
        subtitle: "A pressa na descida tira o trabalho do músculo certo.",
        body: "Controlar os 3 segundos de descida mantém a tensão no músculo o tempo todo. Quando o peso cai livre, quem trabalha é a articulação, não o músculo que devia crescer.",
        badge: "Erro comum",
      },
      {
        title: "Salve este post e ajuste no seu próximo treino",
        highlight: ["ajuste"],
        subtitle: "Toque em salvar e leve pra academia.",
        badge: "Siga @seutreino",
      },
    ),
    brief:
      "Carrossel para personal trainer sobre erros comuns de execução que travam o resultado do treino, tom direto e visual de alto impacto.",
  },
]

/** Templates de um nicho específico, na ordem em que aparecem no catálogo. */
export function templatesDoNicho(slug: string): TemplateNicho[] {
  return TEMPLATES_NICHO.filter((t) => t.nichoSlug === slug)
}

/** Slugs únicos presentes no catálogo, na ordem de primeira aparição. */
export const NICHOS_COM_TEMPLATE: string[] = Array.from(
  new Set(TEMPLATES_NICHO.map((t) => t.nichoSlug)),
)
