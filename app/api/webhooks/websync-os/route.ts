import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolverDono } from "@/lib/websync/dono"
import {
  criarPautas,
  MAX_PAUTAS_POR_LOTE,
  type PautaRecebida,
} from "@/lib/calendario/operacoes"

export const runtime = "nodejs"
// Só importa quando algum item do lote pede `gerar: true` (a geração em si
// roda em after(), depois da resposta) — mesmo raciocínio de .../gerar/route.ts.
export const maxDuration = 300

// =====================================================================
// Webhook WebSync-OS → Nexus Content  (a Ponte, 11/08/2026)
//
// Recebe as pautas que os agentes do WebSync-OS escreveram no espelho
// (conteudo_posts) e cria cada uma como ideia no planejador daqui
// (scheduled_posts). É a conexão CRM → Nexus Content que faltava pros posts
// saírem de forma automática: a pauta chega pronta no calendário e o
// dono só gera a arte.
//
// Vive em /api/webhooks/* de propósito: é a allowlist do middleware
// (máquina chamando máquina, sem cookie de sessão). A autenticação é o
// segredo próprio no header, mesmo padrão dos outros webhooks (Asaas).
//
// Endereçamento por BRAND_ID (12/08/2026). Antes o WebSync-OS mandava o
// handle e esta rota procurava a brand por texto — um @ a mais, um handle
// trocado ou uma chave que nunca foi handle ('perfil-pessoal') derrubavam
// tudo. Agora o vínculo é escolhido na tela de Marcas do CRM e o que
// chega é o id. O campo `marca` ainda vem junto, só pra mensagem de erro
// ter nome de gente. Nunca criamos brand aqui: isso é /brands.
//
// Idempotência: mesmo título na mesma brand não duplica; devolve o id
// existente como 'ja_existia' pro worker poder carimbar o espelho.
//
// Geração automática (01/09/2026): `gerar: true` num item pede pra este
// endpoint TAMBÉM agendar a arte. `imagens`/`buscas` são as fotos e termos
// de busca que o CRM já escolheu por slide. O campo `arte` na resposta é o
// desfecho do agendamento; a geração de fato roda em after(), depois desta
// resposta ir embora.
//
// A criação em si mora em lib/calendario/operacoes.ts, dividida com
// POST /api/v1/calendario (a mesma coisa, autenticada por chave de conta).
// =====================================================================

const SECRET_HEADER = "x-websync-secret"

export async function POST(req: Request) {
  // 1) Validação do secret ------------------------------------------------
  const expected = process.env.WEBSYNC_WEBHOOK_SECRET
  if (!expected) {
    console.error("[websync-os] WEBSYNC_WEBHOOK_SECRET ausente no ambiente")
    return NextResponse.json(
      { error: "webhook não configurado" },
      { status: 503 },
    )
  }
  const provided = req.headers.get(SECRET_HEADER)
  if (!provided || provided !== expected) {
    console.warn("[websync-os] secret inválido no webhook")
    return NextResponse.json({ error: "não autorizado" }, { status: 401 })
  }

  // 2) Parse do payload ---------------------------------------------------
  let corpo: { posts?: PautaRecebida[] }
  try {
    corpo = (await req.json()) as { posts?: PautaRecebida[] }
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }
  const posts = Array.isArray(corpo.posts)
    ? corpo.posts.slice(0, MAX_PAUTAS_POR_LOTE)
    : []
  if (posts.length === 0) {
    return NextResponse.json({ ok: true, resultados: [] })
  }

  // 3) Quem é o dono ------------------------------------------------------
  // Filtrado por dono, e não é paranoia: este projeto tem brands de clientes.
  // Um brand_id errado (vínculo velho, id digitado à mão) sem esse filtro
  // publicaria a pauta do Marcos no calendário editorial de outra empresa,
  // sem erro nenhum na hora.
  const admin = createAdminClient()
  const dono = await resolverDono(admin)
  if (!dono.ok) {
    return NextResponse.json({ error: dono.motivo }, { status: 409 })
  }

  // 4) Um resultado por item; item ruim não derruba o lote ----------------
  const res = await criarPautas(admin, dono.ownerId, posts)
  if (!res.ok) {
    return NextResponse.json({ error: res.falha.motivo }, { status: res.falha.status })
  }
  const resultados = res.valor

  const criados = resultados.filter((r) => r.resultado === "criado").length
  console.log(
    `[websync-os] lote de ${posts.length}: ${criados} criado(s), ` +
      `${resultados.length - criados} outro(s) desfecho(s)`,
  )
  return NextResponse.json({ ok: true, resultados })
}
