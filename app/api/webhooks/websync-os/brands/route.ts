import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolverDono } from "@/lib/websync/dono"

export const runtime = "nodejs"

// =====================================================================
// Brands para a tela de Marcas do WebSync-OS (12/08/2026)
//
// GET  → lista as brands, para o CRM montar o seletor "esta marca daqui
//        entrega em qual brand daqui?"
// POST → cria uma brand, para o CRM poder cadastrar sem o dono ter que
//        vir aqui abrir tela.
//
// Vive embaixo de /api/webhooks/ porque aquele prefixo já é a allowlist
// do middleware (máquina falando com máquina, sem cookie de sessão) e
// porque criar um prefixo novo tornaria público tudo que nascesse nele.
// A autenticação é o mesmo segredo do webhook de pautas.
//
// DONO DA BRAND: ver lib/websync/dono.ts. As duas rotas daqui são
// filtradas por ele, INCLUSIVE a de leitura: este projeto tem brands de
// clientes, e mostrar elas no seletor do CRM deixaria um post do Marcos a
// um clique de cair no calendário de outra empresa.
// =====================================================================

const SECRET_HEADER = "x-websync-secret"

function autorizado(req: Request): { ok: true } | { ok: false; resp: NextResponse } {
  const expected = process.env.WEBSYNC_WEBHOOK_SECRET
  if (!expected) {
    console.error("[websync-os/brands] WEBSYNC_WEBHOOK_SECRET ausente no ambiente")
    return {
      ok: false,
      resp: NextResponse.json({ error: "webhook não configurado" }, { status: 503 }),
    }
  }
  const provided = req.headers.get(SECRET_HEADER)
  if (!provided || provided !== expected) {
    console.warn("[websync-os/brands] secret inválido")
    return { ok: false, resp: NextResponse.json({ error: "não autorizado" }, { status: 401 }) }
  }
  return { ok: true }
}

/** Normaliza handle pra gravar sempre do mesmo jeito: com @, minúsculo. */
function normalizarHandle(valor: string): string | null {
  const limpo = valor.trim().toLowerCase().replace(/^@+/, "")
  return limpo ? `@${limpo}` : null
}

export async function GET(req: Request) {
  const auth = autorizado(req)
  if (!auth.ok) return auth.resp

  const admin = createAdminClient()
  const dono = await resolverDono(admin)
  if (!dono.ok) {
    return NextResponse.json({ error: dono.motivo }, { status: 409 })
  }

  // O filtro por dono é o ponto desta rota, não um detalhe: sem ele o CRM
  // enxergaria a brand de cada cliente que usa o Nexus Content.
  const { data, error } = await admin
    .from("brands")
    .select("id, name, instagram_handle")
    .eq("user_id", dono.ownerId)
    .order("name")

  if (error) {
    console.error("[websync-os/brands] falha ao ler brands:", error.message)
    return NextResponse.json({ error: "falha ao ler brands" }, { status: 500 })
  }

  // Zero brands com a chave anon é o sintoma clássico: o RLS esconde tudo e a
  // resposta fica indistinguível de "não tem nenhuma". Avisa no log do dev.
  if ((data ?? []).length === 0) {
    console.warn(
      "[websync-os/brands] nenhuma brand visível para o dono configurado. Confira " +
        "WEBSYNC_BRAND_OWNER_ID e se SUPABASE_SERVICE_ROLE_KEY é mesmo a service_role.",
    )
  }

  return NextResponse.json({
    brands: (data ?? []).map((b) => ({
      id: b.id,
      nome: b.name,
      instagram_handle: b.instagram_handle ?? null,
    })),
  })
}

export async function POST(req: Request) {
  const auth = autorizado(req)
  if (!auth.ok) return auth.resp

  let corpo: { nome?: string; instagram_handle?: string | null }
  try {
    corpo = (await req.json()) as { nome?: string; instagram_handle?: string | null }
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const nome = typeof corpo.nome === "string" ? corpo.nome.trim() : ""
  if (!nome) {
    return NextResponse.json({ error: "nome é obrigatório" }, { status: 400 })
  }
  const handle =
    typeof corpo.instagram_handle === "string" ? normalizarHandle(corpo.instagram_handle) : null

  const admin = createAdminClient()
  const dono = await resolverDono(admin)
  if (!dono.ok) {
    return NextResponse.json({ error: dono.motivo }, { status: 409 })
  }
  const ownerId = dono.ownerId

  // Mesmo nome do mesmo dono devolve a existente: o CRM pode reenviar sem
  // criar brand duplicada no calendário.
  const { data: existente } = await admin
    .from("brands")
    .select("id, name, instagram_handle")
    .eq("user_id", ownerId)
    .eq("name", nome)
    .limit(1)
    .maybeSingle()
  if (existente) {
    return NextResponse.json({ ok: true, ja_existia: true, brand: {
      id: existente.id, nome: existente.name, instagram_handle: existente.instagram_handle ?? null,
    } })
  }

  const { data: criada, error } = await admin
    .from("brands")
    .insert({ user_id: ownerId, name: nome, instagram_handle: handle })
    .select("id, name, instagram_handle")
    .single()

  if (error || !criada) {
    console.error("[websync-os/brands] insert falhou:", error?.message)
    return NextResponse.json(
      { error: error?.message?.slice(0, 200) ?? "falha ao criar a brand" },
      { status: 500 },
    )
  }

  console.log(`[websync-os/brands] brand criada: ${criada.name}`)
  return NextResponse.json({
    ok: true,
    ja_existia: false,
    brand: { id: criada.id, nome: criada.name, instagram_handle: criada.instagram_handle ?? null },
  })
}
