import { after } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { CarouselV2Data } from "@/app/actions/carousel"
import type { PreviewSlide } from "@/components/carousel/slide-preview"
import { generateEditorialImageForRole } from "@/lib/editorial/ai-images"
import { logImageUsage } from "@/lib/generation/usage-log"
import { rehostToStorage } from "@/lib/fabrica/capture"
import {
  temCopyPronta,
  lerCopyDoCrm,
  montarSlides,
  promptDaCapa,
} from "@/lib/websync/copy-crm"
import { avisarCrmArtePronta } from "@/lib/websync/avisar-crm"

// =====================================================================
// O MOTOR da geração automática de arte pela Ponte (01/09/2026).
//
// `agendarGeracao` é SÍNCRONO até decidir o desfecho (rápido: 2-3 selects
// e, no caminho feliz, um update) — a geração pesada em si (imagens, Fal,
// insert) roda em `after()`, depois da rota já ter respondido pro CRM.
// Sem isso, um lote de 10 pautas prenderia a resposta HTTP pelo tempo de
// gerar 10 capas em série.
//
// `update ... where status in ('ideia','pronto')` é o cadeado contra
// disparo duplo: se duas chamadas concorrentes (retry do CRM, por exemplo)
// tentam agendar a mesma pauta, só uma vence a corrida pro 'em_criacao' —
// a outra recebe 0 linhas afetadas e devolve 'em_andamento' em vez de
// gerar a arte duas vezes.
// =====================================================================

export type ResultadoAgendamento =
  | "iniciado"
  | "em_andamento"
  | "ja_tem_arte"
  | "sem_copy"
  | "formato_nao_suportado"
  | "nao_encontrado"

/** Foto que o CRM já escolheu pra um slide (1-based) — mesmo shape do contrato do webhook. */
export interface ImagemCrmInput {
  slide: number
  url: string
  origem: string | null
}

/** Termo de busca visual por slide (1-based) — hoje só o do slide 1 é usado (prompt da capa). */
export interface BuscaCrmInput {
  slide: number
  termo: string
}

export interface ExtrasGeracao {
  imagens?: ImagemCrmInput[]
  buscas?: BuscaCrmInput[]
}

/**
 * Filtra `imagens[]` vindo do JSON do CRM pro shape esperado — item
 * malformado é descartado, não derruba o lote inteiro. Compartilhado pelas
 * duas rotas que aceitam este campo (POST principal com `gerar: true` e
 * POST .../gerar), pra não ter duas validações que podem divergir.
 */
export function lerImagensCrm(raw: unknown): ImagemCrmInput[] {
  if (!Array.isArray(raw)) return []
  const out: ImagemCrmInput[] = []
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).slide === "number" &&
      typeof (item as Record<string, unknown>).url === "string"
    ) {
      const origem = (item as Record<string, unknown>).origem
      out.push({
        slide: (item as { slide: number }).slide,
        url: (item as { url: string }).url,
        origem: typeof origem === "string" ? origem : null,
      })
    }
  }
  return out
}

/** Filtra `buscas[]` vindo do JSON do CRM pro shape esperado. */
export function lerBuscasCrm(raw: unknown): BuscaCrmInput[] {
  if (!Array.isArray(raw)) return []
  const out: BuscaCrmInput[] = []
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).slide === "number" &&
      typeof (item as Record<string, unknown>).termo === "string"
    ) {
      out.push({
        slide: (item as { slide: number }).slide,
        termo: (item as { termo: string }).termo,
      })
    }
  }
  return out
}

interface PautaParaGerar {
  id: string
  brand_id: string
  title: string
  description: string | null
  format: string
  status: string
}

/** Timeout de rede pra re-host de UMA imagem — a origem pode ser lenta ou já ter caído. */
const REHOST_TIMEOUT_MS = 15_000

