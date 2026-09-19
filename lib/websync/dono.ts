import { timingSafeEqual } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

// =====================================================================
// QUEM ENTRA NA PONTE, E DE QUEM SÃO AS BRANDS QUE ELE ENXERGA.
//
// Isto existe por um motivo concreto, descoberto em 12/08/2026: este
// projeto do Supabase tem brands de MAIS DE UMA PESSOA. Além das do
// Marcos, há brands de clientes (Culturize-se, e uma segunda conta com
// Studio Ideação). Com a service_role, uma consulta sem filtro devolve
// TODAS.
//
// Se o CRM enxergasse todas, duas coisas ruins ficariam a um clique de
// distância: o seletor da tela de Marcas mostraria a brand de um cliente,
// e um post do Marcos poderia cair no calendário editorial de outra
// empresa. Nenhuma das duas dá erro na hora, e é isso que as torna
// perigosas.
//
// Por isso TODA rota da integração passa por aqui, inclusive a que só lê.
//
// UM SEGREDO POR CLIENTE (09/09/2026)
// -----------------------------------
// Até aqui a ponte tinha um segredo só e um dono só, fixado em
// WEBSYNC_BRAND_OWNER_ID. Isso bastava enquanto o único CRM do outro lado
// era o WebSync-OS, do Marcos. Com o CRM do Culturize-se entrando, o dono
// das brands dele é o Reinaldo, e um dono fixo no ambiente não dá conta.
//
// A saída: o próprio segredo diz de quem ele fala.
//
//   WEBSYNC_CLIENTES_JSON = {
//     "<segredo do cliente>": { "nome": "Culturize-se", "owner_id": "<uuid>" }
//   }
//
// O segredo antigo (WEBSYNC_WEBHOOK_SECRET) continua valendo e continua
// caindo no dono de sempre: para o WebSync-OS nada muda, nem no código
// nem no ambiente.
//
// A regra de ouro: o dono vem SEMPRE do segredo que chegou, nunca do
// corpo do pedido. Cliente nenhum consegue pedir para ver a brand de
// outro, porque não existe campo onde ele diga isso.
// =====================================================================

const SECRET_HEADER = "x-websync-secret"

/**
 * Segredo mais curto que isto não entra: é senha de brincadeira.
 *
 * Vale só para segredo NOVO, de cliente. O antigo é lido, não escrito: impor
 * o piso nele seria a única mudança desta branch capaz de derrubar o
 * WebSync-OS no deploy — se o segredo em uso tiver 28 caracteres, a ponte
 * inteira viraria 503 no momento em que isto subisse. Lá o aviso é só aviso.
 *
 * E é checagem de FORMA, não de força: "aaaa...32" passa.
 */
const MINIMO_DO_SEGREDO = 32

/** owner_id torto vira erro de sintaxe do Postgres lá na frente; barrar aqui dá mensagem. */
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface ClienteDaPonte {
  nome: string
  ownerId: string
}

export type ResolucaoDono =
  | { ok: true; ownerId: string }
  | { ok: false; motivo: string }

export type ResultadoSegredo =
  | { ok: true; cliente: ClienteDaPonte | null }
  | { ok: false; status: number; erro: string }

/** Comparação de tempo fixo: sem ela, o tempo de resposta entrega o segredo aos poucos. */
function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  if (x.length !== y.length) return false
  return timingSafeEqual(x, y)
}

// Releitura barata: o valor cru vira mapa uma vez só, mas se a variável
// mudar (dev com hot reload, redeploy) o cache cai sozinho, porque a chave
// dele é o próprio texto da variável.
let cacheBruto: string | null = null
let cacheMapa: Map<string, ClienteDaPonte> = new Map()

/**
 * Os clientes declarados em WEBSYNC_CLIENTES_JSON, indexados pelo segredo.
 *
 * JSON inválido não derruba a ponte: vira mapa vazio com erro no log, e o
 * segredo antigo continua funcionando. Uma variável mal colada no painel
 * do deploy não pode tirar o WebSync-OS do ar.
 *
 * Devolve CÓPIA. Entregar o mapa do cache deixava quem chama capaz de
 * apagar um cliente de dentro dele; como a chave do cache é o texto da
 * variável, e esse texto não muda, o estrago valeria pelo resto da vida da
 * instância.
 */
export function clientesDaPonte(): Map<string, ClienteDaPonte> {
  return new Map(mapaVivo())
}

