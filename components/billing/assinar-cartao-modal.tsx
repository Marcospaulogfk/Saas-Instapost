"use client"

// =====================================================================
// components/billing/assinar-cartao-modal.tsx
// FORMULÁRIO DE CARTÃO do checkout transparente (CEO, 01/09/2026): a
// assinatura nasce dentro do modal, sem sair pro checkout hospedado. O
// hospedado continua existindo como fallback, oferecido quando a Asaas
// responde indisponibilidade (503).
//
// Sem trial aqui — texto do CTA fala em "assinar", não em "teste grátis": o
// trial já foi dado no cadastro (45 tokens pelo trigger do banco). Cobrança
// é hoje.
// =====================================================================

import { useState } from "react"
import { Loader2, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  NOME_DA_BANDEIRA,
  apenasDigitos,
  bandeiraDoCartao,
  hojeSaoPaulo,
  mascaraCelular,
  mascaraCep,
  mascaraCpfCnpj,
  mascaraNumeroCartao,
  mascaraValidade,
  validarDadosCartao,
} from "@/lib/cartao"
import { CYCLE_INFO, PLAN_LABEL, priceFor, type BillingCycle, type PaidPlan } from "@/lib/billing/plans"
import { iniciarCheckout } from "@/app/actions/billing"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: PaidPlan
  cycle: BillingCycle
  onSucesso: (info: { plan: PaidPlan; cycle: BillingCycle; priceBr: string }) => void
}

function Campo({
  label,
  erro,
  children,
}: {
  label: string
  erro?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  )
}

