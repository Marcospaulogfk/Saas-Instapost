"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Check, Eye, EyeOff, Loader2 } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { AuthVisual } from "@/components/auth/auth-visual"
import { createClient } from "@/lib/supabase/client"
import "@/components/auth/auth.css"

// =====================================================================
// Senha nova (10/09/2026).
//
// O "Esqueci minha senha" mandava o e-mail, o link logava a pessoa e a
// jogava no painel, e NÃO EXISTIA tela pra digitar a senha nova: ela
// entrava uma vez pelo link e continuava sem senha. Com a decisão do
// Marcos de o cadastro não pedir confirmação de e-mail, o e-mail passou a
// servir SÓ pra trocar senha, então esta tela é o fim desse caminho.
//
// Chega-se aqui pelo link do e-mail: /auth/confirm troca o link por uma
// sessão e redireciona pra cá. Sem sessão (link vencido ou já usado), a
// tela diz isso e oferece pedir outro, em vez de um formulário que falharia.
//
// A regra de senha é a MESMA do cadastro: senha trocada não pode ser mais
// fraca do que a que o cadastro aceitaria.
// =====================================================================

const schema = z
  .object({
    senha: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres")
      .regex(/[0-9]/, "A senha precisa conter pelo menos 1 número"),
    confirmacao: z.string().min(1, "Repita a senha"),
  })
  .refine((v) => v.senha === v.confirmacao, {
    message: "As duas senhas não são iguais",
    path: ["confirmacao"],
  })
type FormValues = z.infer<typeof schema>

type Estado = "verificando" | "sem_sessao" | "formulario" | "pronto"

export default function RedefinirSenhaPage() {
  const [estado, setEstado] = useState<Estado>("verificando")
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [verSenha, setVerSenha] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { senha: "", confirmacao: "" },
  })

  useEffect(() => {
    let vivo = true
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (vivo) setEstado(data.user ? "formulario" : "sem_sessao")
      })
      .catch(() => {
        if (vivo) setEstado("sem_sessao")
      })
    return () => {
      vivo = false
    }
  }, [])

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setIsPending(true)
    try {
      const { error } = await createClient().auth.updateUser({ password: values.senha })
      if (error) {
        const m = error.message.toLowerCase()
        setServerError(
          m.includes("different from the old") || m.includes("same")
            ? "A senha nova precisa ser diferente da antiga."
            : m.includes("session") || m.includes("jwt")
              ? "O link venceu. Peça outro em Esqueci minha senha."
              : "Não conseguimos trocar a senha agora. Tente de novo em instantes.",
        )
        return
      }
      setEstado("pronto")
    } catch {
      setServerError("Não conseguimos falar com o servidor. Tente de novo em instantes.")
    } finally {
      setIsPending(false)
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
            {estado === "verificando" && (
              <p className="nx-auth-sub flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Conferindo o seu link...
              </p>
            )}

            {estado === "sem_sessao" && (
              <>
                <h1 className="nx-auth-title">Link vencido</h1>
                <p className="nx-auth-sub">
                  Este link de troca de senha já foi usado ou venceu. Peça um novo:
                  ele chega no seu e-mail em instantes.
                </p>
                <div className="mt-7">
                  <Link href="/recuperar-senha" className="nx-auth-submit block text-center">
                    Pedir outro link
                  </Link>
                </div>
              </>
            )}

            {estado === "pronto" && (
              <>
                <span className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-[rgb(22_104_227/0.12)] ring-1 ring-[rgb(22_104_227/0.3)]">
                  <Check className="h-5 w-5 text-brand-400" />
                </span>
                <h1 className="nx-auth-title">Senha trocada</h1>
                <p className="nx-auth-sub">
                  Pronto. Da próxima vez, entre com o seu e-mail e a senha nova.
                </p>
                <div className="mt-7">
                  <Link href="/dashboard" className="nx-auth-submit block text-center">
                    Ir para o painel
                  </Link>
                </div>
              </>
            )}

            {estado === "formulario" && (
              <>
                <h1 className="nx-auth-title">Crie uma senha nova</h1>
                <p className="nx-auth-sub">
                  Pelo menos 8 caracteres, com pelo menos 1 número.
                </p>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-7 space-y-4"
                  noValidate
                >
                  <div className="space-y-1.5">
                    <label htmlFor="nova-senha" className="nx-auth-label">
                      Senha nova
                    </label>
                    <div className="relative">
                      <input
                        id="nova-senha"
                        type={verSenha ? "text" : "password"}
                        autoComplete="new-password"
                        className="nx-auth-input pr-11"
                        aria-invalid={!!form.formState.errors.senha}
                        {...form.register("senha")}
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
                    {form.formState.errors.senha && (
                      <p className="nx-auth-erro-campo">{form.formState.errors.senha.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirma-senha" className="nx-auth-label">
                      Repita a senha nova
                    </label>
                    <input
                      id="confirma-senha"
                      type={verSenha ? "text" : "password"}
                      autoComplete="new-password"
                      className="nx-auth-input"
                      aria-invalid={!!form.formState.errors.confirmacao}
                      {...form.register("confirmacao")}
                    />
                    {form.formState.errors.confirmacao && (
                      <p className="nx-auth-erro-campo">
                        {form.formState.errors.confirmacao.message}
                      </p>
                    )}
                  </div>

                  {serverError && <div className="nx-auth-erro">{serverError}</div>}

                  <button type="submit" disabled={isPending} className="nx-auth-submit">
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar senha nova"
                    )}
                  </button>
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
