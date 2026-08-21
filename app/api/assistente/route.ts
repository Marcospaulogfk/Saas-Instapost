import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { MODEL_MECANICO } from "@/lib/generation/models"
import { createClient } from "@/lib/supabase/server"
import { getActiveBrand } from "@/lib/data/queries"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Assistente de conteúdo — a bolha global do dashboard.
 *
 * É o único ponto do produto em que a IA conversa de graça: o custo por
 * resposta é de centavos (texto curto, sem imagem) e o papel dela é retenção,
 * não receita. Cobrar aqui empurraria o usuário a não usar exatamente a coisa
 * que o faz voltar — e o concorrente cobra 6 créditos por mensagem no chat do
 * editor dele, o que vira argumento nosso.
 *
 * Contenção de custo, já que não debita token:
 * - Só responde a quem tem sessão.
 * - `max_tokens` curto: a resposta é conselho, não conteúdo pronto.
 * - Histórico limitado às últimas trocas (ver MAX_HISTORY).
 * - Tamanho de mensagem limitado, pra não virar canal de colar documento.
 */

/** Trocas de histórico que viajam a cada request (user+assistant = 1 troca). */
const MAX_HISTORY = 8
const MAX_MESSAGE_CHARS = 2000

function systemPrompt(brand: {
  name: string
  profession: string | null
  target_audience: string | null
  tone_of_voice: string | null
  main_objective: string | null
} | null): string {
  const marca = brand
    ? `# MARCA ATIVA
- Nome: ${brand.name}
- Nicho: ${brand.profession || "—"}
- Público: ${brand.target_audience || "—"}
- Tom de voz: ${brand.tone_of_voice || "—"}
- Objetivo principal: ${brand.main_objective || "—"}

Responda SEMPRE pensando nesta marca. Se a pessoa pedir ideia de post, as ideias têm que servir a este nicho e a este público — nada genérico que serviria pra qualquer conta.`
    : `# SEM MARCA ATIVA
A pessoa ainda não configurou uma marca. Se a resposta depender do nicho, peça o essencial em uma pergunta curta (nicho e público), ou sugira cadastrar a marca em Marcas.`

  return `Você é o assistente de conteúdo do Nexus Content, um SaaS brasileiro que gera posts e carrosséis para Instagram com IA. Fala com social medias, agências e donos de marca.

${marca}

# COMO RESPONDER
- Português do Brasil, direto e concreto. Nada de "Claro! Vamos lá!" nem de encher linguiça.
- Curto: 3 a 6 linhas na maioria das perguntas. Se pedirem lista de ideias, até 5 itens de uma linha cada.
- Específico vence genérico. "Poste 3x por semana" não ajuda ninguém; "terça e quinta de manhã, quando seu público de escritório abre o app" ajuda.
- Quando sugerir um post, entregue o ÂNGULO e o gancho, não o texto inteiro — o texto sai do gerador, e é lá que o usuário deve terminar.
- Se a pessoa pode resolver aquilo dentro do produto, diga onde: "Criar conteúdo", "Biblioteca", "Calendário", "Marcas", "Templates".

# LIMITES
- NÃO invente dados, números, tendências, datas ou notícias. Você não tem acesso à internet. Se não souber, diga e proponha o caminho.
- NÃO fale de preço, plano, cobrança, reembolso, bug ou conta. Isso é com o suporte: diga isso em uma linha e ofereça voltar ao conteúdo.
- NÃO prometa recursos que você não sabe se existem.
- Sem emojis. Sem exclamação em excesso. Sem tratar a pessoa como iniciante.`
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface RequestBody {
  messages?: ChatMessage[]
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "IA indisponível" }, { status: 503 })
  }

  // Sessão obrigatória: sem isso a rota vira geração de texto anônima e de
  // graça pra qualquer um que ache a URL.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 })
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const raw = Array.isArray(body.messages) ? body.messages : []
  const messages = raw
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY * 2)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_MESSAGE_CHARS),
    }))

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "a última mensagem precisa ser do usuário" },
      { status: 400 },
    )
  }

  // A marca ativa vem do servidor, não do cliente: é o que garante que o
  // conselho seja da marca certa mesmo com várias abas abertas.
  const brand = await getActiveBrand().catch(() => null)

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: MODEL_MECANICO,
      max_tokens: 700,
      temperature: 0.7,
      system: [
        {
          type: "text",
          text: systemPrompt(
            brand
              ? {
                  name: brand.name,
                  profession: brand.description ?? null,
                  target_audience: brand.target_audience ?? null,
                  tone_of_voice: brand.tone_of_voice ?? null,
                  main_objective: brand.main_objective ?? null,
                }
              : null,
          ),
          // O system é idêntico entre mensagens da mesma marca — cachear derruba
          // o custo das conversas longas, que são as que mais retêm.
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    })

    const block = response.content.find((b) => b.type === "text")
    const reply = block && block.type === "text" ? block.text.trim() : ""
    if (!reply) {
      return NextResponse.json(
        { error: "resposta vazia da IA" },
        { status: 502 },
      )
    }
    return NextResponse.json({ reply })
  } catch (err) {
    console.error("[assistente]", err)
    return NextResponse.json(
      { error: "não consegui responder agora" },
      { status: 500 },
    )
  }
}
