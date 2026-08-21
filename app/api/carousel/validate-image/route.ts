import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { MODEL_MECANICO } from "@/lib/generation/models"

export const runtime = "nodejs"
export const maxDuration = 30

/**
 * VALIDAÇÃO DE RELEVÂNCIA imagem ↔ texto.
 *
 * Último elo que faltava no pipeline: nada comparava a imagem final com o
 * assunto do post. Uma capa 100% fora de tema atravessava o sistema inteiro sem
 * disparar nada — a única crítica existente é de layout e é cega aos pixels.
 *
 * Roda os três testes do photo desk:
 *   1. A imagem mostra uma entidade que aparece no texto?
 *   2. Um leitor descreveria o assunto olhando só a imagem?
 *   3. Essa mesma imagem serviria pra qualquer outro post do nicho?
 *      (Se sim, é genérica — reprovada. É o filtro mais eficiente contra o
 *      look de banco de imagens.)
 *
 * Custo: 1 chamada de visão por capa. Por isso é OPT-IN — ligue com
 * IMAGE_RELEVANCE_CHECK=1. Desligado, devolve { skipped: true } e não cobra
 * nada, mantendo o comportamento atual.
 */

interface RequestBody {
  imageUrl?: string
  /** Título + subtítulo do slide. */
  text?: string
  /** Pessoa real nomeada no texto, quando houver (liga a checagem R2). */
  personName?: string | null
}

export async function POST(req: Request) {
  if (process.env.IMAGE_RELEVANCE_CHECK !== "1") {
    return NextResponse.json({ skipped: true, reason: "check desligado" })
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const imageUrl = (body.imageUrl ?? "").trim()
  const text = (body.text ?? "").trim()
  if (!imageUrl || !text) {
    return NextResponse.json({ error: "imageUrl e text obrigatórios" }, { status: 400 })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ skipped: true, reason: "sem API key" })
  }

  try {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) })
    if (!imgRes.ok) {
      return NextResponse.json({ skipped: true, reason: "imagem inacessível" })
    }
    const mediaType = imgRes.headers.get("content-type") ?? "image/jpeg"
    if (!mediaType.startsWith("image/")) {
      return NextResponse.json({ skipped: true, reason: "não é imagem" })
    }
    const base64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64")

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: MODEL_MECANICO,
      max_tokens: 400,
      system: `Você é editor de fotografia de uma revista. Recebe uma imagem e o texto que ela vai ilustrar, e decide se a imagem SERVE.

Responda APENAS com JSON:
{"relevante": true|false, "generica": true|false, "mostra_pessoa": true|false, "motivo": "uma frase curta em PT-BR"}

Critérios:
- "relevante": a imagem mostra algo que o texto realmente menciona (a pessoa, a obra, o objeto, o lugar), OU é um símbolo concreto e específico do assunto. Cena decorativa sem relação = false.
- "generica": essa mesma imagem serviria pra qualquer outro post do mesmo nicho? Foto de banco de imagem, pessoa anônima numa mesa, aperto de mão, escritório qualquer = true.
- "mostra_pessoa": há um rosto humano identificável na imagem.
Seja severo: na dúvida entre servir e não servir, reprove.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType as "image/jpeg", data: base64 },
            },
            {
              type: "text",
              text: `TEXTO DO POST:\n"""${text}"""\n${
                body.personName
                  ? `\nO texto nomeia a pessoa real: "${body.personName}". Se a imagem mostra um rosto que não é comprovadamente essa pessoa, isso é erro grave — marque relevante=false.`
                  : ""
              }\nAvalie e responda só com o JSON.`,
            },
          ],
        },
      ],
    })

    const block = response.content.find((b) => b.type === "text")
    const raw = block && block.type === "text" ? block.text : ""
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")

    let verdict: {
      relevante?: boolean
      generica?: boolean
      mostra_pessoa?: boolean
      motivo?: string
    }
    try {
      verdict = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ skipped: true, reason: "resposta não-JSON" })
    }

    // Reprova quando é irrelevante, quando é genérica, ou quando põe um rosto
    // ao lado do nome de uma pessoa real sem ser ela (regra R2).
    const aprovada =
      verdict.relevante === true &&
      verdict.generica !== true &&
      !(body.personName && verdict.mostra_pessoa === true && verdict.relevante !== true)

    return NextResponse.json({
      skipped: false,
      aprovada,
      relevante: verdict.relevante ?? null,
      generica: verdict.generica ?? null,
      mostra_pessoa: verdict.mostra_pessoa ?? null,
      motivo: verdict.motivo ?? "",
    })
  } catch (err) {
    // Validação nunca bloqueia a geração — falhou, segue com a imagem.
    console.error("[validate-image]", err)
    return NextResponse.json({ skipped: true, reason: "erro na validação" })
  }
}
