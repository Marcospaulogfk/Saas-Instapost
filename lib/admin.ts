// =====================================================================
// lib/admin.ts
// Quem é "dono" no app. Não existe role no banco: a lista de e-mails de
// admin vem do ambiente (`ADMIN_EMAILS`, separados por vírgula).
// =====================================================================

import { requireUser } from "@/lib/data/queries"

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

/** `true` se o usuário logado está em ADMIN_EMAILS. Redireciona pro login se deslogado. */
export async function isAdminUser(): Promise<boolean> {
  const lista = adminEmails()
  if (lista.size === 0) return false
  const { user } = await requireUser()
  const email = user.email?.toLowerCase()
  return !!email && lista.has(email)
}
