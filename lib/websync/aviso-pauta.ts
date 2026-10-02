import { temCopyPronta } from "@/lib/websync/copy-crm"

// =====================================================================
// O que o botão "Gerar post" do Pipeline faz com uma pauta, e o que diz
// ao dono. Puro, para os dois serem testáveis.
//
// REGRA DE OURO: o que o dono escreveu é respeitado ao pé da letra; a IA só
// gera o que estiver vazio. O critério é o CONTEÚDO, não o formato.
// =====================================================================

/** Que copy do dono a pauta traz: slides prontos, texto de imagem única, ou nenhuma. */
export function copiaDoDono(
  descricao: string | null | undefined,
): "slides" | "imagem_unica" | null {
  if (!descricao) return null
  if (temCopyPronta(descricao)) return "slides"
  if (/^Imagem unica:/im.test(descricao) && /^Legenda:/m.test(descricao)) return "imagem_unica"
  return null
}

export interface AvisoDaGeracao {
  /** "ok" = deu certo, "atencao" = nada foi feito e o dono precisa agir. */
  tom: "ok" | "atencao"
  texto: string
}

/** Resposta da rota /api/calendario/pauta-pronta, em português de dono de empresa. */
export function avisoDaGeracao(
  httpOk: boolean,
  arte: string | undefined,
): AvisoDaGeracao {
  if (!httpOk) {
    return {
      tom: "atencao",
      texto:
        "Não consegui criar a arte desta pauta agora, e nada foi alterado. Tente de novo em instantes. Se repetir, abra a pauta e confira se o texto está completo.",
    }
  }
  switch (arte) {
    case "iniciado":
      return { tom: "ok", texto: "A arte começou a ser criada com o texto exatamente como você escreveu. Ela aparece em Prontos em alguns minutos." }
    case "em_andamento":
      return { tom: "ok", texto: "Esta arte já está sendo criada. É só aguardar." }
    case "ja_tem_arte":
      return { tom: "ok", texto: "Esta pauta já tem arte. Ela foi movida para Prontos." }
    case "sem_copy":
      return { tom: "atencao", texto: "O texto desta pauta está incompleto (faltam os slides ou a legenda), então não criei a arte. Complete o texto no CRM e envie de novo." }
    case "formato_nao_suportado":
      return { tom: "atencao", texto: "Esta pauta já veio com o texto pronto. Para não mudar o que você escreveu, a IA não gera de novo: copie a legenda do CRM e use na arte." }
    default:
      return { tom: "atencao", texto: "Não encontrei esta pauta na sua conta, então nada foi criado. Atualize a página e tente de novo." }
  }
}