/** Cores default do editor quando a brand não tem `brand_colors` cadastrado. */
const CORES_PADRAO = ["#1668E3", "#0A0A0F", "#FAF8F5"]

async function comTimeout<T>(promessa: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    promessa,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`timeout de ${ms}ms`)), ms)
    }),
  ])
}

/**
 * "Nome da Marca" → "@nomedamarca". Mesma regra de
 * app/dashboard/carrossel/page.tsx (handleFromBrand) — duplicada aqui de
 * propósito: aquele arquivo é "use client" (página do editor), e puxar uma
 * página pra dentro de uma rota de webhook por causa de duas funções puras
 * acopla coisas que não têm nada a ver uma com a outra.
 */
function handleFromBrand(name: string | null | undefined): string {
  if (!name) return "@brand"
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
  return slug ? `@${slug}` : "@brand"
}

/** "culturizesebrasil" → "@culturizesebrasil". Mesma regra de normalizeHandle no editor. */
function normalizeHandle(raw: string | null | undefined): string | null {
  const h = (raw ?? "").trim().replace(/^@+/, "")
  return h ? `@${h}` : null
}

/**
 * Decide o que fazer com a pauta, sem gerar nada ainda. Toda rota da
 * integração (POST .../gerar, e o `gerar: true` do POST principal) passa
 * por aqui — é o único lugar que sabe as regras de idempotência e de guard
 * de dono.
 */
export async function agendarGeracao(
  admin: SupabaseClient,
  ownerId: string,
  pautaId: string,
  extras: ExtrasGeracao,
): Promise<ResultadoAgendamento> {
  const { data: pauta, error: pautaError } = await admin
    .from("scheduled_posts")
    .select("id, brand_id, title, description, format, status")
    .eq("id", pautaId)
    .maybeSingle()
  if (pautaError || !pauta) return "nao_encontrado"

  // Brand tem que ser do dono — mesma razão de lib/websync/dono.ts: a
  // service_role enxerga brand de cliente, e gerar arte na pauta errada
  // não dá erro na hora nenhuma.
  const { data: brand } = await admin
    .from("brands")
    .select("id")
    .eq("id", pauta.brand_id)
    .eq("user_id", ownerId)
    .maybeSingle()
  if (!brand) return "nao_encontrado"

  if (pauta.format !== "carrossel") return "formato_nao_suportado"

  const { data: existente } = await admin
    .from("editorial_carousels")
    .select("id")
    .eq("scheduled_post_id", pautaId)
    .maybeSingle()
  if (existente) {
    // A arte já existe — só o status pode estar desatualizado (ex.: veio
    // de um save manual no editor, que nunca mexe em scheduled_posts).
    if (pauta.status === "ideia" || pauta.status === "em_criacao") {
      await admin.from("scheduled_posts").update({ status: "pronto" }).eq("id", pautaId)
    }
    return "ja_tem_arte"
  }

  if (!temCopyPronta(pauta.description)) return "sem_copy"

  if (pauta.status === "em_criacao") return "em_andamento"

  // O cadeado: só quem conseguir mover ideia/pronto → em_criacao é quem
  // dispara a geração. `.select('id')` é o jeito de saber quantas linhas
  // o update realmente pegou (0 = alguém chegou primeiro).
  const { data: atualizado, error: updateError } = await admin
    .from("scheduled_posts")
    .update({ status: "em_criacao" })
    .eq("id", pautaId)
    .in("status", ["ideia", "pronto"])
    .select("id")
  if (updateError) {
    console.error(
      `[websync-os/gerar] update pra em_criacao falhou (pauta ${pautaId.slice(0, 8)}):`,
      updateError.message,
    )
    return "em_andamento"
  }
  if (!atualizado || atualizado.length === 0) return "em_andamento"

  after(() => gerarArteDaPauta(admin, ownerId, pauta as PautaParaGerar, extras))
  return "iniciado"
}

