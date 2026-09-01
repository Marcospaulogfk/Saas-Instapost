"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { comOnboarding } from "@/lib/onboarding/rota"

type ActionResult = { ok: true } | { ok: false; error: string }
type SignUpResult =
  | { ok: true; needsConfirmation: boolean }
  | { ok: false; error: string }

function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials")) return "Email ou senha incorretos."
  if (m.includes("email not confirmed"))
    return "Confirme seu email antes de entrar. Verifique sua caixa de entrada."
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Ja existe uma conta com esse email. Tente fazer login."
  if (m.includes("password should be at least"))
    return "A senha precisa ter pelo menos 8 caracteres."
  if (m.includes("rate limit") || m.includes("too many requests"))
    return "Muitas tentativas. Aguarde alguns minutos e tente de novo."
  if (m.includes("user not found")) return "Email nao encontrado."
  if (m.includes("network") || m.includes("fetch failed"))
    return "Falha de conexao. Verifique sua internet."
  return "Algo deu errado. Tente novamente em alguns segundos."
}

function appOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: translateAuthError(error.message) }
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function signUpWithPassword(
  email: string,
  password: string,
  opts: { name?: string | null; refCode?: string | null; next?: string | null } = {},
): Promise<SignUpResult> {
  const supabase = await createClient()
  const next = opts.next && opts.next.startsWith("/") ? opts.next : "/dashboard"
  const nome = opts.name?.trim() || null
  // ref_code vai em raw_user_meta_data: o trigger handle_new_user (0014/0020)
  // chama registrar_indicacao com ele. É o que faz /cadastro?ref=CODIGO valer.
  const refCode = opts.refCode?.trim().toUpperCase() || null
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // O redirect pós-confirmação passa PELA etapa de onboarding (objetivo
      // de uso) antes do destino real — signup direto (sem confirmação de
      // e-mail) faz o mesmo client-side, ver app/cadastro/page.tsx.
      emailRedirectTo: `${appOrigin()}/auth/confirm?next=${encodeURIComponent(comOnboarding(next))}`,
      data: {
        ...(nome ? { full_name: nome } : {}),
        ...(refCode ? { ref_code: refCode } : {}),
      },
    },
  })
  if (error) return { ok: false, error: translateAuthError(error.message) }
  return { ok: true, needsConfirmation: !data.session }
}

export async function signInWithGoogle(
  redirectTo: string = "/dashboard",
): Promise<{ ok: false; error: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appOrigin()}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  })
  if (error) return { ok: false, error: translateAuthError(error.message) }
  if (!data.url)
    return { ok: false, error: "Nao foi possivel iniciar login com Google." }
  redirect(data.url)
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function requestPasswordReset(
  email: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appOrigin()}/auth/confirm?next=/dashboard`,
  })
  if (error) return { ok: false, error: translateAuthError(error.message) }
  return { ok: true }
}
