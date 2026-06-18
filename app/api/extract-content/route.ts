import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { extractFromUrl } from "@/lib/extract-url"

export const runtime = "nodejs"
export const maxDuration = 45

const SYSTEM_PROMPT = `Você é um editor sênior. Recebe o conteúdo bruto extraído de uma página web (artigo, notícia, página de produto) e transforma num BRIEFING enxuto pra virar um post de Instagram.

Devolva um parágrafo único (3-5 frases) em português brasileiro que capture:
- O tema central / a notícia principal
- O ângulo mais interessante pra um post (o "gancho")
- Dados, números ou fatos concretos que apareçam no texto

REGRAS:
- Seja específico e fiel ao conteúdo da página. NÃO invente fatos que não estão no texto.
- Sem clichês de IA ("Descubra", "Saiba mais", "Transforme sua vida").
- Não escreva o post em si — escreva o BRIEFING que servirá de input pra gerar o post.
- Devolva APENAS o parágrafo do briefing, sem títulos, sem JSON, sem aspas, sem explicação.`

interface RequestBody {
  url?: string
  objetivo?: string
  abordagem?: string | null
  formato?: string
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

  // === Etapa 2: resumir num briefing via Claude
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

Gere o briefing seguindo as regras.`

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
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

    return NextResponse.json({
      briefing: block.text.trim(),
      title: extracted.title,
      source_url: extracted.url,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[extract-content]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
