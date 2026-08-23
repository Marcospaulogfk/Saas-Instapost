"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Check, Eye, EyeOff, Loader2, Mail } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { AuthVisual, GoogleIcon } from "@/components/auth/auth-visual"
import { signUpWithPassword, signInWithGoogle } from "@/app/actions/auth"
import "@/components/auth/auth.css"

const schema = z.object({
  email: z.string().min(1, "Informe seu email").email("Email invalido"),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres")
    .regex(/[0-9]/, "A senha precisa conter pelo menos 1 numero"),
  acceptTerms: z.boolean().refine((v) => v === true, {
    message: "Voce precisa aceitar os termos para continuar",
  }),
})
type FormValues = z.infer<typeof schema>

export default function CadastroPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [verSenha, setVerSenha] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", acceptTerms: false },
  })

  const [refCode, setRefCode] = useState<string | null>(null)
  const [nextPath, setNextPath] = useState<string>("/dashboard")

  /* Pré-preenche com o e-mail digitado no rodapé da landing (/cadastro?email=)
     e captura ?ref= (indicação), ?plano=/?ciclo= e ?next= (volta pro checkout).
     Lido de window em vez de useSearchParams pra não exigir Suspense aqui. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const email = q.get("email")
    if (email) form.setValue("email", email)

    const next = q.get("next")
    const plano = q.get("plano")
    const ciclo = q.get("ciclo")
    if (next && next.startsWith("/")) setNextPath(next)
    else if (plano) setNextPath(`/pricing?plano=${plano}&ciclo=${ciclo ?? "monthly"}`)

    // Indicação: o código vale por 30 dias mesmo que a pessoa feche a aba e
    // volte, ou entre pelo Google (o callback lê o cookie). Formato do código:
    // 8 letras/números, sem 0/O/1/I/L.
    const ref = (q.get("ref") ?? "").trim().toUpperCase()
    const cookieRef = document.cookie
      .split("; ")
      .find((c) => c.startsWith("nx_ref="))
      ?.slice("nx_ref=".length)
    const valido = (v: string) => /^[A-HJ-KM-NP-Z2-9]{8}$/.test(v)
    const escolhido = valido(ref) ? ref : cookieRef && valido(cookieRef) ? cookieRef : null
    if (escolhido) {
      setRefCode(escolhido)
      if (ref === escolhido) {
        document.cookie = `nx_ref=${escolhido}; path=/; max-age=${30 * 24 * 3600}; samesite=lax`
      }
    }
  }, [form])

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setIsPending(true)
    const result = await signUpWithPassword(values.email, values.password, {
      refCode,
      next: nextPath,
    })
    setIsPending(false)
    if (result.ok) {
      if (result.needsConfirmation) {
        setSubmittedEmail(values.email)
      } else {
        router.push(nextPath)
        router.refresh()
      }
    } else {
      setServerError(result.error)
    }
  }

  async function onGoogle() {
    setServerError(null)
    setIsPending(true)
    const result = await signInWithGoogle(nextPath)
    if (result && !result.ok) {
      setIsPending(false)
      setServerError(result.error)
    }
  }

  const aceitou = form.watch("acceptTerms")

  return (
    <div className="dark nx-auth">
      <div className="nx-auth-col">
        <header className="nx-auth-top">
          <Link href="/" className="inline-flex items-center">
            <Logo size={26} />
          </Link>
          <Link href="/" className="nx-auth-back">
            ← Voltar ao site
          </Link>
        </header>

        <main className="nx-auth-body">
          {submittedEmail ? (
            /* ── Confirmação de e-mail ─────────────────────────── */
            <div className="nx-auth-inner nx-auth-fade-up nx-auth-aviso">
              <div className="nx-auth-aviso-icone">
                <Mail size={26} />
              </div>
              <h1 className="nx-auth-title">Verifique seu email</h1>
              <p className="nx-auth-sub">
                Enviamos um link de confirmação para{" "}
                <span className="font-medium text-[#f2f5fa]">{submittedEmail}</span>. Clique no
                link para ativar sua conta.
              </p>
              <div className="mt-7">
                <Link href="/login" className="nx-auth-submit">
                  Voltar para o login
                </Link>
              </div>
            </div>
          ) : (
            /* ── Formulário ────────────────────────────────────── */
            <div className="nx-auth-inner nx-auth-fade-up">
              <h1 className="nx-auth-title">Criar conta</h1>
              <p className="nx-auth-sub">Comece com 2 imagens grátis. Sem cartão de crédito.</p>

              <div className="mt-7">
                <button
                  type="button"
                  onClick={onGoogle}
                  disabled={isPending}
                  className="nx-auth-google"
                >
                  <GoogleIcon />
                  Cadastrar com Google
                </button>
              </div>

              <div className="nx-auth-divider">ou continue com</div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="cadastro-email" className="nx-auth-label">
                    Email
                  </label>
                  <input
                    id="cadastro-email"
                    type="email"
                    autoComplete="email"
                    placeholder="voce@empresa.com"
                    className="nx-auth-input"
                    aria-invalid={!!form.formState.errors.email}
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="nx-auth-erro-campo">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cadastro-password" className="nx-auth-label">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="cadastro-password"
                      type={verSenha ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="nx-auth-input pr-11"
                      aria-invalid={!!form.formState.errors.password}
                      {...form.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setVerSenha((v) => !v)}
                      aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
                      className="nx-auth-eye"
                    >
                      {verSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form.formState.errors.password ? (
                    <p className="nx-auth-erro-campo">
                      {form.formState.errors.password.message}
                    </p>
                  ) : (
                    <p className="nx-auth-dica">Mínimo 8 caracteres, com pelo menos 1 número.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="nx-auth-check-row">
                    <button
                      type="button"
                      id="acceptTerms"
                      role="checkbox"
                      aria-checked={aceitou}
                      aria-invalid={!!form.formState.errors.acceptTerms}
                      onClick={() =>
                        form.setValue("acceptTerms", !aceitou, { shouldValidate: true })
                      }
                      className="nx-auth-check"
                    >
                      <Check size={11} strokeWidth={3.5} />
                    </button>
                    <label htmlFor="acceptTerms" className="nx-auth-check-label">
                      Concordo com os{" "}
                      <Link href="/termos" className="nx-auth-link">
                        termos de uso
                      </Link>{" "}
                      e a{" "}
                      <Link href="/privacidade" className="nx-auth-link">
                        política de privacidade
                      </Link>
                      .
                    </label>
                  </div>
                  {form.formState.errors.acceptTerms && (
                    <p className="nx-auth-erro-campo">
                      {form.formState.errors.acceptTerms.message}
                    </p>
                  )}
                </div>

                {serverError && <div className="nx-auth-erro">{serverError}</div>}

                <button type="submit" disabled={isPending} className="nx-auth-submit">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar conta grátis"
                  )}
                </button>

                <p className="nx-auth-troca">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="nx-auth-link font-semibold">
                    Entrar
                  </Link>
                </p>
              </form>
            </div>
          )}
        </main>

        <footer className="nx-auth-foot">
          Ao continuar, você concorda com os{" "}
          <Link href="/termos" className="nx-auth-link">
            Termos de uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="nx-auth-link">
            Política de privacidade
          </Link>
          .
        </footer>
      </div>

      <AuthVisual
        tagline={
          <>
            Comece grátis,
            <br />
            sem cartão.
          </>
        }
      />
    </div>
  )
}
