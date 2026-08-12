import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolverDono } from "@/lib/websync/dono"

export const runtime = "nodejs"

// =====================================================================
// Webhook WebSync-OS → SyncPost  (a Ponte, 11/08/2026)
//
// Recebe as pautas que os agentes do WebSync-OS escreveram no espelho
// (conteudo_posts) e cria cada uma como ideia no planejador daqui
// (scheduled_posts). É a conexão CRM → SyncPost que faltava pros posts
// saírem de forma automática: a pauta chega pronta no calendário e o
// dono só gera a arte.
//
// Vive em /api/webhooks/* de propósito: é a allowlist do middleware
// (máquina chamando máquina, sem cookie de sessão). A autenticação é o
// segredo próprio no header, mesmo padrão do webhook da Cakto.
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
// =====================================================================

const SECRET_HEADER = "x-websync-secret"
const MAX_POSTS = 20

const FORMATOS = new Set(["post", "carrossel", "stories", "reels"])
const OBJETIVOS = new Set(["sell", "inform", "engage", "community"])

interface PostRecebido {
  ref?: string
  brand_id?: string
  marca?: string
  titulo?: string
  descricao?: string | null
  formato?: string
  objetivo?: string
  data_sugerida?: string
}

interface ResultadoItem {
  ref: string
  resultado: "criado" | "ja_existia" | "brand_nao_encontrada" | "invalido"
  id?: string
  motivo?: string
}

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
  let corpo: { posts?: PostRecebido[] }
  try {
    corpo = (await req.json()) as { posts?: PostRecebido[] }
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }
  const posts = Array.isArray(corpo.posts) ? corpo.posts.slice(0, MAX_POSTS) : []
  if (posts.length === 0) {
    return NextResponse.json({ ok: true, resultados: [] })
  }

  // 3) Os ids de brand DO DONO, uma consulta só ---------------------------
  // Filtrado por dono, e não é paranoia: este projeto tem brands de clientes.
  // Um brand_id errado (vínculo velho, id digitado à mão) sem este filtro
  // publicaria a pauta do Marcos no calendário editorial de outra empresa,
  // sem erro nenhum na hora.
  const admin = createAdminClient()
  const dono = await resolverDono(admin)
  if (!dono.ok) {
    return NextResponse.json({ error: dono.motivo }, { status: 409 })
  }
  const { data: brands, error: brandsError } = await admin
    .from("brands")
    .select("id")
    .eq("user_id", dono.ownerId)
  if (brandsError) {
    console.error("[websync-os] falha ao ler brands:", brandsError.message)
    return NextResponse.json({ error: "falha ao ler brands" }, { status: 500 })
  }
  const existem = new Set((brands ?? []).map((b) => b.id))

  // 4) Um resultado por item; item ruim não derruba o lote ----------------
  const resultados: ResultadoItem[] = []
  for (const p of posts) {
    const ref = typeof p.ref === "string" ? p.ref : ""
    if (!ref || !p.titulo || !p.brand_id) {
      resultados.push({
        ref: ref || "sem_ref",
        resultado: "invalido",
        motivo: "ref, titulo e brand_id são obrigatórios",
      })
      continue
    }

    const brandId = p.brand_id
    if (!existem.has(brandId)) {
      resultados.push({
        ref,
        resultado: "brand_nao_encontrada",
        motivo: `a brand ${brandId}${p.marca ? ` (marca ${p.marca})` : ""} não existe aqui, ou não é sua. Revincule na tela de Marcas do CRM.`,
      })
      continue
    }

    // Idempotência: mesmo título na mesma brand devolve o existente.
    const { data: existente } = await admin
      .from("scheduled_posts")
      .select("id")
      .eq("brand_id", brandId)
      .eq("title", p.titulo.slice(0, 200))
      .limit(1)
      .maybeSingle()
    if (existente) {
      resultados.push({ ref, resultado: "ja_existia", id: existente.id })
      continue
    }

    const dataSugerida = /^\d{4}-\d{2}-\d{2}$/.test(p.data_sugerida ?? "")
      ? (p.data_sugerida as string)
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const { data: criado, error: insertError } = await admin
      .from("scheduled_posts")
      .insert({
        brand_id: brandId,
        title: p.titulo.slice(0, 200),
        description: p.descricao ? String(p.descricao).slice(0, 2000) : null,
        format: FORMATOS.has(p.formato ?? "") ? p.formato : "post",
        objective: OBJETIVOS.has(p.objetivo ?? "") ? p.objetivo : "inform",
        scheduled_date: dataSugerida,
        status: "ideia",
        source: "ia",
      })
      .select("id")
      .single()

    if (insertError || !criado) {
      console.error("[websync-os] insert falhou:", insertError?.message)
      resultados.push({
        ref,
        resultado: "invalido",
        motivo: insertError?.message?.slice(0, 200) ?? "insert falhou",
      })
      continue
    }
    resultados.push({ ref, resultado: "criado", id: criado.id })
  }

  const criados = resultados.filter((r) => r.resultado === "criado").length
  console.log(
    `[websync-os] lote de ${posts.length}: ${criados} criado(s), ` +
      `${resultados.length - criados} outro(s) desfecho(s)`,
  )
  return NextResponse.json({ ok: true, resultados })
}
