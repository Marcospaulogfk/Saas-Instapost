import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { conferirSegredo, resolverDono } from "@/lib/websync/dono"
import { erroJson } from "@/lib/calendario/resposta"
import {
  mapearPautas,
  montarPost,
  montarTotais,
  num,
  type PostDaPonte,
} from "@/lib/websync/metricas-instagram"
import { getValidConnection } from "@/lib/instagram/connection"
import {
  getAccountInsights,
  getFollowerSeries,
  getInstagramProfileFull,
  getMediaInsights,
  getRecentMedia,
} from "@/lib/instagram/meta"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// 18 posts × 1 chamada de insights cada, em paralelo, mais perfil e série.
export const maxDuration = 60

// =====================================================================
// GET /api/webhooks/websync-os/instagram   (09/09/2026)
//
// As métricas do Instagram DO DONO RESOLVIDO PELO SEGREDO. Existe porque o
// CRM do Culturize-se decidiu não criar app da Meta nem token próprio: a
// conexão é uma só, feita pelo Reinaldo dentro do SyncPost, e é a mesma que
// publica. Duas conexões para a mesma conta seria pedir ao cliente que
// resolvesse duas vezes um problema que já é chato uma.
//
// ESTA ROTA ACEITA SEGREDO DE CLIENTE, de propósito, e é por isso que ela
// usa `conferirSegredo` e não `conferirSegredoDoDono`. A diferença entre as
// duas é a linha que separa "dado do produto inteiro" de "dado de um dono
// só": /leads e /seo-pages devolvem a base de contas e as páginas do próprio
// SyncPost, então são fechadas; aqui tudo que sai vem da conexão de UM dono,
// e esse dono sai do segredo que chegou. Nada no pedido escolhe conta.
//
// NÃO CONECTADO NÃO É ERRO. Hoje não existe conexão nenhuma para a
// Culturize-se e o app SyncPost está em acesso padrão na Meta, então esse é
// o caminho NORMAL, não a exceção. Por isso os quatro estados saem em 200
// com `estado` preenchido: a tela do CRM desenha coisas diferentes para cada
// um (passo a passo, faixa âmbar com reconectar, faixa vermelha sem mandar
// reconectar) e nenhum deles é uma tela de erro. Só devolve status ≠ 200 o
// que é problema de ACESSO à ponte: segredo, ambiente, dono.
//
// TODO NÚMERO É number | null, e null nunca vira 0. A Meta omite métrica que
// não entregou, devolve insights nulos para mídia antiga ou de tipo sem
// suporte, e manda a série de seguidores VAZIA para conta com menos de 100
// seguidores — sem avisar. Zero salvamento e "não medido" são coisas
// diferentes, e a tela mostra "-" no segundo caso. Preencher com 0 aqui
// faria o CRM desenhar um gráfico que mente.
// =====================================================================

/** Quantos posts o CRM lê por vez. Igual ao /api/instagram/insights da tela. */
const POSTS = 18
const DIAS = 30

type Estado = "conectado" | "nao_conectado" | "expirada" | "erro"

function resposta(estado: Estado, extra: Record<string, unknown> = {}) {
  return NextResponse.json({
    ok: true,
    estado,
    lidoEm: new Date().toISOString(),
    ...extra,
  })
}

export async function GET(req: Request) {
  const auth = conferirSegredo(req)
  if (!auth.ok) {
    return auth.status === 503
      ? erroJson(503, "nao_configurado", "webhook não configurado neste ambiente")
      : erroJson(401, "nao_autorizado", "segredo ausente ou inválido")
  }

  const admin = createAdminClient()
  const dono = await resolverDono(admin, auth.cliente)
  if (!dono.ok) {
    return erroJson(409, "dono_indefinido", dono.motivo)
  }

  // 1) A conexão. Os três desfechos aqui já são três dos quatro estados.
  let conn
  try {
    conn = await getValidConnection(admin, dono.ownerId)
  } catch {
    // getValidConnection lança quando o token de 60 dias venceu. Só
    // reconectando resolve, e quem reconecta é o dono da conta.
    console.warn(`[websync-os/instagram] token expirado (dono ${dono.ownerId})`)
    return resposta("expirada", {
      motivo: "o token do Instagram venceu; é preciso reconectar dentro do SyncPost",
    })
  }
  if (!conn) {
    // O caminho normal por enquanto, não a exceção.
    return resposta("nao_conectado", {
      motivo: "esta conta ainda não conectou o Instagram no SyncPost",
    })
  }

  // `conn` é let por causa do try; daqui pra baixo ele não muda mais, e o
  // const evita que o narrowing se perca dentro dos callbacks abaixo.
  const conexao = conn

  // 2) Os números.
  try {
    const [perfilMeta, conta, serie, midias] = await Promise.all([
      getInstagramProfileFull(conexao.accessToken),
      getAccountInsights(conexao.igUserId, conexao.accessToken, DIAS),
      getFollowerSeries(conexao.igUserId, conexao.accessToken, DIAS),
      getRecentMedia(conexao.accessToken, POSTS),
    ])

    // A ponta que liga métrica a pauta: quem publicou pelo SyncPost tem o
    // scheduled_post_id aqui, e é ele que o CRM já guarda do outro lado. Sem
    // isto a coluna "pilar" da tela do CRM nunca sairia de "-".
    //
    // Consultado SÓ pelas mídias que esta conta acabou de devolver. A tabela
    // é global (tem tentativa de todo mundo) e o dono não é coluna dela; em
    // vez de carregar o que é dos outros e filtrar depois, pergunto apenas
    // pelos ids que já sei serem desta conexão.
    const ids = midias.map((m) => m.id)
    const publicadas = ids.length
      ? await admin
          .from("publish_attempts")
          .select("scheduled_post_id, ig_media_id")
          .eq("ok", true)
          .in("ig_media_id", ids)
      : { data: [] as Array<Record<string, unknown>> }

    const pautaPorMidia = mapearPautas(publicadas.data ?? [])

    const insights = await Promise.all(
      midias.map((m) => getMediaInsights(m.id, conexao.accessToken)),
    )

    const posts: PostDaPonte[] = midias.map((m, i) =>
      montarPost(m, insights[i], pautaPorMidia.get(m.id) ?? null),
    )

    return resposta("conectado", {
      perfil: {
        handle: perfilMeta.username || conexao.username || null,
        seguidores: num(perfilMeta.followersCount),
      },
      totais30d: montarTotais(conta, serie),
      posts,
    })
  } catch (e) {
    // A Meta engasgou. Não é o dono que resolve, então a tela mostra faixa
    // vermelha SEM mandar reconectar — e o CRM completa com o último retrato
    // que ele tiver guardado.
    const motivo = e instanceof Error ? e.message : "erro ao ler métricas"
    console.error("[websync-os/instagram]", e)
    return resposta("erro", { motivo })
  }
}