/**
 * A geração de fato. Roda em `after()` — a resposta HTTP já foi embora, e
 * NADA aqui pode lançar pra fora: é best-effort do início ao fim, com um
 * catch-all que devolve a pauta pra 'ideia' se qualquer passo falhar (senão
 * ela fica presa em 'em_criacao' pra sempre, sem ninguém pra tentar de novo).
 */
export async function gerarArteDaPauta(
  admin: SupabaseClient,
  ownerId: string,
  pauta: PautaParaGerar,
  extras: ExtrasGeracao,
): Promise<void> {
  const pautaTag = pauta.id.slice(0, 8)
  try {
    // 1) Brand ----------------------------------------------------------
    const { data: brand, error: brandError } = await admin
      .from("brands")
      .select("name, instagram_handle, brand_colors")
      .eq("id", pauta.brand_id)
      .maybeSingle()
    if (brandError || !brand) {
      throw new Error(`brand não encontrada: ${brandError?.message ?? pauta.brand_id}`)
    }

    // 2) Copy -------------------------------------------------------------
    const copy = lerCopyDoCrm(pauta.description)
    if (!copy) {
      // agendarGeracao já garantiu temCopyPronta — chegar aqui é o
      // description ter mudado entre o agendamento e a execução.
      throw new Error("copy não encontrada na description (mudou entre agendar e gerar?)")
    }
    const imagensCrm = new Map<number, { url: string }>(
      (extras.imagens ?? []).map((img) => [img.slide, { url: img.url }]),
    )

    // 3) Re-hospeda as fotos que o CRM já escolheu -------------------------
    // A URL que o CRM manda é externa (banco de imagens, CDN do cliente) —
    // pode cair, expirar ou ficar lenta. Falha aqui NUNCA bloqueia: a URL
    // original ainda funciona na maioria dos casos, e o carrossel não
    // pode morrer porque uma foto de miolo não subiu no nosso Storage.
    const imagensReospedadas = new Map<number, { url: string }>()
    for (const [slide, foto] of imagensCrm) {
      let url = foto.url
      try {
        url = await comTimeout(
          rehostToStorage(admin, foto.url, ownerId, `ponte-${pautaTag}-s${slide}`),
          REHOST_TIMEOUT_MS,
        )
      } catch (err) {
        console.warn(
          `[websync-os/gerar] re-host da foto do slide ${slide} falhou (pauta ${pautaTag}), mantendo a URL original:`,
          err instanceof Error ? err.message : err,
        )
      }
      imagensReospedadas.set(slide, { url })
    }

    const slides: PreviewSlide[] = montarSlides(copy.slides, imagensReospedadas)

    // 4) Capa (slide 0) -----------------------------------------------------
    // Se o CRM já mandou foto pro slide 1, `slides[0].image.url` já veio
    // preenchido do montarSlides — não gera nada. Senão, é a única imagem
    // que justifica o modelo caro (Nano Banana 2, ver ai-images.ts).
    if (!slides[0].image.url) {
      try {
        const termoBusca =
          extras.buscas?.find((b) => b.slide === 1)?.termo ?? null
        const gerada = await generateEditorialImageForRole(
          { prompt: promptDaCapa(copy.slides[0], termoBusca), style: "editorial", aspectRatio: "4:5" },
          "cover",
        )
        let capaUrl = gerada.url
        try {
          // A URL da Fal expira — sem re-host, a capa morre sozinha em
          // algumas horas e o carrossel salvo fica com buraco.
          capaUrl = await comTimeout(
            rehostToStorage(admin, gerada.url, ownerId, `ponte-${pautaTag}-capa`),
            REHOST_TIMEOUT_MS,
          )
        } catch (err) {
          console.warn(
            `[websync-os/gerar] re-host da capa falhou (pauta ${pautaTag}), mantendo a URL da Fal:`,
            err instanceof Error ? err.message : err,
          )
        }
        slides[0] = {
          ...slides[0],
          image: { url: capaUrl, source: "ai", attribution: null, error: null },
        }
        // Custo (COGS) da capa — best-effort, nunca derruba a geração
        // (ver a REGRA DE OURO no topo de usage-log.ts).
        await logImageUsage(admin, {
          stage: "image_cover",
          model: gerada.model,
          costUsd: gerada.costUsd,
          userId: ownerId,
          brandId: pauta.brand_id,
        })
      } catch (err) {
        // Capa nula não bloqueia: o carrossel segue sem foto de capa, o
        // dono completa manualmente no editor se quiser.
        console.warn(
          `[websync-os/gerar] geração da capa falhou (pauta ${pautaTag}), seguindo sem capa:`,
          err instanceof Error ? err.message : err,
        )
      }
    }

    // 5) Monta o CarouselV2Data — mesmos defaults dos carrosséis recentes
    // do dono (editorialStyle 'auto', template 'editorial', font 'inter').
    const handle =
      normalizeHandle(brand.instagram_handle as string | null) ?? handleFromBrand(brand.name as string)
    const cores = Array.isArray(brand.brand_colors) && (brand.brand_colors as string[]).length
      ? (brand.brand_colors as string[])
      : CORES_PADRAO
    const dados: CarouselV2Data = {
      _kind: "carousel-v2",
      slides,
      title: pauta.title,
      caption: copy.legenda,
      brandName: brand.name as string,
      handle,
      avatarInitials: "",
      chrome: { showDots: true, showFooter: true, showVerified: true },
      colors: cores,
      template: "editorial",
      editorialStyle: "auto",
      format: "feed",
      font: "inter",
      coverImageUrl: null,
    }

    // 6) Grava a arte ---------------------------------------------------
    const { data: inserido, error: insertError } = await admin
      .from("editorial_carousels")
      .insert({
        user_id: ownerId,
        topic: dados.title,
        brand_name: dados.brandName,
        handle: dados.handle,
        carousel_data: dados,
        scheduled_post_id: pauta.id,
      })
      .select("id")
      .single()
    if (insertError || !inserido) {
      throw new Error(`insert em editorial_carousels falhou: ${insertError?.message}`)
    }

    // 7) Pauta pronta -----------------------------------------------------
    const { error: statusError } = await admin
      .from("scheduled_posts")
      .update({ status: "pronto" })
      .eq("id", pauta.id)
    if (statusError) {
      // A arte já está salva — não desfaz o insert por causa disso, só loga.
      console.error(
        `[websync-os/gerar] marcar pauta como 'pronto' falhou (pauta ${pautaTag}, carrossel ${inserido.id.slice(0, 8)}):`,
        statusError.message,
      )
    }

    // 8) Avisa o CRM (best-effort, nunca lança) ----------------------------
    await avisarCrmArtePronta({
      externo_id: pauta.id,
      artifact_type: "carousel",
      artifact_id: inserido.id,
      thumb_url: slides[0]?.image.url ?? null,
    })

    console.log(
      `[websync-os/gerar] arte pronta (pauta ${pautaTag} → carrossel ${inserido.id.slice(0, 8)})`,
    )
  } catch (err) {
    console.error(
      `[websync-os/gerar] geração falhou (pauta ${pautaTag}), devolvendo pra 'ideia':`,
      err instanceof Error ? err.message : err,
    )
    // Só desfaz se ainda estiver 'em_criacao' — se por algum motivo já
    // virou outra coisa nesse meio tempo, não pisa em cima.
    const { error: revertError } = await admin
      .from("scheduled_posts")
      .update({ status: "ideia" })
      .eq("id", pauta.id)
      .eq("status", "em_criacao")
    if (revertError) {
      console.error(
        `[websync-os/gerar] reverter pra 'ideia' também falhou (pauta ${pautaTag}):`,
        revertError.message,
      )
    }
  }
}
