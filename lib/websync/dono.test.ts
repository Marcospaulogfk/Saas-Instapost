import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  clientesDaPonte,
  conferirSegredo,
  conferirSegredoDoDono,
  resolverDono,
} from "./dono"

// =====================================================================
// A PORTA DA PONTE.
//
// Este arquivo existe porque `dono.ts` é fronteira de segurança: é o que
// separa "o CRM do Marcos" de "o CRM de um cliente", e um erro aqui não
// dá tela vermelha, dá brand de cliente aparecendo no lugar errado.
//
// O caso que mais importa é o de baixo, o primeiro do arquivo: com o
// segredo antigo, o WebSync-OS tem que continuar entrando exatamente como
// entrava antes de a ponte virar multi-cliente.
// =====================================================================

const SEGREDO_WEBSYNC = "segredo-de-sempre-do-websync-os-com-folga"
const SEGREDO_CULTURIZE = "segredo-do-culturizese-com-mais-de-32-chars"
const OWNER_REINALDO = "d010fdc2-a207-4c33-8e0a-dad1c7e68d78"
const OWNER_MARCOS = "11111111-1111-1111-1111-111111111111"
const OWNER_TERCEIRO = "22222222-2222-2222-2222-222222222222"

function pedido(segredo?: string): Request {
  return new Request("https://nexus.local/api/webhooks/websync-os", {
    headers: segredo === undefined ? {} : { "x-websync-secret": segredo },
  })
}

/** WEBSYNC_CLIENTES_JSON com o Culturize-se dentro, do jeito que vai pro deploy. */
function jsonComCulturize(): string {
  return JSON.stringify({
    [SEGREDO_CULTURIZE]: { nome: "Culturize-se", owner_id: OWNER_REINALDO },
  })
}

const ambienteOriginal = { ...process.env }

beforeEach(() => {
  // O módulo tem cache de leitura do JSON, mas a chave dele é o próprio
  // texto da variável: trocar a variável entre testes já invalida sozinho.
  delete process.env.WEBSYNC_WEBHOOK_SECRET
  delete process.env.WEBSYNC_CLIENTES_JSON
  delete process.env.WEBSYNC_BRAND_OWNER_ID
  // O código loga bastante de propósito; aqui só atrapalharia a leitura.
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(console, "warn").mockImplementation(() => {})
  vi.spyOn(console, "log").mockImplementation(() => {})
})

afterEach(() => {
  process.env = { ...ambienteOriginal }
  vi.restoreAllMocks()
})

describe("o segredo de sempre, do WebSync-OS", () => {
  it("entra e não é de cliente nenhum", () => {
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC

    const r = conferirSegredo(pedido(SEGREDO_WEBSYNC))

    expect(r.ok).toBe(true)
    // `cliente: null` é o que faz o resto do código seguir pelo caminho antigo.
    expect(r).toEqual({ ok: true, cliente: null })
  })

  it("continua entrando depois de o Culturize-se ser somado ao ambiente", () => {
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC
    process.env.WEBSYNC_CLIENTES_JSON = jsonComCulturize()

    const r = conferirSegredo(pedido(SEGREDO_WEBSYNC))

    expect(r).toEqual({ ok: true, cliente: null })
  })

  it("cai no dono de sempre, o da variável de ambiente", async () => {
    process.env.WEBSYNC_BRAND_OWNER_ID = OWNER_MARCOS

    const dono = await resolverDono(bancoQueNuncaDeviaSerLido(), null)

    expect(dono).toEqual({ ok: true, ownerId: OWNER_MARCOS })
  })
})

describe("o segredo de um cliente", () => {
  it("devolve o cliente e o dono dele", () => {
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC
    process.env.WEBSYNC_CLIENTES_JSON = jsonComCulturize()

    const r = conferirSegredo(pedido(SEGREDO_CULTURIZE))

    expect(r).toEqual({
      ok: true,
      cliente: { nome: "Culturize-se", ownerId: OWNER_REINALDO },
    })
  })

  it("resolve o dono sem olhar o ambiente nem o banco", async () => {
    // Mesmo com a variável apontando pro Marcos, quem mandou o segredo do
    // Culturize-se enxerga o Reinaldo. É a regra de ouro do arquivo.
    process.env.WEBSYNC_BRAND_OWNER_ID = OWNER_MARCOS

    const dono = await resolverDono(bancoQueNuncaDeviaSerLido(), {
      nome: "Culturize-se",
      ownerId: OWNER_REINALDO,
    })

    expect(dono).toEqual({ ok: true, ownerId: OWNER_REINALDO })
  })

  it("funciona mesmo sendo o único segredo configurado", () => {
    // Cenário do deploy onde só existe cliente, sem o segredo antigo.
    process.env.WEBSYNC_CLIENTES_JSON = jsonComCulturize()

    const r = conferirSegredo(pedido(SEGREDO_CULTURIZE))

    expect(r.ok).toBe(true)
  })
})

