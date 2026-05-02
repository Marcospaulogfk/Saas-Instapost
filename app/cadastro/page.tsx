"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, Mail, Lock, ArrowRight, Loader2, Zap, Brain, Wand2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.25),transparent_70%)] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-md w-full text-center bg-background-secondary/80 backdrop-blur-xl border border-border-subtle rounded-2xl p-10"
        >
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-purple shadow-glow flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-h2 font-display font-bold gradient-text mb-3">
            Verifique seu email
          </h1>
          <p className="text-text-secondary mb-6">
            Enviamos um link de confirmação para{" "}
            <span className="text-text-primary font-medium">{submittedEmail}</span>
            . Clique no link para ativar sua conta.
          </p>
          <Button asChild variant="outline" className="w-full border-border-medium">
            <Link href="/login">Voltar para o login</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Esquerda */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.45),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(76,29,149,0.4),transparent_60%),linear-gradient(135deg,#0A0A0F_0%,#1C1227_50%,#0A0A0F_100%)] pointer-events-none" />
        <div className="absolute inset-0 grid-bg-fade opacity-25 pointer-events-none" />

        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-purple-600/25 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-violet-700/25 rounded-full blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-900/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-purple shadow-glow flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">SyncPost</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 max-w-md"
        >
          <h2 className="text-5xl font-display font-bold leading-tight text-white">
            Comece grátis.{" "}
            <span className="block bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 bg-clip-text text-transparent">
              Sem cartão.
            </span>
          </h2>
          <p className="mt-4 text-lg text-white/70 leading-relaxed">
            2 imagens grátis pra testar. Cancele quando quiser.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              { icon: CheckCircle2, label: "2 imagens grátis pra começar" },
              { icon: Zap, label: "Setup em menos de 1 minuto" },
              { icon: Brain, label: "Sem precisar de design ou copy" },
              { icon: Wand2, label: "Templates testados pelos melhores criadores" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 text-white/80"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center backdrop-blur-sm">
                  <item.icon className="w-4 h-4 text-purple-300" />
                </div>
                <span className="text-sm">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="relative z-10 flex items-center gap-4 text-white/60 text-sm"
        >
          <div className="flex -space-x-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-background bg-gradient-to-br from-purple-400 to-purple-800" />
            ))}
          </div>
          <span>+1.200 criadores já usam o SyncPost</span>
        </motion.div>
      </div>

      {/* Direita: form */}
      <div className="relative flex items-center justify-center p-6 lg:p-10 bg-background">
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.35),transparent_60%),linear-gradient(180deg,#0A0A0F_0%,#1C1227_60%,#0A0A0F_100%)]" />
          <div className="absolute inset-0 grid-bg-fade opacity-20" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-purple shadow-glow-sm flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">SyncPost</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-text-primary mb-2">
              Crie sua conta
            </h1>
            <p className="text-text-secondary">
              Comece com 2 imagens grátis. Sem cartão de crédito.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 mb-5 border-border-medium hover:border-purple-600/50 hover:bg-purple-600/5 bg-background-secondary/40 backdrop-blur-sm"
            onClick={onGoogle}
            disabled={isPending}
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            Cadastrar com Google
          </Button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-xs text-text-muted">ou com email</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="text-sm text-text-secondary mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  {...form.register("email")}
                  aria-invalid={!!form.formState.errors.email}
                  className="pl-11 h-12 bg-background-secondary/60 border-border-subtle focus:border-purple-600/50 focus:shadow-glow-sm"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-danger mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="text-sm text-text-secondary mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  {...form.register("password")}
                  aria-invalid={!!form.formState.errors.password}
                  className="pl-11 h-12 bg-background-secondary/60 border-border-subtle focus:border-purple-600/50 focus:shadow-glow-sm"
                />
              </div>
              {form.formState.errors.password ? (
                <p className="text-sm text-danger mt-1">{form.formState.errors.password.message}</p>
              ) : (
                <p className="text-xs text-text-muted mt-1">Mínimo 8 caracteres, com pelo menos 1 número.</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="acceptTerms"
                  checked={form.watch("acceptTerms")}
                  onCheckedChange={(c) =>
                    form.setValue("acceptTerms", c === true, { shouldValidate: true })
                  }
                  aria-invalid={!!form.formState.errors.acceptTerms}
                  className="mt-0.5 border-border-medium data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <label htmlFor="acceptTerms" className="text-sm font-normal leading-snug cursor-pointer text-text-secondary">
                  Concordo com os{" "}
                  <Link href="/termos" className="text-purple-400 hover:text-purple-300 transition-colors">termos de uso</Link>{" "}
                  e a{" "}
                  <Link href="/privacidade" className="text-purple-400 hover:text-purple-300 transition-colors">política de privacidade</Link>.
                </label>
              </div>
              {form.formState.errors.acceptTerms && (
                <p className="text-sm text-danger">{form.formState.errors.acceptTerms.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 group"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar conta grátis
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
