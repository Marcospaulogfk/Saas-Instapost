/**
 * Datas comemorativas brasileiras úteis pra criação de conteúdo.
 * Lista hardcoded — pode virar tabela no banco depois.
 *
 * Cada data tem month/day no calendário comum. Pra Páscoa/Carnaval que mudam,
 * uso uma função `easterDate(year)`.
 */

export interface DataComemorativa {
  id: string
  nome: string
  /** Mês 1-12 */
  mes: number
  /** Dia 1-31 */
  dia: number
  /** Categoria pra filtrar / colorir */
  categoria: "data" | "ecommerce" | "diversidade" | "saude" | "profissional"
  /** Nicho/audiência tipica que se beneficia */
  nichos?: string[]
}

export const DATAS_COMEMORATIVAS: DataComemorativa[] = [
  // JANEIRO
  { id: "ano-novo", nome: "Ano Novo", mes: 1, dia: 1, categoria: "data" },
  { id: "saude-mental-julho-branco", nome: "Janeiro Branco (saúde mental)", mes: 1, dia: 1, categoria: "saude", nichos: ["saúde", "psicologia", "bem-estar"] },
  { id: "dia-povos-indigenas-amer", nome: "Dia dos Povos Indígenas das Américas", mes: 1, dia: 19, categoria: "diversidade" },
  // FEVEREIRO
  { id: "dia-internet-segura", nome: "Dia da Internet Segura", mes: 2, dia: 11, categoria: "profissional", nichos: ["tech", "educação", "segurança"] },
  { id: "valentines-day", nome: "Valentine's Day", mes: 2, dia: 14, categoria: "ecommerce" },
  { id: "carnaval-aprox", nome: "Carnaval (aprox)", mes: 2, dia: 28, categoria: "data" },
  // MARÇO
  { id: "dia-mulher", nome: "Dia Internacional da Mulher", mes: 3, dia: 8, categoria: "diversidade" },
  { id: "dia-consumidor", nome: "Dia do Consumidor", mes: 3, dia: 15, categoria: "ecommerce" },
  { id: "dia-poesia", nome: "Dia Mundial da Poesia", mes: 3, dia: 21, categoria: "data" },
  // ABRIL
  { id: "pascoa-aprox", nome: "Páscoa (aprox)", mes: 4, dia: 5, categoria: "data" },
  { id: "dia-mundial-saude", nome: "Dia Mundial da Saúde", mes: 4, dia: 7, categoria: "saude" },
  { id: "dia-livro", nome: "Dia Mundial do Livro", mes: 4, dia: 23, categoria: "data" },
  // MAIO
  { id: "dia-trabalho", nome: "Dia do Trabalho", mes: 5, dia: 1, categoria: "data" },
  { id: "dia-maes", nome: "Dia das Mães (2º domingo de Maio)", mes: 5, dia: 11, categoria: "ecommerce" },
  { id: "dia-internet", nome: "Dia da Internet", mes: 5, dia: 17, categoria: "profissional", nichos: ["tech", "marketing"] },
  // JUNHO
  { id: "dia-namorados", nome: "Dia dos Namorados", mes: 6, dia: 12, categoria: "ecommerce" },
  { id: "festas-juninas", nome: "Festas Juninas (São João)", mes: 6, dia: 24, categoria: "data" },
  // JULHO
  { id: "ferias-escolares-jul", nome: "Férias Escolares (Julho)", mes: 7, dia: 1, categoria: "data", nichos: ["educação", "viagem", "kids"] },
  { id: "dia-pizza", nome: "Dia Mundial da Pizza", mes: 7, dia: 10, categoria: "ecommerce", nichos: ["food", "delivery"] },
  // AGOSTO
  { id: "dia-pais", nome: "Dia dos Pais (2º domingo de Agosto)", mes: 8, dia: 10, categoria: "ecommerce" },
  { id: "dia-estudante", nome: "Dia do Estudante", mes: 8, dia: 11, categoria: "profissional", nichos: ["educação"] },
  // SETEMBRO
  { id: "independencia", nome: "Independência do Brasil", mes: 9, dia: 7, categoria: "data" },
  { id: "primavera", nome: "Início da Primavera", mes: 9, dia: 22, categoria: "data" },
  // OUTUBRO
  { id: "dia-criancas", nome: "Dia das Crianças", mes: 10, dia: 12, categoria: "ecommerce" },
  { id: "dia-professor", nome: "Dia do Professor", mes: 10, dia: 15, categoria: "profissional", nichos: ["educação"] },
  { id: "outubro-rosa", nome: "Outubro Rosa", mes: 10, dia: 1, categoria: "saude" },
  { id: "halloween", nome: "Halloween", mes: 10, dia: 31, categoria: "ecommerce" },
  // NOVEMBRO
  { id: "consciencia-negra", nome: "Dia da Consciência Negra", mes: 11, dia: 20, categoria: "diversidade" },
  { id: "novembro-azul", nome: "Novembro Azul", mes: 11, dia: 1, categoria: "saude" },
  { id: "black-friday", nome: "Black Friday", mes: 11, dia: 28, categoria: "ecommerce" },
  // DEZEMBRO
  { id: "natal", nome: "Natal", mes: 12, dia: 25, categoria: "ecommerce" },
  { id: "reveillon", nome: "Réveillon", mes: 12, dia: 31, categoria: "ecommerce" },
]

/**
 * Retorna as próximas N datas comemorativas a partir de hoje.
 */
export function getProximasDatas(
  fromDate: Date = new Date(),
  count: number = 5,
): Array<DataComemorativa & { date: Date; daysAway: number }> {
  const today = new Date(fromDate)
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()

  // Cria entradas pra ano atual + próximo (pra não acabar a lista no fim do ano)
  const expanded: Array<DataComemorativa & { date: Date }> = []
  for (const y of [year, year + 1]) {
    for (const d of DATAS_COMEMORATIVAS) {
      const date = new Date(y, d.mes - 1, d.dia)
      date.setHours(0, 0, 0, 0)
      expanded.push({ ...d, date })
    }
  }

  return expanded
    .filter((d) => d.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count)
    .map((d) => ({
      ...d,
      daysAway: Math.round(
        (d.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      ),
    }))
}

export function categoriaColorClass(cat: DataComemorativa["categoria"]): string {
  switch (cat) {
    case "ecommerce":
      return "text-lime"
    case "diversidade":
      return "text-purple-400"
    case "saude":
      return "text-pink-400"
    case "profissional":
      return "text-blue-400"
    default:
      return "text-text-secondary"
  }
}
