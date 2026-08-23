// =====================================================================
// /dashboard/admin/afiliados: fila de candidaturas do programa de
// afiliados. Substitui o e-mail de notificação que o repo não tem
// (sem provedor): o dono entra aqui, aprova ou rejeita.
// 404 a menos que o e-mail logado esteja em ADMIN_EMAILS.
// =====================================================================

import { notFound } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { AFILIADOS_HABILITADO } from "@/lib/features"
import { isAdminUser } from "@/lib/admin"
import { listCandidaturas } from "@/lib/afiliados/queries"
import { ListaCandidaturas } from "./admin-client"

export const metadata = { title: "Admin: afiliados" }
export const dynamic = "force-dynamic"

export default async function AdminAfiliadosPage() {
  if (!AFILIADOS_HABILITADO) notFound()
  if (!(await isAdminUser())) notFound()

  const lista = await listCandidaturas()
  const pendentes = lista.filter((a) => a.status === "pending")
  const outros = lista.filter((a) => a.status !== "pending")

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8 space-y-5">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="nv-tile nv-tile-purple w-10 h-10">
            <ShieldCheck className="w-5 h-5" strokeWidth={1.9} />
          </span>
          <h1 className="text-2xl font-bold" style={{ color: "var(--nv-text)" }}>
            Candidaturas de afiliados
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--nv-text-muted)" }}>
          {pendentes.length} pendente{pendentes.length === 1 ? "" : "s"}. Sem
          e-mail automático: quem foi aprovado ou rejeitado precisa ser avisado
          por fora, por enquanto.
        </p>
      </div>

      <ListaCandidaturas titulo="Pendentes" itens={pendentes} vazio="Nenhuma candidatura pendente." />
      <ListaCandidaturas titulo="Aprovados, rejeitados e suspensos" itens={outros} vazio="Nada aqui ainda." />
    </div>
  )
}