function mapaVivo(): Map<string, ClienteDaPonte> {
  const json = (process.env.WEBSYNC_CLIENTES_JSON ?? "").trim()
  const donoDoAmbiente = (process.env.WEBSYNC_BRAND_OWNER_ID ?? "").trim()
  // As DUAS variáveis entram na chave: a carga recusa cliente que tenha o dono
  // do ambiente, então mudar só o dono e manter o JSON precisa reconstruir o
  // mapa. Com a chave só no JSON, a recusa ficaria decidida pelo valor antigo.
  const bruto = JSON.stringify([donoDoAmbiente, json])
  if (bruto === cacheBruto) return cacheMapa
  cacheBruto = bruto
  cacheMapa = new Map()
  if (!json) return cacheMapa

  try {
    const cru = JSON.parse(json) as Record<string, unknown>
    if (!cru || typeof cru !== "object" || Array.isArray(cru)) {
      throw new Error("esperado um objeto { segredo: { nome, owner_id } }")
    }
    const donosJaUsados = new Set<string>()

    for (const [segredoCru, valor] of Object.entries(cru)) {
      const segredo = segredoCru.trim()
      const dados = valor as Record<string, unknown> | null
      const ownerId = typeof dados?.owner_id === "string" ? dados.owner_id.trim() : ""
      const nome = typeof dados?.nome === "string" ? dados.nome.trim() : ""
      const quem = `cliente "${nome || "sem nome"}"`

      if (segredo.length < MINIMO_DO_SEGREDO || !ownerId) {
        console.error(
          `[websync-os] ${quem} ignorado em WEBSYNC_CLIENTES_JSON: ` +
            `segredo com menos de ${MINIMO_DO_SEGREDO} caracteres ou owner_id vazio`,
        )
        continue
      }
      if (!FORMATO_UUID.test(ownerId)) {
        console.error(
          `[websync-os] ${quem} ignorado: owner_id "${ownerId}" não é um uuid`,
        )
        continue
      }
      // O erro de digitação que ninguém veria: um owner_id colado errado, que
      // calha de ser o dono do WebSync-OS, daria a esse cliente leitura E
      // escrita nas brands do Marcos, em silêncio e sem erro nenhum. Um
      // segredo de cliente nunca fala pelo dono do ambiente.
      if (donoDoAmbiente && ownerId === donoDoAmbiente) {
        console.error(
          `[websync-os] ${quem} ignorado: o owner_id dele é o mesmo de ` +
            `WEBSYNC_BRAND_OWNER_ID. Um cliente não pode falar pelo dono da ponte.`,
        )
        continue
      }
      // Dois clientes com o mesmo dono é a mesma colisão, entre iguais.
      if (donosJaUsados.has(ownerId)) {
        console.error(
          `[websync-os] ${quem} ignorado: o owner_id ${ownerId} já é de outro cliente.`,
        )
        continue
      }
      donosJaUsados.add(ownerId)
      cacheMapa.set(segredo, { nome: nome || "cliente sem nome", ownerId })
    }

    // Falha parcial é silenciosa por natureza: cliente descartado só vira uma
    // linha de log que ninguém lê no deploy. Dizer quantos entraram dá o
    // contraste que transforma "sumiu" em "nunca carregou".
    console.log(
      `[websync-os] WEBSYNC_CLIENTES_JSON: ${cacheMapa.size} cliente(s) ` +
        `de ${Object.keys(cru).length} declarado(s)`,
    )
  } catch (err) {
    console.error(
      "[websync-os] WEBSYNC_CLIENTES_JSON não é um JSON válido, ignorado:",
      err instanceof Error ? err.message : err,
    )
    cacheMapa = new Map()
  }
  return cacheMapa
}

/**
 * Confere o segredo do header e diz de qual cliente ele é.
 *
 * `cliente: null` significa o segredo de sempre, o do WebSync-OS, que
 * resolve o dono pelo caminho antigo (WEBSYNC_BRAND_OWNER_ID).
 */