describe("quem não entra", () => {
  it("segredo errado dá 401", () => {
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC
    process.env.WEBSYNC_CLIENTES_JSON = jsonComCulturize()

    const r = conferirSegredo(pedido("nao-sou-nenhum-dos-dois-mas-tenho-32-chars"))

    expect(r).toEqual({ ok: false, status: 401, erro: "não autorizado" })
  })

  it("pedido sem o header dá 401", () => {
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC

    expect(conferirSegredo(pedido())).toEqual({
      ok: false,
      status: 401,
      erro: "não autorizado",
    })
  })

  it("header vazio ou só espaço dá 401, não passa como segredo vazio", () => {
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC

    expect(conferirSegredo(pedido("   ")).ok).toBe(false)
    expect(conferirSegredo(pedido("")).ok).toBe(false)
  })

  it("nada configurado no ambiente dá 503, e não 401", () => {
    // A diferença importa pra quem for depurar o deploy: 503 é "faltou
    // variável no painel", 401 é "o segredo que chegou está errado".
    const r = conferirSegredo(pedido(SEGREDO_WEBSYNC))

    expect(r).toEqual({ ok: false, status: 503, erro: "webhook não configurado" })
  })

  it("um cliente não vira o outro: segredo de um não devolve o dono do outro", () => {
    const OUTRO = "segredo-do-studio-ideacao-com-32-caracteres"
    process.env.WEBSYNC_CLIENTES_JSON = JSON.stringify({
      [SEGREDO_CULTURIZE]: { nome: "Culturize-se", owner_id: OWNER_REINALDO },
      [OUTRO]: { nome: "Studio Ideação", owner_id: OWNER_TERCEIRO },
    })

    const r = conferirSegredo(pedido(OUTRO))

    expect(r).toEqual({
      ok: true,
      cliente: { nome: "Studio Ideação", ownerId: OWNER_TERCEIRO },
    })
  })
})

describe("variável mal colada no painel do deploy", () => {
  it("JSON inválido não derruba a ponte e o segredo antigo continua valendo", () => {
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC
    process.env.WEBSYNC_CLIENTES_JSON = "{isto não é json"

    // O que não pode acontecer: o WebSync-OS sair do ar por causa de uma
    // variável de OUTRO cliente colada errada.
    expect(conferirSegredo(pedido(SEGREDO_WEBSYNC))).toEqual({ ok: true, cliente: null })
    expect(clientesDaPonte().size).toBe(0)
  })

  it("JSON que não é objeto (lista) também é ignorado sem derrubar", () => {
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC
    process.env.WEBSYNC_CLIENTES_JSON = JSON.stringify([SEGREDO_CULTURIZE])

    expect(conferirSegredo(pedido(SEGREDO_WEBSYNC)).ok).toBe(true)
    expect(clientesDaPonte().size).toBe(0)
  })

  it("segredo com menos de 32 caracteres é ignorado e não entra", () => {
    const CURTO = "123456"
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC
    process.env.WEBSYNC_CLIENTES_JSON = JSON.stringify({
      [CURTO]: { nome: "Preguiçoso", owner_id: OWNER_REINALDO },
    })

    expect(clientesDaPonte().size).toBe(0)
    expect(conferirSegredo(pedido(CURTO))).toEqual({
      ok: false,
      status: 401,
      erro: "não autorizado",
    })
  })

  it("cliente sem owner_id é ignorado, mas os vizinhos válidos continuam valendo", () => {
    process.env.WEBSYNC_CLIENTES_JSON = JSON.stringify({
      "segredo-de-um-cliente-mal-cadastrado-aqui": { nome: "Sem dono" },
      [SEGREDO_CULTURIZE]: { nome: "Culturize-se", owner_id: OWNER_REINALDO },
    })

    const clientes = clientesDaPonte()

    expect(clientes.size).toBe(1)
    expect(clientes.get(SEGREDO_CULTURIZE)?.ownerId).toBe(OWNER_REINALDO)
  })

  it("relê a variável quando ela muda, sem sobrar cache velho", () => {
    process.env.WEBSYNC_CLIENTES_JSON = jsonComCulturize()
    expect(clientesDaPonte().size).toBe(1)

    // Cliente removido do painel: não pode continuar entrando por cache.
    process.env.WEBSYNC_CLIENTES_JSON = "{}"
    expect(clientesDaPonte().size).toBe(0)
  })
})

