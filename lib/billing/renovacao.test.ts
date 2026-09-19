import { beforeEach, describe, expect, it, vi } from "vitest"

// =====================================================================
// O JOB DIÁRIO DE RENOVAÇÃO, testado onde ele decide dinheiro.
//
// Contexto (19/09/2026): o primeiro cliente pagou um ano adiantado numa
// assinatura montada à mão, fora do provedor. A conta nasceu sem data de
// renovação, o job nunca a enxergou, e ele ficou dois meses sem ficha. E
// preencher só a data PIORAVA: o único ramo que creditava exigia assinatura
// viva no provedor, então a conta caía no ramo de baixo e era REBAIXADA.
//
// Estes testes fixam as quatro coisas que não podem voltar a acontecer:
//   1. pré-pago recarrega todo mês, sozinho, sem provedor;
//   2. rodar duas vezes não credita duas vezes;
//   3. quem já existe (provedor mensal, trial) não sente diferença nenhuma;
//   4. no fim do período pago a conta ENCERRA em vez de ser destruída.
//
// O banco é falso, mas a trava que importa é real: o `grant_tokens` daqui
// reproduz a mesma regra de idempotência do de verdade (migration 0020),
// que recusa a segunda concessão com o mesmo (user_id, kind, ref_id).
// =====================================================================

// ---------------------------------------------------------------------
// Banco falso
// ---------------------------------------------------------------------
type Linha = Record<string, unknown>

class FakeDb {
  users = new Map<string, Linha>()
  token_transactions: Linha[] = []
  subscriptions: Linha[] = []
  /** Toda escrita que passou por aqui, pra afirmar o que NÃO foi tocado. */
  updates: { table: string; patch: Linha; id: unknown }[] = []

  addUser(u: Linha) {
    this.users.set(u.id as string, {
      credits: 0,
      topup_credits: 0,
      referral_credits: 0,
      plan_credits_monthly: 0,
      plan_credits_used_this_month: 0,
      plan_prepaid_until: null,
      billing_subscription_id: null,
      past_due_since: null,
      ...u,
    })
    return this
  }
  user(id: string) {
    return this.users.get(id)!
  }
}

/** Query encadeável e "thenável", igual ao supabase-js no uso que o job faz. */
class Q {
  private filtros: ((r: Linha) => boolean)[] = []
  private contar = false
  constructor(
    private db: FakeDb,
    private table: string,
    private op: "select" | "update",
    private patch: Linha = {},
  ) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (opts?.count) this.contar = true
    return this
  }
  eq(col: string, val: unknown) {
    this.filtros.push((r) => r[col] === val)
    return this
  }
  in(col: string, vals: unknown[]) {
    this.filtros.push((r) => vals.includes(r[col]))
    return this
  }
  not(col: string, _op: string, _val: unknown) {
    this.filtros.push((r) => r[col] !== null && r[col] !== undefined)
    return this
  }
  lt(col: string, val: string) {
    this.filtros.push((r) => r[col] !== null && String(r[col]) < val)
    return this
  }
  gte(col: string, val: string) {
    this.filtros.push((r) => r[col] !== null && String(r[col]) >= val)
    return this
  }
  order() {
    return this
  }
  limit() {
    return this
  }

  private linhas(): Linha[] {
    const base =
      this.table === "users"
        ? [...this.db.users.values()]
        : ((this.db as unknown as Record<string, Linha[]>)[this.table] ?? [])
    return base.filter((r) => this.filtros.every((f) => f(r)))
  }

  private executar() {
    if (this.op === "update") {
      const alvos = this.linhas()
      for (const r of alvos) {
        Object.assign(r, this.patch)
        this.db.updates.push({ table: this.table, patch: this.patch, id: r.id })
      }
      return { data: alvos, error: null }
    }
    const rows = this.linhas()
    if (this.contar) return { count: rows.length, data: null, error: null }
    return { data: rows, error: null }
  }

  async maybeSingle() {
    const r = this.executar()
    return { data: (r.data as Linha[] | null)?.[0] ?? null, error: null }
  }
  async single() {
    return this.maybeSingle()
  }
  then(resolve: (v: unknown) => void) {
    resolve(this.executar())
  }
}