export function conferirSegredo(req: Request): ResultadoSegredo {
  const doAmbiente = (process.env.WEBSYNC_WEBHOOK_SECRET ?? "").trim()
  const clientes = mapaVivo()
  avisarSegredoCurto(doAmbiente)

  if (!doAmbiente && clientes.size === 0) {
    console.error("[websync-os] nem WEBSYNC_WEBHOOK_SECRET nem WEBSYNC_CLIENTES_JSON no ambiente")
    return { ok: false, status: 503, erro: "webhook não configurado" }
  }

  const enviado = (req.headers.get(SECRET_HEADER) ?? "").trim()
  if (!enviado) {
    console.warn("[websync-os] pedido sem o header do segredo")
    return { ok: false, status: 401, erro: "não autorizado" }
  }

  if (doAmbiente && iguais(enviado, doAmbiente)) {
    return { ok: true, cliente: null }
  }

  for (const [segredo, cliente] of clientes) {
    if (iguais(enviado, segredo)) {
      return { ok: true, cliente }
    }
  }

  if (!doAmbiente) {
    // Sem esta linha, apagar WEBSYNC_WEBHOOK_SECRET do painel com clientes
    // configurados devolve 401 ("seu segredo está errado") em vez de 503
    // ("faltou variável") — e some justo o sinal de que se precisa nessa hora.
    console.error(
      "[websync-os] WEBSYNC_WEBHOOK_SECRET ausente: o segredo de sempre não " +
        "casa com ninguém porque não existe mais no ambiente",
    )
  }
  console.warn("[websync-os] secret inválido no webhook")
  return { ok: false, status: 401, erro: "não autorizado" }
}

/** Avisa uma vez, sem recusar: recusar aqui derrubaria o WebSync-OS no deploy. */
let avisouSegredoCurto = false
function avisarSegredoCurto(doAmbiente: string): void {
  if (avisouSegredoCurto || !doAmbiente || doAmbiente.length >= MINIMO_DO_SEGREDO) return
  avisouSegredoCurto = true
  console.warn(
    `[websync-os] WEBSYNC_WEBHOOK_SECRET tem ${doAmbiente.length} caracteres, ` +
      `menos que os ${MINIMO_DO_SEGREDO} exigidos de um segredo novo. ` +
      `Continua valendo; vale rotacionar com os dois lados combinados.`,
  )
}

/**
 * Como `conferirSegredo`, mas SÓ o dono da ponte entra: cliente leva 401.
 *
 * Existe para as rotas que devolvem dado global do produto (a base de contas
 * em /leads, as páginas do próprio SyncPost em /seo-pages), que não são
 * filtradas por dono e portanto não podem ser servidas a cliente nenhum.
 *
 * É opt-in de propósito. Enquanto isso era um `if` copiado em cada rota, o
 * padrão de uma rota nova era ACEITAR cliente, e a proteção existia por
 * lembrança — some por esquecimento, e o que vaza é a base de usuários
 * inteira. Assim, quem quiser aceitar cliente precisa pedir.
 */
export function conferirSegredoDoDono(req: Request): ResultadoSegredo {
  const r = conferirSegredo(req)
  if (!r.ok) return r
  if (r.cliente) {
    console.warn(
      `[websync-os] cliente "${r.cliente.nome}" tentou uma rota que é só do dono da ponte`,
    )
    return { ok: false, status: 401, erro: "não autorizado" }
  }
  return r
}

/**
 * O dono das brands que este pedido pode ver.
 *
 * Com `cliente`, é o dono dele e ponto: não olha a variável de ambiente
 * nem tenta adivinhar pelo banco. Sem cliente (o segredo do WebSync-OS),
 * segue a ordem de sempre: a variável manda; sem ela, se houver um único
 * dono entre as brands existentes, é ele; com zero ou com mais de um,
 * recusa — adivinhar dono é o tipo de esperteza que só aparece depois, no
 * lugar errado.
 */
export async function resolverDono(
  admin: SupabaseClient,
  cliente?: ClienteDaPonte | null,
): Promise<ResolucaoDono> {
  if (cliente) return { ok: true, ownerId: cliente.ownerId }

  const doAmbiente = (process.env.WEBSYNC_BRAND_OWNER_ID ?? "").trim()
  if (doAmbiente) return { ok: true, ownerId: doAmbiente }

  const { data, error } = await admin.from("brands").select("user_id")
  if (error) return { ok: false, motivo: `falha ao descobrir o dono: ${error.message}` }

  const donos = [...new Set((data ?? []).map((b) => b.user_id).filter(Boolean))]
  if (donos.length === 1) {
    console.log("[websync-os] WEBSYNC_BRAND_OWNER_ID ausente, usando o único dono existente")
    return { ok: true, ownerId: donos[0] as string }
  }
  return {
    ok: false,
    motivo:
      donos.length === 0
        ? "não há nenhuma brand ainda e WEBSYNC_BRAND_OWNER_ID não está definido: não sei de quem seria a brand nova. Defina a variável com o seu UUID de auth.users."
        : "este projeto tem brands de mais de um dono e WEBSYNC_BRAND_OWNER_ID não está definido. Defina a variável, senão o CRM enxergaria brand de cliente.",
  }
}
