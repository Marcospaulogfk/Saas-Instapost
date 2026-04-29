"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { signUpWithPassword, signInWithGoogle } from "@/app/actions/auth"

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
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", acceptTerms: false },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setIsPending(true)
    const result = await signUpWithPassword(values.email, values.password)
    setIsPending(false)
    if (result.ok) {
      if (result.needsConfirmation) {
        setSubmittedEmail(values.email)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } else {
      setServerError(result.error)
    }
  }

  async function onGoogle() {
    setServerError(null)
    setIsPending(true)
    const result = await signInWithGoogle("/dashboard")
    if (result && !result.ok) {
      setIsPending(false)
      setServerError(result.error)
    }
  }

  if (submittedEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-[440px] space-y-6 text-center">
          <Link href="/" className="text-2xl font-bold inline-block">
            InstaPost
          </Link>
          <div className="rounded-full bg-primary/10 w-16 h-16 mx-auto flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Verifique seu email
            </h1>
            <p className="text-sm text-muted-foreground">
              Enviamos um link de confirmacao para{" "}
              <span className="font-medium text-foreground">
                {submittedEmail}
              </span>
              . Clique no link para ativar sua conta.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Voltar para o login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[440px] space-y-8">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold inline-block">
            InstaPost
          </Link>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Crie sua conta
          </h1>
          <p className="text-sm text-muted-foreground">
            Comece com 2 imagens gratis. Sem cartao de credito.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11"
          onClick={onGoogle}
          disabled={isPending}
        >
          <GoogleIcon className="w-5 h-5 mr-2" />
          Cadastrar com Google
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            ou
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
              aria-invalid={!!form.formState.errors.email}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
              aria-invalid={!!form.formState.errors.password}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Minimo 8 caracteres, com pelo menos 1 numero.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Checkbox
                id="acceptTerms"
                checked={form.watch("acceptTerms")}
                onCheckedChange={(c) =>
                  form.setValue("acceptTerms", c === true, {
                    shouldValidate: true,
                  })
                }
                aria-invalid={!!form.formState.errors.acceptTerms}
                className="mt-0.5"
              />
              <Label
                htmlFor="acceptTerms"
                className="text-sm font-normal leading-snug cursor-pointer"
              >
                Concordo com os{" "}
                <Link href="/termos" className="text-primary hover:underline">
                  termos de uso
                </Link>{" "}
                e a{" "}
                <Link
                  href="/privacidade"
                  className="text-primary hover:underline"
                >
                  politica de privacidade
                </Link>
                .
              </Label>
            </div>
            {form.formState.errors.acceptTerms && (
              <p className="text-sm text-destructive">
                {form.formState.errors.acceptTerms.message}
              </p>
            )}
          </div>

          {serverError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11"
            disabled={isPending}
          >
            {isPending ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Ja tem uma conta?{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
