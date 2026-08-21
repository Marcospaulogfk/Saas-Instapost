import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { MODEL_MECANICO } from "@/lib/generation/models"
import { extractFromUrl } from "@/lib/extract-url"
import { createClient } from "@/lib/supabase/server"

const OG_BUCKET = "editorial-uploads"
const OG_MAX_BYTES = 10 * 1024 * 1024

/**
 * Baixa a foto do artigo e re-hospeda no storage do app.
 *
 * Sem isso a foto é inútil na prática, mesmo estando correta:
 *  - o site de origem bloqueia hotlink (a imagem carrega no curl e trava no
 *    browser), então a checagem de proporção estoura o timeout e descarta;
 *  - `/api/proxy-image` tem allowlist anti-SSRF e devolve 403 pro host do
 *    veículo, então o export em PNG quebraria por canvas "tainted";
 *  - e a URL do veículo pode sair do ar depois, deixando o post sem capa.
 *
 * Hospedada em *.supabase.co, ela já é aceita pelo proxy e pelo export.
 * Falhou? devolve a URL original — capa remota é melhor que capa nenhuma.
 */
async function rehostArticleImage(
  imageUrl: string,
  sourceUrl: string,
): Promise<string> {
  try {
    const res = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15_000),
      // Alguns veículos só servem a imagem quando o Referer é do próprio site.
      headers: { Referer: sourceUrl, "User-Agent": "Mozilla/5.0 NexusContentBot/1.0" },
    })
    if (!res.ok) return imageUrl

    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.startsWith("image/")) return imageUrl

    const buf = Buffer.from(await res.arrayBuffer())
    if (!buf.length || buf.length > OG_MAX_BYTES) return imageUrl

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const ext = contentType.split("/")[1]?.replace(/[^a-z0-9]/g, "") || "jpg"
    const path = `${user?.id ?? "anon"}/artigo-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`

    const { error } = await supabase.storage
      .from(OG_BUCKET)
      .upload(path, buf, { contentType, upsert: false })
    if (error) return imageUrl

    const { data } = supabase.storage.from(OG_BUCKET).getPublicUrl(path)
    return data?.publicUrl || imageUrl
  } catch {
    return imageUrl
  }
}

export const runtime = "nodejs"
export const maxDuration = 45

/**
 * Link → briefing.
 *
 * Este endpoint é o GARGALO do pipeline visual: tudo que a geração de imagem
 * vai saber sobre o artigo passa por aqui. Enquanto ele devolvia só um parágrafo
 * de prosa, a imagem nunca ficava sabendo QUEM é o protagonista, QUAL obra o
 * texto descreve nem QUE materiais aparecem — e a capa saía genérica.
 *
 * Agora devolve estrutura: entidades nomeadas, obras, números, vocabulário
 * visual e o registro do texto (notícia/educativo/opinião/case). O briefing em
 * prosa continua sendo devolvido, porque o resto do wizard consome ele.
 */
const SYSTEM_PROMPT = `Você é um editor sênior. Recebe o conteúdo bruto extraído de uma página web (artigo, notícia, página de produto) e devolve um BRIEFING ESTRUTURADO pra virar um post de Instagram.

Devolva APENAS um objeto JSON válido, sem cercas de código, sem comentário, com exatamente estes campos:

{
  "briefing": "parágrafo único de 3-5 frases em PT-BR: o tema central, o ângulo mais interessante e os fatos concretos",
  "tese": "UMA frase com o fato central da matéria — quem fez o quê, e o que isso significa",
  "fonte": "quem afirma/premia/publicou o fato (ex: 'revista Wallpaper*'), ou '' se o texto não depende de uma fonte",
  "registro": "noticia | educativo | opiniao | case",
  "entidades": [
    { "nome": "nome próprio EXATO como aparece no texto", "tipo": "person|work|org|place", "papel": "protagonista|citado|autor" }
  ],
  "obras": ["nome de obra, projeto, produto ou peça concreta citada"],
  "numeros": [ { "valor": "60 m²", "contexto": "área da Casa Contêiner" } ],
  "vocabulario_visual": ["substantivos CONCRETOS e materiais que o texto descreve: concreto, madeira, jardim tropical, vidro, curva"],
  "sujeito_visual": "a COISA que deveria aparecer na foto de capa — a obra, o objeto, o lugar ou a pessoa protagonista. Uma expressão curta."
}

REGRAS:
- Seja específico e fiel ao conteúdo da página. NÃO invente fatos, números ou nomes que não estão no texto.
- \`entidades\`: no máximo 6, protagonista primeiro. Copie o nome EXATAMENTE como está escrito (com acento). Não normalize, não abrevie, não "corrija".
- ⚠️ QUEM ESCREVEU A PÁGINA NÃO É O ASSUNTO DA PÁGINA. O jornalista, crítico, colunista, redator ou editor que ASSINA o texto NUNCA recebe papel "protagonista". Se o nome aparece só como assinatura ("Por Fulano"), byline, bio de autor, crédito de foto, perfil do site ou linha de redação, marque papel "autor" — ou omita. O protagonista é sempre quem o texto FALA SOBRE, nunca quem o texto ESCREVEU. Errar isso põe o nome do jornalista na capa do post como se a notícia fosse sobre ele.
- \`papel\` "protagonista": reserve pra 1 entidade (no máximo 2) — o sujeito real do texto. Todo o resto é "citado".
- \`vocabulario_visual\`: 4 a 8 itens. Só coisas que dá pra FOTOGRAFAR. Nada de abstração ("inovação", "excelência").
- \`sujeito_visual\`: se a matéria é sobre uma pessoa por causa de algo que ela FEZ, o sujeito visual é a OBRA, não a pessoa — a obra sempre rende capa melhor e não corre risco de virar retrato de estranho.
- Arrays vazios quando não houver material: \`[]\`. String vazia: \`""\`. Nunca preencha por preencher.
- Sem clichês de IA ("Descubra", "Saiba mais", "Transforme sua vida").
- Não escreva o post em si — escreva o BRIEFING que servirá de input.`