function fakeClient(db: FakeDb) {
  return {
    from(table: string) {
      return {
        select: (cols?: string, opts?: { count?: string; head?: boolean }) =>
          new Q(db, table, "select").select(cols, opts),
        update: (patch: Linha) => new Q(db, table, "update", patch),
      }
    },

    async rpc(fn: string, p: Record<string, unknown>) {
      const uid = p.p_user_id as string
      const u = db.users.get(uid)
      if (!u) return { data: { ok: false, error: "usuario_inexistente" }, error: null }

      if (fn === "grant_tokens") {
        // A TRAVA REAL (migration 0020): mesma referência não credita de novo.
        const ref = p.p_ref_id as string | null
        if (
          ref &&
          db.token_transactions.some(
            (t) => t.user_id === uid && t.kind === p.p_kind && t.ref_id === ref,
          )
        ) {
          return { data: { ok: true, duplicate: true }, error: null }
        }
        const amount = p.p_amount as number
        if (p.p_bucket === "plan") {
          const sobra = Math.max(0, (u.credits as number) ?? 0)
          if (sobra > 0) {
            db.token_transactions.push({
              user_id: uid, kind: "expire_plan", delta: -sobra, ref_id: ref,
              title: "Sobra do plano zerada na renovação", created_at: new Date().toISOString(),
            })
          }
          u.credits = amount
          u.plan_credits_monthly = amount
          u.plan_credits_used_this_month = 0
        }
        db.token_transactions.push({
          user_id: uid, kind: p.p_kind, delta: amount, ref_id: ref,
          title: p.p_title, created_at: new Date().toISOString(),
        })
        return { data: { ok: true }, error: null }
      }

      if (fn === "apply_tokens") {
        const amount = p.p_amount as number
        u.credits = Math.max(0, ((u.credits as number) ?? 0) - amount)
        db.token_transactions.push({
          user_id: uid, kind: p.p_kind, delta: -amount, ref_id: p.p_ref_id,
          title: p.p_title, created_at: new Date().toISOString(),
        })
        return { data: { ok: true }, error: null }
      }
      return { data: null, error: { message: `rpc desconhecida: ${fn}` } }
    },
  }
}

// ---------------------------------------------------------------------
// Mocks dos dois únicos pontos de saída do módulo
// ---------------------------------------------------------------------
let db: FakeDb
let assinaturaNoProvedor: {
  id: string
  customerId: string
  status: string
  cycle: string | null
  value: number | null
  nextDueDate: string | null
  externalReference: string | null
} | null = null

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => fakeClient(db),
}))
vi.mock("./index", () => ({
  getBilling: () => ({
    name: "asaas",
    getSubscription: async () => assinaturaNoProvedor,
  }),
}))

// `vi.mock` é içado acima dos imports pelo transform do Vitest, então o
// import estático abaixo já enxerga os dois mocks acima.
import { datasDoPagamento, runRenewalSweep } from "./apply"

const REINALDO = "d010fdc2-a207-4c33-8e0a-dad1c7e68d78"
const d = (s: string) => new Date(s)

beforeEach(() => {
  db = new FakeDb()
  assinaturaNoProvedor = null
})

/** A conta do primeiro cliente, já dentro das regras (o que a Fase 3 vai gravar). */
function contaPrePaga(over: Linha = {}) {
  return {
    id: REINALDO,
    subscription_status: "active",
    plan_id: "pro",
    plan_cycle: "annual",
    plan_renews_at: "2026-09-09T00:00:00.000Z",
    plan_prepaid_until: "2027-07-09T00:00:00.000Z",
    billing_subscription_id: null,
    credits: 0,
    ...over,
  }
}

