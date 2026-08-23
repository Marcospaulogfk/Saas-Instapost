"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Bell, ChevronDown, User, CreditCard, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { signOut } from "@/app/actions/auth"
import { TOKEN_COST } from "@/lib/tokens"

interface NovaTopBarProps {
  mobileNav?: React.ReactNode
  userName: string
  userEmail: string
  userInitials: string
  userAvatarUrl: string | null
  credits: number
  planCreditsMonthly: number
  creditsUsedThisMonth: number
  topupCredits?: number
  referralCredits?: number
  subscriptionStatus: string
  planId?: string | null
}

const STATUS_LABEL: Record<string, string> = {
  trial: "Teste grátis",
  past_due: "Atrasado",
  canceled: "Cancelado",
  incomplete: "Incompleto",
}
const PLANO_LABEL: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
}

/** Nome do plano pelo plan_id (0020) ou, sem ele, pelo grant mensal. */
function rotuloPlano(status: string, planId: string | null | undefined, planCreditsMonthly: number): string {
  if (status === "active") {
    if (planId && PLANO_LABEL[planId]) return PLANO_LABEL[planId]
    if (planCreditsMonthly >= 3000) return "Studio"
    if (planCreditsMonthly >= 1000) return "Pro"
    if (planCreditsMonthly >= 300) return "Starter"
    return "Ativo"
  }
  return STATUS_LABEL[status] ?? status
}

/**
 * Topo do dashboard no padrão EverReply: barra SEM fundo e SEM borda, com tudo
 * encostado à direita. Quem dá corpo são as próprias pílulas (uso, busca, sino,
 * conta) flutuando sobre o canvas.
 */
export function NovaTopBar({
  mobileNav,
  userName,
  userEmail,
  userInitials,
  userAvatarUrl,
  credits,
  planCreditsMonthly,
  creditsUsedThisMonth,
  topupCredits = 0,
  referralCredits = 0,
  subscriptionStatus,
  planId,
}: NovaTopBarProps) {
  const router = useRouter()
  const planLabel = rotuloPlano(subscriptionStatus, planId, planCreditsMonthly)
  const extras = Math.max(0, topupCredits) + Math.max(0, referralCredits)

  async function handleSignOut() {
    await signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="relative z-20 flex h-[60px] shrink-0 items-center gap-2 px-4 sm:px-6">
      {mobileNav}

      <div className="ml-auto flex items-center gap-2">
        <UsageChip
          credits={credits}
          planCreditsMonthly={planCreditsMonthly}
          creditsUsedThisMonth={creditsUsedThisMonth}
          extras={extras}
        />
        <UsageChipCompact
          credits={credits}
          planCreditsMonthly={planCreditsMonthly}
          creditsUsedThisMonth={creditsUsedThisMonth}
          extras={extras}
        />

        {/* Busca (ainda placeholder — não há índice de busca no app) */}
        <button
          type="button"
          aria-label="Buscar"
          title="Buscar"
          className="nv-pill flex h-9 w-9 items-center justify-center"
          style={{ color: "var(--nv-text)" }}
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Notificações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Notificações"
              className="nv-pill relative flex h-9 w-9 items-center justify-center"
              style={{ color: "var(--nv-text)" }}
            >
              <Bell className="h-4 w-4" />
              <span
                className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--nv-pink)" }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação nova
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Conta — desceu da sidebar pro topo (padrão EverReply) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={userEmail}
              className="nv-pill flex items-center gap-2.5 py-1.5 pl-1.5 pr-3"
            >
              <Avatar className="h-8 w-8">
                {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userName} />}
                <AvatarFallback
                  style={{ background: "rgba(42, 121, 234,0.2)", color: "#8DB8F7", fontSize: 11, fontWeight: 600 }}
                >
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left leading-tight sm:block">
                <span
                  className="block max-w-[160px] truncate text-[12.5px] font-semibold"
                  style={{ color: "var(--nv-text)" }}
                >
                  {userName}
                </span>
                <span className="block text-[11px]" style={{ color: "var(--nv-text-subtle)" }}>
                  Plano {planLabel}
                </span>
              </span>
              <ChevronDown
                className="hidden h-3.5 w-3.5 sm:block"
                style={{ color: "var(--nv-text-subtle)" }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <div className="truncate text-[12.5px] font-semibold" style={{ color: "var(--nv-text)" }}>
                {userName}
              </div>
              <div className="truncate text-[11px]" style={{ color: "var(--nv-text-muted)" }}>
                {userEmail}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracoes" className="cursor-pointer">
                <User className="mr-2 h-3.5 w-3.5" />
                Minha conta
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/tokens" className="cursor-pointer">
                <CreditCard className="mr-2 h-3.5 w-3.5" />
                Tokens e plano
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                void handleSignOut()
              }}
              className="text-danger focus:text-danger"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

/**
 * Chip de uso do plano ("340/2.000 ▬ 17%"). Mostra o CONSUMIDO no mês, então a
 * barra enche conforme você gasta — âmbar em 80%, vermelho em 95%. Some quando
 * o plano não tem teto definido.
 */
