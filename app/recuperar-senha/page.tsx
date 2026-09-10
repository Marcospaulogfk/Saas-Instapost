"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { AuthVisual } from "@/components/auth/auth-visual"
import { requestPasswordReset } from "@/app/actions/auth"
import "@/components/auth/auth.css"

// =====================================================================
// Recuperar senha.
//
// Refeita em 10/09/2026: a tela ainda dizia "InstaPost" (nome de dois
// rebrands atrás), era um bloco centralizado que não parecia com nenhuma
// outra tela do produto e tinha texto sem acento. É a tela que a pessoa
// abre no pior momento — quando não consegue entrar — e justo ali o
// produto parecia outro. Agora usa o mesmo esqueleto de /login e /cadastro.
//
// A resposta é sempre a mesma, exista o e-mail ou não: dizer "esse e-mail
// não está cadastrado" entregaria a lista de clientes a quem estivesse
// testando endereços.
// =====================================================================

const schema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
})
type FormValues = z.infer<typeof schema>

export default function RecuperarSenhaPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setIsPending(true)
    const result = await requestPasswordReset(values.email)
    setIsPending(false)
    if (result.ok) {
      setSubmittedEmail(values.email)
    } else {
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
          <Link href="/login" className="nx-auth-back">
            ← Voltar ao login
          </Link>
        </header>

        <main className="nx-auth-body">
          <div className="nx-auth-inner nx-auth-fade-up">
            {submittedEmail ? (
              <>
                <span className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-[rgb(22_104_227/0.12)] ring-1 ring-[rgb(22_104_227/0.3)]">
                  <Mail className="h-5 w-5 text-brand-400" />
                </span>
                <h1 className="nx-auth-title">E-mail enviado</h1>
                <p className="nx-auth-sub">
                  Se{" "}
                  <span className="font-semibold text-[#f2f5fa]">{submittedEmail}</span>{" "}
                  estiver cadastrado, o link para criar uma senha nova chega em
                  alguns instantes. Confira também a caixa de spam.
                </p>
                <div className="mt-7 space-y-3">
                  <Link href="/login" className="nx-auth-submit block text-center">
                    Voltar para o login
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSubmittedEmail(null)}
                    className="nx-auth-troca w-full"
                  >
                    Errou o e-mail?{" "}
                    <span className="nx-auth-link font-semibold">Tentar outro</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="nx-auth-title">Esqueceu a senha?</h1>
                <p className="nx-auth-sub">
                  Digite seu e-mail e enviamos um link para você criar uma nova.
                </p>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-7 space-y-4"
                  noValidate
                >
                  <div className="space-y-1.5">
                    <label htmlFor="recuperar-email" className="nx-auth-label">
                      E-mail
                    </label>
                    <input
                      id="recuperar-email"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@empresa.com"
                      className="nx-auth-input"
                      aria-invalid={!!form.formState.errors.email}
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                      <p className="nx-auth-erro-campo">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {serverError && <div className="nx-auth-erro">{serverError}</div>}

                  <button type="submit" disabled={isPending} className="nx-auth-submit">
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar link de recuperação"
                    )}
                  </button>

                  <p className="nx-auth-troca">
                    <Link
                      href="/login"
                      className="nx-auth-link inline-flex items-center gap-1.5 font-semibold"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Voltar para o login
                    </Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </main>

        <footer className="nx-auth-foot">
          Precisa de ajuda? Fale com a gente em contato@nexuscontentai.com.br.
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
