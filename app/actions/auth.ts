"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { comOnboarding } from "@/lib/onboarding/rota"
import { parsePrimeiroToqueCookie } from "@/lib/atribuicao/parse"

const FT_COOKIE = "nx_ft"

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
  // Falha do NOSSO envio de e-mail (SMTP recusou, 10/09/2026: "535
  // Authentication credentials invalid"). O Supabase desfaz o cadastro
  // inteiro quando o e-mail de confirmação não sai, então a conta NÃO fica
  // criada. "Tente de novo em alguns segundos" mandava a pessoa repetir algo
  // que ia falhar igual, e escondia o problema de nós.
  if (m.includes("sending confirmation") || m.includes("confirmation email") || m.includes("smtp"))
    return "Não conseguimos enviar o e-mail de confirmação agora, então a conta não foi criada. O problema é nosso, não seu: tente em alguns minutos, entre com o Google, ou fale com contato@nexuscontentai.com.br."
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
  // first_touch vai em raw_user_meta_data igual ref_code: o trigger
  // handle_new_user (0027) grava a coluna imutável a partir daqui. Sem isso,
  // quem cadastra por e-mail (não passa pelo /auth/callback) nunca carimba
  // a origem de aquisição.
  const jar = await cookies()
  const firstTouch = parsePrimeiroToqueCookie(jar.get(FT_COOKIE)?.value)
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
        ...(firstTouch ? { first_touch: firstTouch } : {}),
      },
    },
  })
  if (error) {
    // A tela mostra a tradução; o log guarda o erro CRU. Sem isto, a falha de
    // SMTP de 10/09/2026 só apareceu abrindo o log de Auth do Supabase.
    console.error("[auth/signUp] erro do Supabase:", error.status, error.code, error.message)
    return { ok: false, error: translateAuthError(error.message) }
  }
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
  // O link cai na tela de senha NOVA, não no painel: antes ele logava a
  // pessoa e a deixava no dashboard sem nunca pedir a senha nova.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appOrigin()}/auth/confirm?next=${encodeURIComponent("/redefinir-senha")}`,
  })
  if (error) return { ok: false, error: translateAuthError(error.message) }
  return { ok: true }
}