function UsageChip({
  credits,
  planCreditsMonthly,
  creditsUsedThisMonth,
  extras = 0,
}: {
  credits: number
  planCreditsMonthly: number
  creditsUsedThisMonth: number
  extras?: number
}) {
  const total = planCreditsMonthly > 0 ? planCreditsMonthly : credits + creditsUsedThisMonth
  if (total <= 0 && extras <= 0) return null

  const used = Math.max(0, Math.min(total, creditsUsedThisMonth))
  const pct = Math.min(100, Math.round((used / total) * 100))
  const color = pct >= 95 ? "#f87171" : pct >= 80 ? "#f6c35a" : "var(--nv-brand)"
  const title = `${used.toLocaleString("pt-BR")} de ${total.toLocaleString("pt-BR")} créditos usados neste mês`
  const restante = Math.max(0, total - used)

  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* Completo (lg+): números + barra + % */}
        <button
          type="button"
          title={title}
          className="nv-pill hidden items-center gap-2 px-3 py-1.5 lg:flex"
        >
          <span className="text-[11px] tabular-nums" style={{ color: "var(--nv-text)" }}>
            {used.toLocaleString("pt-BR")}
            <span style={{ color: "var(--nv-text-subtle)" }}>/{total.toLocaleString("pt-BR")}</span>
          </span>
          <span className="h-1.5 w-10 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
          </span>
          <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>
            {pct}%
          </span>
        </button>
      </PopoverTrigger>
      <SaldoPopoverContent
        restante={restante}
        total={total}
        used={used}
        pct={pct}
        color={color}
        extras={extras}
      />
    </Popover>
  )
}

/**
 * Compacto (até lg): bolinha + %. Popover próprio porque o trigger do Radix
 * aceita um filho só — duplicar o conteúdo é mais barato que envolver os dois
 * botões num wrapper que quebraria o layout da barra.
 */
function UsageChipCompact({
  credits,
  planCreditsMonthly,
  creditsUsedThisMonth,
  extras = 0,
}: {
  credits: number
  planCreditsMonthly: number
  creditsUsedThisMonth: number
  extras?: number
}) {
  const total = planCreditsMonthly > 0 ? planCreditsMonthly : credits + creditsUsedThisMonth
  if (total <= 0 && extras <= 0) return null
  const used = Math.max(0, Math.min(total, creditsUsedThisMonth))
  const pct = Math.min(100, Math.round((used / total) * 100))
  const color = pct >= 95 ? "#f87171" : pct >= 80 ? "#f6c35a" : "var(--nv-brand)"

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="nv-pill flex items-center gap-1.5 px-2.5 py-1.5 lg:hidden"
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>
            {pct}%
          </span>
        </button>
      </PopoverTrigger>
      <SaldoPopoverContent
        restante={Math.max(0, total - used)}
        total={total}
        used={used}
        pct={pct}
        color={color}
      />
    </Popover>
  )
}

/** Quanto custa cada ação, na mesma moeda do badge. Fonte: lib/tokens.ts. */
const TABELA_CUSTOS: { acao: string; custo: string }[] = [
  { acao: "Post único (texto + arte)", custo: `${TOKEN_COST.singlePostText + TOKEN_COST.singlePostImage}` },
  { acao: "Carrossel: roteiro + legenda", custo: `${TOKEN_COST.textOnly}` },
  { acao: "Imagem de capa", custo: `${TOKEN_COST.imageCover}` },
  { acao: "Imagem de slide do miolo", custo: `${TOKEN_COST.imageSlide} cada` },
  { acao: "Editar o que já foi gerado", custo: "grátis" },
]

/**
 * Conteúdo do popover de saldo: quanto sobrou, o que consome e o caminho do
 * upgrade. A tabela existe porque o usuário só aprende o preço quando ele fica
 * visível ANTES de gastar — e a linha "editar = grátis" é o nosso argumento
 * central contra o concorrente, que cobra crédito por correção.
 */
function SaldoPopoverContent({
  restante,
  total,
  used,
  pct,
  color,
  extras = 0,
}: {
  restante: number
  total: number
  used: number
  pct: number
  color: string
  /** Avulsos + bônus de indicação (não vencem). */
  extras?: number
}) {
  return (
    <PopoverContent align="end" className="w-72 p-0">
      <div className="p-3.5 pb-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
          Seus tokens
        </p>
        <p className="mt-1.5 text-2xl font-bold tabular-nums text-text-primary">
          {restante.toLocaleString("pt-BR")}
          <span className="ml-1.5 text-xs font-normal text-text-muted">
            de {total.toLocaleString("pt-BR")} restantes
          </span>
        </p>
        <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <span
            className="block h-full rounded-full"
            style={{ width: `${pct}%`, background: color }}
          />
        </span>
        <p className="mt-1.5 text-[11px] text-text-muted">
          {used.toLocaleString("pt-BR")} usados neste mês
          {extras > 0 && (
            <>
              {" · "}
              <span className="text-text-secondary">
                +{extras.toLocaleString("pt-BR")} avulsos/bônus (não vencem)
              </span>
            </>
          )}
        </p>
      </div>

      <div className="border-t border-border-subtle px-3.5 py-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
          Quanto custa
        </p>
        <ul className="space-y-1.5">
          {TABELA_CUSTOS.map((l) => (
            <li key={l.acao} className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-text-secondary">{l.acao}</span>
              <span
                className={`shrink-0 font-mono text-xs tabular-nums ${
                  l.custo === "grátis" ? "text-success" : "text-text-primary"
                }`}
              >
                {l.custo}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border-subtle p-3.5 pt-3">
        <Link
          href="/dashboard/tokens"
          className="flex h-9 w-full items-center justify-center rounded-lg bg-brand-600 text-xs font-semibold text-white transition-colors hover:bg-brand-500"
        >
          Ver extrato e planos
        </Link>
      </div>
    </PopoverContent>
  )
}
