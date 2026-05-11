import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

export const runtime = "nodejs"
export const maxDuration = 30

const SYSTEM_PROMPT = `Você é copy + diretor de arte sênior tipo Wieden+Kennedy / Pentagram. Vai receber uma ideia bruta de post e EXPANDIR pra um prompt estruturado que vai virar input pra outra IA gerar arte+copy.

Estrutura do output (mantenha EXATAMENTE essa estrutura, com asteriscos e quebras):

**Objetivo do Conteúdo:**
* [1-2 frases concretas sobre o que o post quer alcançar — não genérico]

**Tom de Voz:**
* [3-5 adjetivos separados por vírgula que descrevem o tom — ex: Profissional, provocativo, disruptivo]

**Headline de Impacto (Hook):**
* [Sugestão de 1 frase forte de gancho — específica, não chavão. 6-9 palavras]

**Ângulo Editorial:**
* [Qual perspectiva o post toma? — ex: contracorrente, dado novo, bastidor, manifesto]

**Pontos-Chave:**
* [Bullet 1 — concreto, com exemplo ou número se aplicável]
* [Bullet 2 — idem]
* [Bullet 3 — idem, opcional]

**CTA Sugerido:**
* [Verbo no imperativo + complemento. Max 4 palavras. Não use "Saiba mais" / "Clique aqui" / "Descubra"]

**Direção Visual:**
* [Em INGLÊS, descrição da foto: subject específico + lighting + mood + style. Sem metáforas literais. Concreto pra Flux.]

# REGRAS

- Seja específico, não genérico. "Você manda 27 propostas e fecha 3" > "Descubra como vender mais".
- NUNCA use clichês de IA: "Descubra", "Conheça", "Saiba mais", "Transforme sua vida", "Você merece", "Faça parte", "Vem com a gente".
- Se o briefing tem dado/fato, USE. Não substitua por chavão.
- Pra tópicos abstratos (tech, business, separação corporativa, finanças), a Direção Visual NUNCA pode ser metáfora literal (ships drifting apart, hands letting go, broken chain). Sempre concreto: prédio corporativo, sala de reunião, ambientes editoriais.
- Português brasileiro coloquial culto. Sem gerundismo.

Devolva APENAS o texto estruturado acima — sem JSON, sem fence, sem explicação extra.`

interface RequestBody {
  briefing: string
  formato?: string
  objetivo?: string
  abordagem?: string | null
}

export async function POST(req: Request) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!body.briefing || body.briefing.trim().length < 10) {
    return NextResponse.json(
      { error: "briefing precisa ter pelo menos 10 chars" },
      { status: 400 },
    )
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY não configurada" },
      { status: 500 },
    )
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const userMessage = `BRIEFING DO USUÁRIO:
"${body.briefing.trim()}"

CONTEXTO:
- Formato: ${body.formato ?? "post"}
- Objetivo: ${body.objetivo ?? "engajar"}
- Abordagem: ${body.abordagem ?? "—"}

Expanda esse briefing usando a estrutura definida.`

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })

    const block = response.content.find((b) => b.type === "text")
    if (!block || block.type !== "text") {
      return NextResponse.json({ error: "IA não retornou texto" }, { status: 500 })
    }

    return NextResponse.json({
      refined: block.text.trim(),
      ms: 0,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[refine-prompt]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
