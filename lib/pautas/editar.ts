/**
 * Regras da EDIÇÃO de uma pauta pelo calendário (status, destino, data e hora).
 *
 * Fica fora da server action pra ser testável e pra a tela usar a mesma regra
 * antes de enviar (o dono vê o recado na hora, sem esperar o servidor).
 *
 * "Publicado" e "falhou" não se escolhem aqui: quem escreve isso é a
 * publicação automática. Agendar pede hora e um horário que ainda não passou,
 * senão a peça nasce vencida e a publicação a marca como falha.
 */
import type { PostStatus } from "@/lib/planejar";
import { instanteAgendado } from "@/lib/calendario/agenda";

/** Status que o dono escolhe na tela. */
export const STATUS_ESCOLHIVEIS: PostStatus[] = [
  "ideia",
  "em_criacao",
  "pronto",
  "agendado",
];

/** Destinos que a pauta aceita (o banco aceita os quatro). */
export const DESTINOS = [
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
] as const;
export type Destino = (typeof DESTINOS)[number];

export const DESTINO_LABEL: Record<Destino, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

export function ehDestino(v: unknown): v is Destino {
  return typeof v === "string" && (DESTINOS as readonly string[]).includes(v);
}

export interface EdicaoPauta {
  statusAtual: PostStatus;
  /** Status escolhido (omitido = não mudou). */
  status?: PostStatus;
  data: string;
  hora: string | null;
  /** Data/hora que a pauta tinha antes (pra saber se mexeu no relógio). */
  dataAntes?: string;
  horaAntes?: string | null;
}

/** Devolve o recado em português quando a edição não pode ser salva; `null` se está tudo certo. */
export function validarEdicaoPauta(
  e: EdicaoPauta,
  agora: Date = new Date(),
): string | null {
  if (e.statusAtual === "publicado") {
    return "Esta peça já foi publicada: a data dela não muda mais.";
  }
  if (e.status && !STATUS_ESCOLHIVEIS.includes(e.status)) {
    return "Esse status é definido pela publicação automática, não dá pra escolher aqui.";
  }
  const statusFinal = e.status ?? e.statusAtual;
  const mudouStatus = !!e.status && e.status !== e.statusAtual;
  const mudouRelogio =
    e.data !== e.dataAntes || (e.hora ?? "") !== (e.horaAntes ?? "");
  if (statusFinal === "agendado" && (mudouStatus || mudouRelogio)) {
    if (!e.hora) {
      return "Pra agendar, escolha a hora da publicação.";
    }
    const quando = instanteAgendado(e.data, e.hora);
    if (!quando)
      return "A data e a hora do agendamento não formam um horário válido.";
    if (quando.getTime() <= agora.getTime()) {
      return "Esse horário já passou. Escolha uma data e hora que ainda vão chegar.";
    }
  }
  return null;
}