describe("o dono quando não há cliente nem variável", () => {
  it("com um único dono entre as brands, usa ele", async () => {
    const dono = await resolverDono(bancoComBrandsDe([OWNER_MARCOS, OWNER_MARCOS]), null)

    expect(dono).toEqual({ ok: true, ownerId: OWNER_MARCOS })
  })

  it("com brands de mais de um dono, recusa em vez de adivinhar", async () => {
    const dono = await resolverDono(bancoComBrandsDe([OWNER_MARCOS, OWNER_REINALDO]), null)

    expect(dono.ok).toBe(false)
    // Este é o caso real do projeto: adivinhar aqui misturaria cliente.
    expect(dono.ok === false && dono.motivo).toContain("mais de um dono")
  })

  it("sem brand nenhuma, recusa e explica o que fazer", async () => {
    const dono = await resolverDono(bancoComBrandsDe([]), null)

    expect(dono.ok).toBe(false)
    expect(dono.ok === false && dono.motivo).toContain("WEBSYNC_BRAND_OWNER_ID")
  })

  it("erro do banco vira recusa, não dono errado", async () => {
    const admin = {
      from: () => ({
        select: async () => ({ data: null, error: { message: "conexão caiu" } }),
      }),
    } as unknown as SupabaseClient

    const dono = await resolverDono(admin, null)

    expect(dono.ok).toBe(false)
    expect(dono.ok === false && dono.motivo).toContain("conexão caiu")
  })
})

describe("o segredo antigo manda, sempre", () => {
  it("o mesmo valor nos dois lugares cai no WebSync-OS, não no cliente", () => {
    // A ordem em conferirSegredo é o que garante isto: o segredo de sempre é
    // conferido ANTES do laço dos clientes. Quem inverter os dois blocos
    // rebaixa o WebSync-OS a cliente e passa em todo o resto do arquivo.
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC
    process.env.WEBSYNC_CLIENTES_JSON = JSON.stringify({
      [SEGREDO_WEBSYNC]: { nome: "Impostor", owner_id: OWNER_REINALDO },
    })

    expect(conferirSegredo(pedido(SEGREDO_WEBSYNC))).toEqual({ ok: true, cliente: null })
  })

  it("segredo com espaço em volta continua entrando (decisão do trim)", () => {
    // Fixa a decisão: a comparação é sobre o valor aparado dos dois lados.
    process.env.WEBSYNC_WEBHOOK_SECRET = `  ${SEGREDO_WEBSYNC}  `

    expect(conferirSegredo(pedido(` ${SEGREDO_WEBSYNC} `)).ok).toBe(true)
  })

  it("segredo do mesmo tamanho em JS mas com bytes diferentes não derruba a rota", () => {
    // "á" ocupa 1 caractere em JS e 2 bytes em UTF-8. Se a comparação um dia
    // trocar o tamanho do Buffer pelo .length da string, timingSafeEqual lança
    // e vira 500 alcançável por qualquer um, sem autenticação.
    const comAcento = "áaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    const semAcento = "baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    expect(comAcento.length).toBe(semAcento.length)
    process.env.WEBSYNC_WEBHOOK_SECRET = semAcento

    expect(conferirSegredo(pedido(comAcento))).toEqual({
      ok: false,
      status: 401,
      erro: "não autorizado",
    })
  })
})

