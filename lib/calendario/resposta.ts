import { NextResponse } from "next/server"

// =====================================================================
// lib/calendario/resposta.ts
// UMA forma de dizer "não" no calendário.
//
// Existe por um bug de contrato encontrado pela sessão do CRM exercitando as
// rotas (26/08/2026): as recusas de REGRA saíam em `{ok:false, erro, motivo}`
// e as validações de FORMATO saíam em `{error}` — o estilo mais antigo, herdado
// do POST do webhook. Duas chaves pra mesma coisa.
//
// Não travava ninguém (o CRM passou a ler as duas), e é justamente por isso
// que valia arrumar: quem escrever o próximo consumidor vai ler o contrato,
// ver só `erro`, e descartar em silêncio as mensagens mais úteis que a gente
// tem — "hora inválida (use HH:MM)" diz exatamente o que fazer. Erro que o
// cliente não consegue ler é erro que vira "não funcionou".
//
// Toda recusa daqui pra frente tem CÓDIGO (pra máquina decidir) e MOTIVO (pra
// gente ler). As duas coisas, sempre, no mesmo formato.
// =====================================================================

export type CodigoErro =
  // configuração e acesso
  | "nao_configurado"
  | "nao_autorizado"
  | "dono_indefinido"
  // formato do pedido
  | "json_invalido"
  | "periodo_invalido"
  | "periodo_longo"
  | "data_invalida"
  | "hora_invalida"
  | "status_desconhecido"
  | "nada_pra_mudar"
  // estado
  | "nao_encontrado"
  | "campo_nao_seu"
  | "ja_publicado"
  | "sem_hora"
  | "sem_arte_publicavel"
  | "data_no_passado"
  | "desatualizado"
  // nossa culpa
  | "falha_interna"

export function erroJson(
  status: number,
  erro: CodigoErro,
  motivo: string,
  extra: Record<string, unknown> = {},
) {
  return NextResponse.json({ ok: false, erro, motivo, ...extra }, { status })
}

/** Recusa de regra: o pedido é válido, o estado é que não permite. */
export function recusa(
  erro: CodigoErro,
  motivo: string,
  extra: Record<string, unknown> = {},
) {
  return erroJson(409, erro, motivo, extra)
}

/** Pedido malformado: falta parâmetro, formato errado, valor fora do domínio. */
export function pedidoRuim(
  erro: CodigoErro,
  motivo: string,
  extra: Record<string, unknown> = {},
) {
  return erroJson(400, erro, motivo, extra)
}
