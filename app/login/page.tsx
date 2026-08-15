"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { AuthVisual, GoogleIcon } from "@/components/auth/auth-visual"
import { signInWithPassword, signInWithGoogle } from "@/app/actions/auth"
import "@/components/auth/auth.css"

const schema = z.object({
  email: z.string().min(1, "Informe seu email").email("Email invalido"),
  password: z.string().min(1, "Informe sua senha"),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#05070c]" />}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") ?? "/dashboard"

  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [verSenha, setVerSenha] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setIsPending(true)
    const result = await signInWithPassword(values.email, values.password)
    setIsPending(false)
    if (result.ok) {
      router.push(redirectTo)
      router.refresh()
    } else {
      setServerError(result.error)
    }
  }

  async function onGoogle() {
    setServerError(null)
    setIsPending(true)
    const result = await signInWithGoogle(redirectTo)
    if (result && !result.ok) {
      setIsPending(false)
      setServerError(result.error)
    }
  }

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
          <div className="nx-auth-inner nx-auth-fade-up">
            <h1 className="nx-auth-title">Entrar</h1>
            <p className="nx-auth-sub">Acesse o painel e gere o carrossel da sua marca.</p>

            <div className="mt-7">
              <button
                type="button"
                onClick={onGoogle}
                disabled={isPending}
                className="nx-auth-google"
              >
                <GoogleIcon />
                Entrar com Google
              </button>
            </div>

            <div className="nx-auth-divider">ou continue com</div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="nx-auth-label">
                  Email
                </label>
                <input
                  id="login-email"
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
                <div className="nx-auth-field-row">
                  <label htmlFor="login-password" className="nx-auth-label">
                    Senha
                  </label>
                  <Link href="/recuperar-senha" className="nx-auth-link">
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={verSenha ? "text" : "password"}
                    autoComplete="current-password"
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
                {form.formState.errors.password && (
                  <p className="nx-auth-erro-campo">{form.formState.errors.password.message}</p>
                )}
              </div>

              {serverError && <div className="nx-auth-erro">{serverError}</div>}

              <button type="submit" disabled={isPending} className="nx-auth-submit">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>

              <p className="nx-auth-troca">
                Não tem uma conta?{" "}
                <Link href="/cadastro" className="nx-auth-link font-semibold">
                  Criar grátis
                </Link>
              </p>
            </form>
          </div>
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
            O carrossel pronto,
            <br />
            em 3 minutos.
          </>
        }
      />
    </div>
  )
}