// =====================================================================
describe("pré-pago: o robô passa a enxergar e cuidar sozinho", () => {
  it("credita o ciclo vencido e empurra a renovação um mês", async () => {
    db.addUser(contaPrePaga())

    const out = await runRenewalSweep({ now: d("2026-09-19T06:00:00Z") })

    expect(out.checked).toBe(1)
    expect(out.granted).toBe(1)
    expect(db.user(REINALDO).credits).toBe(1000)
    expect(db.user(REINALDO).plan_renews_at).toBe("2026-10-09T00:00:00.000Z")
    // Creditou pela porta de dentro: virou linha no extrato.
    expect(db.token_transactions.filter((t) => t.kind === "grant_plan")).toHaveLength(1)
  })

  it("NÃO credita os meses atrasados: um ciclo por vez, o resto é decisão de dono", async () => {
    // Vencimento de agosto, dois ciclos atrás.
    db.addUser(contaPrePaga({ plan_renews_at: "2026-08-09T00:00:00.000Z" }))

    const out = await runRenewalSweep({ now: d("2026-09-19T06:00:00Z") })

    expect(out.granted).toBe(1)
    expect(db.user(REINALDO).credits).toBe(1000) // 1000, não 2000
    // Pulou direto pro próximo vencimento no futuro, sem passear pelo passado.
    expect(db.user(REINALDO).plan_renews_at).toBe("2026-10-09T00:00:00.000Z")
  })

  it("sem provedor nenhum consultado: a conta não depende do Asaas pra viver", async () => {
    db.addUser(contaPrePaga())
    assinaturaNoProvedor = null // se fosse consultado, o ramo do provedor não acharia nada

    const out = await runRenewalSweep({ now: d("2026-09-19T06:00:00Z") })

    expect(out.granted).toBe(1)
    expect(out.downgraded).toBe(0)
    expect(out.closed).toBe(0)
    // O que quebrou a conta em produção: virar past_due e perder o plano.
    expect(db.user(REINALDO).subscription_status).toBe("active")
    expect(db.user(REINALDO).plan_id).toBe("pro")
    expect(db.user(REINALDO).plan_credits_monthly).toBe(1000)
  })
})

// =====================================================================
describe("idempotência: rodar duas vezes não credita duas vezes", () => {
  it("segunda chamada no mesmo dia não credita nada", async () => {
    db.addUser(contaPrePaga())

    const um = await runRenewalSweep({ now: d("2026-09-19T06:00:00Z") })
    const dois = await runRenewalSweep({ now: d("2026-09-19T06:05:00Z") })

    expect(um.granted).toBe(1)
    expect(dois.granted).toBe(0)
    // Nem foi selecionada: a primeira passada já empurrou a data pro futuro.
    expect(dois.checked).toBe(0)
    expect(db.user(REINALDO).credits).toBe(1000)
  })

  it("mesmo se a data NÃO tiver avançado, a trava do extrato segura", async () => {
    // Simula o pior caso: o grant passou e o update da data falhou. Sem a
    // trava por ref_id, a próxima passada creditaria o mesmo ciclo de novo.
    db.addUser(contaPrePaga())
    await runRenewalSweep({ now: d("2026-09-19T06:00:00Z") })
    db.user(REINALDO).plan_renews_at = "2026-09-09T00:00:00.000Z" // volta atrás
    db.user(REINALDO).credits = 250 // e ele já gastou um pedaço

    const dois = await runRenewalSweep({ now: d("2026-09-19T07:00:00Z") })

    expect(dois.checked).toBe(1) // foi selecionada
    expect(dois.granted).toBe(0) // e mesmo assim não creditou
    expect(db.user(REINALDO).credits).toBe(250) // saldo intocado
    expect(db.token_transactions.filter((t) => t.kind === "grant_plan")).toHaveLength(1)
  })

  it("um ano inteiro de execuções diárias credita exatamente 10 vezes", async () => {
    db.addUser(contaPrePaga())
    // Roda o job TODO DIA, de hoje até depois do fim do ano pago.
    for (let t = d("2026-09-19T06:00:00Z"); t <= d("2027-07-20T06:00:00Z"); ) {
      await runRenewalSweep({ now: new Date(t) })
      t = new Date(t.getTime() + 24 * 60 * 60 * 1000)
    }
    // Set/out/nov/dez + jan..jun = 10 recargas. Julho/26 foi a manual e
    // agosto/26 é a decisão retroativa que ficou com o Marcos.
    expect(db.token_transactions.filter((t) => t.kind === "grant_plan")).toHaveLength(10)
  })
})

