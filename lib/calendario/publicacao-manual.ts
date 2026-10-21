import type { SupabaseClient } from "@supabase/supabase-js"

// =====================================================================
// lib/calendario/publicacao-manual.ts
// O "Publicar agora" avisando o calendário.
//
// Antes, publicar na mão não mexia na pauta: ela continuava 'agendado' e o
// worker (/api/cron/publicar) publicava DE NOVO na hora marcada. Post
// duplicado no perfil do cliente, que é o desfecho que o worker inteiro foi
// desenhado pra evitar. O contrário também valia: o worker publicava e o
// botão deixava publicar outra vez sem dizer nada.
//
// Agora: antes de publicar, o botão pergunta se a pauta já saiu (ou se o
// worker está no meio dela) e pede confirmação. Depois de publicar, carimba
// 'publicado' e deixa o rastro em publish_attempts, igual ao worker.
// =====================================================================

export type TipoPeca = "carousel" | "single_post"

const TABELA: Record<TipoPeca, string> = {
  carousel: "editorial_carousels",
  single_post: "single_posts",
}

/** O mesmo marcador que o worker grava antes de mandar pra Meta. */
const EM_ANDAMENTO = "em andamento"

/**
 * A pauta ligada à peça. Usa o cliente do USUÁRIO de propósito: o RLS
 * garante que a peça é dele, e só então as escritas vão pelo admin.
 * Peça feita direto no editor, sem pauta, devolve null.
 */
export async function pautaDaPeca(
  supabase: SupabaseClient,
  tipo: unknown,
  pecaId: unknown,
): Promise<string | null> {
  if ((tipo !== "carousel" && tipo !== "single_post") || typeof pecaId !== "string" || !pecaId) {
    return null
  }
  const { data } = await supabase
    .from(TABELA[tipo])
    .select("scheduled_post_id")
    .eq("id", pecaId)
    .maybeSingle()
  const pautaId = (data as { scheduled_post_id?: string | null } | null)?.scheduled_post_id
  if (!pautaId) return null
  const { data: pauta } = await supabase
    .from("scheduled_posts")
    .select("id")
    .eq("id", pautaId)
    .maybeSingle()
  return pauta ? pautaId : null
}

function quando(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d)
  const p = (t: string) => fmt.find((x) => x.type === t)?.value ?? ""
  return ` em ${p("day")}/${p("month")} às ${p("hour")}:${p("minute")}`
}

/**
 * Se publicar agora repetiria o post, devolve o recado pra tela. Null quando
 * pode publicar sem perguntar.
 */
export async function avisoDeRepeticao(
  admin: SupabaseClient,
  pautaId: string,
): Promise<string | null> {
  const [{ data: pauta }, { data: tentativas }] = await Promise.all([
    admin.from("scheduled_posts").select("status").eq("id", pautaId).maybeSingle(),
    admin
      .from("publish_attempts")
      .select("ok, error, attempted_at")
      .eq("scheduled_post_id", pautaId)
      .order("attempted_at", { ascending: false })
      .limit(5),
  ])
  const lista = (tentativas ?? []) as Array<{
    ok: boolean
    error: string | null
    attempted_at: string
  }>

  if (lista.some((t) => !t.ok && t.error === EM_ANDAMENTO)) {
    return (
      "O agendamento começou a publicar este post e não confirmou se terminou. " +
      "Confira no Instagram se ele já saiu antes de publicar de novo."
    )
  }
  if ((pauta as { status?: string } | null)?.status === "publicado") {
    const ultima = lista.find((t) => t.ok)
    return (
      `Este post já foi publicado no Instagram${quando(ultima?.attempted_at)}. ` +
      "Publicar de novo repete o post no perfil."
    )
  }
  return null
}

/**
 * Carimba a pauta como publicada e deixa o rastro. Best-effort: o post já
 * saiu, falhar aqui não pode virar erro na tela.
 */
export async function registrarPublicacaoManual(
  admin: SupabaseClient,
  pautaId: string,
  igMediaId: string,
  imagens: number,
): Promise<void> {
  const [tentativa, carimbo] = await Promise.all([
    admin.from("publish_attempts").insert({
      scheduled_post_id: pautaId,
      ok: true,
      ig_media_id: igMediaId,
      image_count: imagens,
    }),
    admin.from("scheduled_posts").update({ status: "publicado" }).eq("id", pautaId),
  ])
  if (tentativa.error) console.warn("[instagram/publish] rastro falhou", tentativa.error.message)
  if (carimbo.error) console.error("[instagram/publish] carimbo falhou", pautaId, carimbo.error.message)
}