interface RequestBody {
  url?: string
  objetivo?: string
  abordagem?: string | null
  formato?: string
}

interface StructuredBriefing {
  briefing: string
  tese: string
  fonte: string
  registro: "noticia" | "educativo" | "opiniao" | "case"
  entidades: Array<{ nome: string; tipo: string; papel: string }>
  obras: string[]
  numeros: Array<{ valor: string; contexto: string }>
  vocabulario_visual: string[]
  sujeito_visual: string
}

/**
 * Remove a assinatura da matéria da lista de entidades.
 *
 * O modelo às vezes lê o byline como sujeito e devolve o crítico do site como
 * "protagonista" — e aí a capa do post sai anunciando o jornalista em vez do
 * assunto. A regra do prompt cobre o caso comum; isto cobre o resto: entidade
 * com papel "autor" cai fora, e sobra de papel "protagonista" vira "citado"
 * (só o primeiro é de fato o sujeito).
 */
function sanitizeEntidades(
  entidades: Array<{ nome?: string; tipo?: string; papel?: string }>,
): Array<{ nome?: string; tipo?: string; papel?: string }> {
  const limpas = entidades.filter(
    (e) => e?.nome?.trim() && e.papel !== "autor",
  )
  let jaTemProtagonista = false
  return limpas.map((e) => {
    if (e.papel !== "protagonista") return e
    if (jaTemProtagonista) return { ...e, papel: "citado" }
    jaTemProtagonista = true
    return e
  })
}

/** Tolera cerca de código e texto solto em volta do JSON. */
function parseStructured(raw: string): Partial<StructuredBriefing> | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
  try {
    return JSON.parse(cleaned) as Partial<StructuredBriefing>
  } catch {
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start === -1 || end <= start) return null
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as Partial<StructuredBriefing>
    } catch {
      return null
    }
  }
}

export async function POST(req: Request) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!body.url || !body.url.trim()) {
    return NextResponse.json({ error: "URL ausente" }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY não configurada" },
      { status: 500 },
    )
  }

  // === Etapa 1: extrair conteúdo da página
  let extracted
  try {
    extracted = await extractFromUrl(body.url.trim())
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[extract-content] extract FAIL:", msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // Sem texto útil pra resumir (ex: Instagram bloqueado, página vazia)
  const hasUsableText = extracted.text.trim().length > 60
  if (!hasUsableText && !extracted.title) {
    return NextResponse.json(
      {
        error:
          "Não consegui extrair conteúdo dessa página. Tente outro link ou escreva a ideia manualmente.",
      },
      { status: 422 },
    )
  }

  // === Etapa 2: resumir num briefing estruturado via Claude
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const userMessage = `CONTEÚDO EXTRAÍDO DA PÁGINA:
Título: ${extracted.title || "(sem título)"}
Descrição: ${extracted.description || "(sem descrição)"}
URL: ${extracted.url}

TEXTO:
"""
${extracted.text.slice(0, 4000) || "(sem texto extraído — use título e descrição)"}
"""

CONTEXTO DO POST:
- Formato: ${body.formato ?? "post"}
- Objetivo: ${body.objetivo ?? "engajar"}
- Abordagem: ${body.abordagem ?? "—"}

Gere o briefing estruturado seguindo as regras. Responda só com o JSON.`

    const response = await client.messages.create({
      model: MODEL_MECANICO,
      max_tokens: 1600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })

    const block = response.content.find((b) => b.type === "text")
    if (!block || block.type !== "text") {
      return NextResponse.json(
        { error: "IA não retornou texto" },
        { status: 500 },
      )
    }

    const parsed = parseStructured(block.text)

    // A foto do artigo é a foto REAL de quem o post cita. Re-hospeda pra ela
    // sobreviver ao hotlink e ao proxy — senão a capa cai pra IA sem motivo.
    const ogImage = extracted.ogImage
      ? await rehostArticleImage(extracted.ogImage, extracted.url)
      : null
    // Se o JSON vier quebrado, o texto cru ainda serve de briefing — a extração
    // nunca deve falhar por causa do formato da resposta.
    const briefing = (parsed?.briefing ?? block.text).trim()

    return NextResponse.json({
      briefing,
      title: extracted.title,
      source_url: extracted.url,
      // A foto do próprio artigo: é a imagem certa, é grátis e evita pagar 25
      // tokens gerando uma errada. O scraper já capturava e o pipeline jogava
      // fora — é o que produziu a capa descolada do caso Marilia Pellegrini.
      og_image: ogImage,
      // Estrutura que alimenta a decisão de imagem (entidade âncora → classe →
      // fonte). Sem isso a arte nunca soube do que o artigo falava.
      tese: parsed?.tese ?? "",
      fonte: parsed?.fonte ?? "",
      registro: parsed?.registro ?? "noticia",
      entidades: sanitizeEntidades(parsed?.entidades ?? []),
      obras: parsed?.obras ?? [],
      numeros: parsed?.numeros ?? [],
      vocabulario_visual: parsed?.vocabulario_visual ?? [],
      sujeito_visual: parsed?.sujeito_visual ?? "",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[extract-content]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