export function AssinarCartaoModal({ open, onOpenChange, plan, cycle, onSucesso }: Props) {
  const [numero, setNumero] = useState("")
  const [nome, setNome] = useState("")
  const [validade, setValidade] = useState("")
  const [cvv, setCvv] = useState("")
  const [cpfCnpj, setCpfCnpj] = useState("")
  const [cep, setCep] = useState("")
  const [enderecoNumero, setEnderecoNumero] = useState("")
  const [celular, setCelular] = useState("")

  const [enviando, setEnviando] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [oferecerHospedado, setOferecerHospedado] = useState(false)
  const [indoHospedado, setIndoHospedado] = useState(false)

  const bandeira = bandeiraDoCartao(numero)
  const preco = priceFor(plan, cycle)
  const cicloLabel = CYCLE_INFO[cycle].label

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (enviando) return
    setErroGeral(null)
    setOferecerHospedado(false)

    const [validadeMes = "", validadeAno = ""] = validade.split("/")
    const cartao = { numero, nome, validadeMes, validadeAno, cvv, cpfCnpj, cep, enderecoNumero, celular }

    // Valida NO CLIENTE primeiro: dígito trocado não deve custar uma viagem
    // ao servidor (nem um degrau no rate limit de tentativas).
    const v = validarDadosCartao(cartao, hojeSaoPaulo())
    if (!v.ok) {
      setErros(v.erros as Record<string, string>)
      return
    }
    setErros({})
    setEnviando(true)
    try {
      const res = await fetch("/api/billing/assinar-cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle, cartao }),
      })
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        message?: string
        campos?: Record<string, string>
        priceBr?: string
      }
      if (res.ok && body.ok) {
        onSucesso({ plan, cycle, priceBr: body.priceBr ?? `R$ ${preco.total}` })
        onOpenChange(false)
        return
      }
      if (body.campos && Object.keys(body.campos).length > 0) setErros(body.campos)
      setErroGeral(body.message ?? "Não deu pra concluir agora. Confira os dados e tente de novo.")
      // 503 = Asaas/infra fora — o formulário não resolve sozinho; o
      // checkout hospedado é outro caminho até a MESMA assinatura.
      if (res.status === 503) setOferecerHospedado(true)
    } catch {
      setErroGeral("Falha de conexão — nada foi cobrado. Tente de novo.")
    } finally {
      setEnviando(false)
    }
  }

  async function abrirCheckoutHospedado() {
    if (indoHospedado) return
    setIndoHospedado(true)
    try {
      const r = await iniciarCheckout(plan, cycle)
      // iniciarCheckout faz redirect() no sucesso; só volta aqui se deu erro.
      if (r && "erro" in r) {
        setErroGeral("O checkout também está indisponível. Tente de novo em instantes.")
      }
    } finally {
      setIndoHospedado(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !enviando && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            Assinar {PLAN_LABEL[plan]} · R$ {preco.perMonth}
            {cicloLabel}
          </DialogTitle>
          <DialogDescription>
            {cycle === "annual"
              ? `Cobrado R$ ${preco.total}/ano. Cancele quando quiser.`
              : "Cobrado hoje. Cancele quando quiser."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void enviar(e)} className="space-y-3.5" noValidate>
          <Campo label="Número do cartão" erro={erros["numero"]}>
            <div className="relative">
              <Input
                value={numero}
                onChange={(e) => setNumero(mascaraNumeroCartao(e.target.value))}
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                aria-invalid={Boolean(erros["numero"])}
              />
              {bandeira && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {NOME_DA_BANDEIRA[bandeira]}
                </span>
              )}
            </div>
          </Campo>

          <Campo label="Nome impresso no cartão" erro={erros["nome"]}>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="cc-name"
              placeholder="Como está no cartão"
              aria-invalid={Boolean(erros["nome"])}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Validade" erro={erros["validadeMes"]}>
              <Input
                value={validade}
                onChange={(e) => setValidade(mascaraValidade(e.target.value))}
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                aria-invalid={Boolean(erros["validadeMes"])}
              />
            </Campo>
            <Campo label="CVV" erro={erros["cvv"]}>
              <Input
                value={cvv}
                onChange={(e) => setCvv(apenasDigitos(e.target.value).slice(0, 4))}
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                aria-invalid={Boolean(erros["cvv"])}
              />
            </Campo>
          </div>

          <Campo label="CPF ou CNPJ do titular" erro={erros["cpfCnpj"]}>
            <Input
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(mascaraCpfCnpj(e.target.value))}
              inputMode="numeric"
              placeholder="000.000.000-00"
              aria-invalid={Boolean(erros["cpfCnpj"])}
            />
          </Campo>

          {/* CEP/nº/celular: exigência antifraude da Asaas, não burocracia nossa. */}
          <div className="grid grid-cols-2 gap-3">
            <Campo label="CEP da fatura" erro={erros["cep"]}>
              <Input
                value={cep}
                onChange={(e) => setCep(mascaraCep(e.target.value))}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                aria-invalid={Boolean(erros["cep"])}
              />
            </Campo>
            <Campo label="Número" erro={erros["enderecoNumero"]}>
              <Input
                value={enderecoNumero}
                onChange={(e) => setEnderecoNumero(e.target.value.slice(0, 10))}
                placeholder="123"
                aria-invalid={Boolean(erros["enderecoNumero"])}
              />
            </Campo>
          </div>

          <Campo label="Celular com DDD" erro={erros["celular"]}>
            <Input
              value={celular}
              onChange={(e) => setCelular(mascaraCelular(e.target.value))}
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="(11) 99999-9999"
              aria-invalid={Boolean(erros["celular"])}
            />
          </Campo>

          {erroGeral && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
              {erroGeral}
            </p>
          )}
          {oferecerHospedado && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={indoHospedado}
              onClick={() => void abrirCheckoutHospedado()}
            >
              {indoHospedado ? "Abrindo…" : "Tentar pelo checkout seguro da Asaas"}
            </Button>
          )}

          <Button type="submit" disabled={enviando} className="w-full">
            {enviando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirmando assinatura…
              </>
            ) : (
              `Assinar ${PLAN_LABEL[plan]} — R$ ${preco.perMonth}${cicloLabel}`
            )}
          </Button>

          <p className="flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            Dados enviados direto ao processador Asaas. Não guardamos o número do seu cartão.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