// =====================================================================
describe("não quebra quem já existe", () => {
  it("assinatura viva no Asaas, ciclo mensal: renova exatamente como antes", async () => {
    db.addUser({
      id: "aaaaaaaa-0000-4000-8000-000000000001",
      subscription_status: "active",
      plan_id: "pro",
      plan_cycle: "monthly",
      plan_renews_at: "2026-09-15T00:00:00.000Z",
      billing_subscription_id: "sub_asaas_123",
      credits: 40,
    })
    assinaturaNoProvedor = {
      id: "sub_asaas_123", customerId: "cus_1", status: "active", cycle: "monthly",
      value: 97, nextDueDate: "2026-10-15T00:00:00.000Z", externalReference: null,
    }

    const out = await runRenewalSweep({ now: d("2026-09-19T06:00:00Z") })
    const u = db.user("aaaaaaaa-0000-4000-8000-000000000001")

    expect(out.granted).toBe(1)
    expect(u.credits).toBe(1000)
    expect(u.subscription_status).toBe("active")
    // O COMPORTAMENTO DE ANTES: a data vira o vencimento do provedor, tal e qual.
    expect(u.plan_renews_at).toBe("2026-10-15T00:00:00.000Z")
    // E no mensal o fim do pago é o mesmo dia, então o ramo pré-pago
    // nunca dispara pra essa conta.
    expect(u.plan_prepaid_until).toBe("2026-10-15T00:00:00.000Z")
  })

  it("conta em trial não recebe nada e não é tocada", async () => {
    db.addUser({
      id: "bbbbbbbb-0000-4000-8000-000000000002",
      subscription_status: "trial",
      plan_id: null,
      plan_cycle: null,
      plan_renews_at: null,
      credits: 45,
    })

    const out = await runRenewalSweep({ now: d("2026-09-19T06:00:00Z") })

    expect(out).toEqual({ checked: 0, granted: 0, closed: 0, downgraded: 0 })
    expect(db.updates).toHaveLength(0)
    expect(db.user("bbbbbbbb-0000-4000-8000-000000000002").credits).toBe(45)
    expect(db.token_transactions).toHaveLength(0)
  })

  it("conta sem plano definido continua sendo pulada", async () => {
    db.addUser({
      id: "cccccccc-0000-4000-8000-000000000003",
      subscription_status: "active",
      plan_id: null,
      plan_cycle: null,
      plan_renews_at: "2026-08-01T00:00:00.000Z",
      credits: 10,
    })

    const out = await runRenewalSweep({ now: d("2026-09-19T06:00:00Z") })

    expect(out.checked).toBe(1)
    expect(out.granted).toBe(0)
    expect(db.updates).toHaveLength(0)
  })

  it("assinatura cancelada no provedor continua sendo rebaixada", async () => {
    db.addUser({
      id: "dddddddd-0000-4000-8000-000000000004",
      subscription_status: "active",
      plan_id: "pro",
      plan_cycle: "monthly",
      plan_renews_at: "2026-08-01T00:00:00.000Z",
      billing_subscription_id: "sub_morta",
      credits: 300,
    })
    assinaturaNoProvedor = {
      id: "sub_morta", customerId: "cus_2", status: "expired", cycle: "monthly",
      value: 97, nextDueDate: null, externalReference: null,
    }

    const out = await runRenewalSweep({ now: d("2026-09-19T06:00:00Z") })

    expect(out.closed).toBe(1)
    expect(db.user("dddddddd-0000-4000-8000-000000000004").subscription_status).toBe("canceled")
  })
})

// =====================================================================
describe("as três datas que o dono pediu", () => {
  it("09/10/2026: recarrega e marca a próxima pra 09/11", async () => {
    db.addUser(contaPrePaga({ plan_renews_at: "2026-10-09T00:00:00.000Z" }))
    const out = await runRenewalSweep({ now: d("2026-10-09T06:00:00Z") })
    expect(out.granted).toBe(1)
    expect(db.user(REINALDO).credits).toBe(1000)
    expect(db.user(REINALDO).plan_renews_at).toBe("2026-11-09T00:00:00.000Z")
  })

  it("09/11/2026: recarrega de novo, zerando a sobra com linha no extrato", async () => {
    db.addUser(contaPrePaga({ plan_renews_at: "2026-11-09T00:00:00.000Z", credits: 120 }))
    const out = await runRenewalSweep({ now: d("2026-11-09T06:00:00Z") })
    expect(out.granted).toBe(1)
    expect(db.user(REINALDO).credits).toBe(1000)
    expect(db.user(REINALDO).plan_renews_at).toBe("2026-12-09T00:00:00.000Z")
    // A sobra de 120 não sumiu: virou linha.
    expect(db.token_transactions.some((t) => t.kind === "expire_plan" && t.delta === -120)).toBe(true)
  })

  it("10/07/2027, o dia seguinte ao fim do ano pago: encerra sem destruir", async () => {
    db.addUser(
      contaPrePaga({ plan_renews_at: "2027-07-09T00:00:00.000Z", credits: 300 }),
    )
    // Histórico anterior que NÃO pode ser tocado.
    db.token_transactions.push({ user_id: REINALDO, kind: "grant_plan", delta: 1000, ref_id: "antigo" })
    const antes = db.token_transactions.length

    const out = await runRenewalSweep({ now: d("2027-07-10T06:00:00Z") })
    const u = db.user(REINALDO)

    expect(out.closed).toBe(1)
    expect(out.granted).toBe(0)
    // Para de renovar e vira trial...
    expect(u.subscription_status).toBe("trial")
    expect(u.plan_renews_at).toBe(null)
    expect(u.plan_prepaid_until).toBe(null)
    expect(u.plan_id).toBe(null)
    // ...sem apagar o extrato: as linhas antigas continuam lá, e o
    // encerramento ENTRA como linha nova em vez de sumir com o saldo.
    expect(db.token_transactions.length).toBe(antes + 1)
    expect(db.token_transactions.some((t) => t.kind === "strip_plan")).toBe(true)
    expect(db.token_transactions.some((t) => t.ref_id === "antigo")).toBe(true)
  })

  it("não encerra um dia antes: 08/07/2027 ainda é período pago", async () => {
    db.addUser(contaPrePaga({ plan_renews_at: "2027-06-09T00:00:00.000Z" }))
    const out = await runRenewalSweep({ now: d("2027-07-08T06:00:00Z") })
    expect(out.closed).toBe(0)
    expect(out.granted).toBe(1)
    expect(db.user(REINALDO).subscription_status).toBe("active")
  })
})

