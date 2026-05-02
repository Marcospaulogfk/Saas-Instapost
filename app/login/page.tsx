"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { SparklesField } from "@/components/ui/sparkle"
import { signInWithPassword, signInWithGoogle } from "@/app/actions/auth"

const schema = z.object({
  email: z.string().min(1, "Informe seu email").email("Email invalido"),
  password: z.string().min(1, "Informe sua senha"),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
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
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden p-4">
      <div className="absolute inset-0 aurora opacity-50 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-fade opacity-30 pointer-events-none" />
      <SparklesField count={8} />
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <Spotlight className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="p-8 relative overflow-hidden bg-gradient-card border-border-subtle">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-purple shadow-glow mb-4"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-h2 font-display font-bold gradient-text mb-2">
                Bem-vindo de volta
              </h1>
              <p className="text-text-secondary">Entre na sua conta SyncPost</p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 mb-6 border-border-medium hover:border-purple-600/50 hover:bg-purple-600/5"
              onClick={onGoogle}
              disabled={isPending}
            >
              <GoogleIcon className="w-5 h-5 mr-2" />
              Entrar com Google
            </Button>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-border-subtle" />
              <span className="text-tiny text-text-muted uppercase tracking-wider">ou</span>
              <div className="h-px flex-1 bg-border-subtle" />
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label htmlFor="email" className="text-tiny text-text-secondary uppercase tracking-wider mb-2 block">
                  Email
                </label>
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
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="text-tiny text-text-secondary uppercase tracking-wider">
                    Senha
                  </label>
                  <Link
                    href="/recuperar-senha"
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Esqueci a senha
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...form.register("password")}
                    aria-invalid={!!form.formState.errors.password}
                    className="pl-11 h-12 bg-background-secondary/60 border-border-subtle focus:border-purple-600/50 focus:shadow-glow-sm"
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-danger mt-1">{form.formState.errors.password.message}</p>
                )}
              </motion.div>

              {serverError && (
                <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger">
                  {serverError}
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 group bg-gradient-purple hover:shadow-glow-lg transition-all"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            <p className="text-center text-sm text-text-secondary mt-6">
              Não tem conta?{" "}
              <Link href="/cadastro" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Criar conta grátis
              </Link>
            </p>
          </Card>
        </motion.div>
      </Spotlight>
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
