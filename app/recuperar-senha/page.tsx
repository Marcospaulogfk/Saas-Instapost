"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordReset } from "@/app/actions/auth"

const schema = z.object({
  email: z.string().min(1, "Informe seu email").email("Email invalido"),
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
              Email enviado
            </h1>
            <p className="text-sm text-muted-foreground">
              Se{" "}
              <span className="font-medium text-foreground">
                {submittedEmail}
              </span>{" "}
              estiver cadastrado, voce recebera um link para redefinir sua senha
              em alguns instantes.
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
            Esqueceu a senha?
          </h1>
          <p className="text-sm text-muted-foreground">
            Digite seu email e enviaremos um link para voce criar uma nova senha.
          </p>
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
            {isPending ? "Enviando..." : "Enviar link de recuperacao"}
          </Button>
        </form>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o login
        </Link>
      </div>
    </div>
  )
}