describe("um cliente não pode falar pelo dono da ponte", () => {
  it("cliente com o owner_id do ambiente é ignorado na carga", () => {
    process.env.WEBSYNC_BRAND_OWNER_ID = OWNER_MARCOS
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC
    process.env.WEBSYNC_CLIENTES_JSON = JSON.stringify({
      [SEGREDO_CULTURIZE]: { nome: "Espertinho", owner_id: OWNER_MARCOS },
    })

    // Um owner_id colado errado no painel daria a esse cliente as brands do
    // Marcos, em silêncio. Tem que não entrar.
    expect(clientesDaPonte().size).toBe(0)
    expect(conferirSegredo(pedido(SEGREDO_CULTURIZE)).ok).toBe(false)
  })

  it("dois clientes com o mesmo owner_id: só o primeiro entra", () => {
    const OUTRO = "segredo-do-segundo-cliente-com-32-chars"
    process.env.WEBSYNC_CLIENTES_JSON = JSON.stringify({
      [SEGREDO_CULTURIZE]: { nome: "Culturize-se", owner_id: OWNER_REINALDO },
      [OUTRO]: { nome: "Cópia", owner_id: OWNER_REINALDO },
    })

    const clientes = clientesDaPonte()

    expect(clientes.size).toBe(1)
    expect(clientes.has(SEGREDO_CULTURIZE)).toBe(true)
  })

  it("mudar só o dono do ambiente refaz a carga, sem cache velho", () => {
    // A recusa depende das duas variáveis; se a chave do cache fosse só o
    // JSON, o cliente continuaria valendo com o dono novo já colidindo.
    process.env.WEBSYNC_CLIENTES_JSON = jsonComCulturize()
    expect(clientesDaPonte().size).toBe(1)

    process.env.WEBSYNC_BRAND_OWNER_ID = OWNER_REINALDO
    expect(clientesDaPonte().size).toBe(0)
  })

  it("owner_id que não é uuid é ignorado", () => {
    process.env.WEBSYNC_CLIENTES_JSON = JSON.stringify({
      [SEGREDO_CULTURIZE]: { nome: "Torto", owner_id: "conta-do-reinaldo" },
    })

    expect(clientesDaPonte().size).toBe(0)
  })
})

describe("as rotas que devolvem dado global do produto", () => {
  it("aceitam o segredo do WebSync-OS", () => {
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC

    expect(conferirSegredoDoDono(pedido(SEGREDO_WEBSYNC))).toEqual({
      ok: true,
      cliente: null,
    })
  })

  it("recusam segredo de cliente, mesmo sendo um segredo válido", () => {
    // /leads devolve public.users e /seo-pages devolve as páginas do próprio
    // SyncPost: nenhuma das duas é filtrada por dono, então cliente nenhum
    // pode lê-las. Este é o caso que vazaria a base de contas inteira.
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC
    process.env.WEBSYNC_CLIENTES_JSON = jsonComCulturize()

    expect(conferirSegredo(pedido(SEGREDO_CULTURIZE)).ok).toBe(true)
    expect(conferirSegredoDoDono(pedido(SEGREDO_CULTURIZE))).toEqual({
      ok: false,
      status: 401,
      erro: "não autorizado",
    })
  })

  it("repassam o 503 e o 401 de sempre", () => {
    expect(conferirSegredoDoDono(pedido(SEGREDO_WEBSYNC)).ok).toBe(false)
    process.env.WEBSYNC_WEBHOOK_SECRET = SEGREDO_WEBSYNC
    expect(conferirSegredoDoDono(pedido())).toEqual({
      ok: false,
      status: 401,
      erro: "não autorizado",
    })
  })
})

describe("o cache não sai de casa", () => {
  it("mexer no mapa devolvido não contamina a chamada seguinte", () => {
    process.env.WEBSYNC_CLIENTES_JSON = jsonComCulturize()

    clientesDaPonte().delete(SEGREDO_CULTURIZE)

    // Sem a cópia, o cliente sumiria pelo resto da vida da instância: a chave
    // do cache é o texto da variável, e ele não muda.
    expect(clientesDaPonte().has(SEGREDO_CULTURIZE)).toBe(true)
    expect(conferirSegredo(pedido(SEGREDO_CULTURIZE)).ok).toBe(true)
  })
})

/** Um Supabase de mentira que devolve as brands pedidas. */
function bancoComBrandsDe(donos: string[]): SupabaseClient {
  return {
    from: () => ({
      select: async () => ({ data: donos.map((user_id) => ({ user_id })), error: null }),
    }),
  } as unknown as SupabaseClient
}

/** Estoura se alguém consultar o banco: usado onde o dono não depende dele. */
function bancoQueNuncaDeviaSerLido(): SupabaseClient {
  return {
    from: () => {
      throw new Error("resolverDono não devia ter consultado o banco neste caminho")
    },
  } as unknown as SupabaseClient
}