// =====================================================================
describe("uma conta só", () => {
  it("roda apenas na conta pedida e não encosta nas outras", async () => {
    db.addUser(contaPrePaga())
    db.addUser({
      id: "eeeeeeee-0000-4000-8000-000000000005",
      subscription_status: "active",
      plan_id: "studio",
      plan_cycle: "annual",
      plan_renews_at: "2026-09-01T00:00:00.000Z",
      plan_prepaid_until: "2027-01-01T00:00:00.000Z",
      credits: 500,
    })

    const out = await runRenewalSweep({ userId: REINALDO, now: d("2026-09-19T06:00:00Z") })

    expect(out.checked).toBe(1)
    expect(out.granted).toBe(1)
    expect(db.user(REINALDO).credits).toBe(1000)
    // A outra conta, que TAMBÉM estava vencida, não foi tocada.
    expect(db.user("eeeeeeee-0000-4000-8000-000000000005").credits).toBe(500)
    expect(db.updates.every((u) => u.id === REINALDO)).toBe(true)
  })
})

// =====================================================================
describe("cadência do pagamento: anual recarrega todo mês", () => {
  it("mensal: fim do pago e próxima recarga são o mesmo dia (nada mudou)", () => {
    const { periodEnd, renewsAt } = datasDoPagamento(d("2026-09-19T00:00:00Z"), "monthly")
    expect(renewsAt.toISOString()).toBe(periodEnd.toISOString())
    expect(renewsAt.toISOString()).toBe("2026-10-19T00:00:00.000Z")
  })

  it("anual: paga 12 meses, mas a próxima recarga é daqui a um mês", () => {
    const { periodEnd, renewsAt } = datasDoPagamento(d("2026-09-19T00:00:00Z"), "annual")
    expect(periodEnd.toISOString()).toBe("2027-09-19T00:00:00.000Z")
    expect(renewsAt.toISOString()).toBe("2026-10-19T00:00:00.000Z")
  })

  it("anual no provedor: o job não joga a recarga pra daqui a um ano", async () => {
    db.addUser({
      id: "ffffffff-0000-4000-8000-000000000006",
      subscription_status: "active",
      plan_id: "pro",
      plan_cycle: "annual",
      plan_renews_at: "2026-09-19T00:00:00.000Z",
      plan_prepaid_until: null, // conta antiga, de antes da 0031
      billing_subscription_id: "sub_anual",
      credits: 0,
    })
    assinaturaNoProvedor = {
      id: "sub_anual", customerId: "cus_3", status: "active", cycle: "annual",
      value: 816, nextDueDate: "2027-09-19T00:00:00.000Z", externalReference: null,
    }

    await runRenewalSweep({ now: d("2026-09-20T06:00:00Z") })
    const u = db.user("ffffffff-0000-4000-8000-000000000006")

    expect(u.credits).toBe(1000)
    // A próxima recarga é em um mês, não em 2027.
    expect(u.plan_renews_at).toBe("2026-10-19T00:00:00.000Z")
    // E o fim do pago é que fica lá na frente.
    expect(u.plan_prepaid_until).toBe("2027-09-19T00:00:00.000Z")
  })
})
