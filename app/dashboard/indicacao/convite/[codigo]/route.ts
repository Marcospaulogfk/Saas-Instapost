import { NextResponse } from "next/server"
import { aplicarCodigoConvite } from "@/app/actions/indicacao"

// =====================================================================
// GET /dashboard/indicacao/convite/[codigo]
//
// Atalho pra quem JÁ tem conta e recebeu o link depois: abre, vincula e
// cai na página de indicação com o resultado.
//
// Quem ainda NÃO tem conta usa o link principal (/cadastro?ref=CODIGO) —
// esta rota vive sob /dashboard, que o middleware protege, então visitante
// deslogado é mandado pro /login com ?redirect= e volta pra cá depois.
//
// Nada é creditado aqui: só o vínculo 'pending'. O crédito é do webhook.
// =====================================================================

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await ctx.params
  const r = await aplicarCodigoConvite(decodeURIComponent(codigo ?? ""))

  const destino = new URL("/dashboard/indicacao", _req.url)
  destino.searchParams.set("convite", r.ok ? "ok" : "erro")
  return NextResponse.redirect(destino)
}
