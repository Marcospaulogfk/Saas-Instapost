import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

export const runtime = "nodejs"
export const maxDuration = 60

const SYSTEM_PROMPT = `Você é copy + diretor de arte sênior tipo Wieden+Kennedy / Pentagram. Vai receber uma ideia bruta de post e EXPANDIR pra um prompt estruturado que vai virar input pra outra IA gerar arte+copy.

# REGRA ZERO — NÃO INVENTAR (a mais importante)

O briefing do usuário é a ÚNICA fonte de verdade. Você expande a FORMA (tom, ângulo, estrutura), NUNCA os FATOS.

- PROIBIDO adicionar fatos, nomes de empresas, produtos, pessoas, marcas, números, estatísticas, datas, eventos ou reações que o usuário NÃO escreveu.
- Se o usuário escreveu "Fable 5 é bloqueado pelos EUA", você NÃO sabe o que é "Fable 5" nem por que foi bloqueado. NÃO assuma que é um jogo, um filme, um modelo de IA, nada. Trate o termo exatamente como o usuário usou, sem atribuir dono, setor ou contexto.
- Se algo é ambíguo ou desconhecido, NÃO desambigue chutando o que você "acha que conhece" do seu treino. Mantenha neutro e fiel à frase do usuário.
- Os "Pontos-Chave" NÃO são fatos inventados apresentados como verdade. São ÂNGULOS, PERGUNTAS e ENQUADRAMENTOS pra explorar o tema — derivados só do que o usuário disse.
- Se o briefing não tem números/dados, NÃO invente números/dados. É melhor um ponto-chave em forma de pergunta ("por que isso aconteceu?") do que um fato fabricado.

# ESTRUTURA DO OUTPUT (mantenha EXATAMENTE essa estrutura, com asteriscos e quebras)

**Objetivo do Conteúdo:**
* [1-2 frases sobre o que o post quer alcançar — baseado SÓ no tema que o usuário deu]

**Tom de Voz:**
* [3-5 adjetivos separados por vírgula que descrevem o tom — ex: Profissional, provocativo, disruptivo]

**Headline de Impacto (Hook):**
* [Sugestão de 1 frase forte de gancho — específica, não chavão. 6-9 palavras. Usa só o que o usuário disse, sem fato novo]

**Ângulo Editorial:**
* [Qual perspectiva o post toma? — ex: contracorrente, manifesto, pergunta provocativa, bastidor]

**Pontos-Chave:**
* [Ângulo/pergunta/enquadramento 1 — derivado do briefing, SEM fato inventado]
* [Ângulo/pergunta/enquadramento 2 — idem]
* [Ângulo/pergunta/enquadramento 3 — idem, opcional]

**CTA Sugerido:**
* [Verbo no imperativo + complemento. Max 4 palavras. Não use "Saiba mais" / "Clique aqui" / "Descubra"]

**Direção Visual:**
* [Em INGLÊS, descrição da foto: subject + lighting + mood + style. NÃO represente entidades que o usuário não citou (não desenhe logos/produtos de empresas que ele não mencionou). Sem metáforas literais. Concreto pra Flux.]

# OUTRAS REGRAS

- NUNCA use clichês de IA: "Descubra", "Conheça", "Saiba mais", "Transforme sua vida", "Você merece", "Faça parte", "Vem com a gente".
- Pra tópicos abstratos (tech, business, finanças), a Direção Visual NUNCA pode ser metáfora literal (ships drifting apart, hands letting go, broken chain). Sempre concreto: prédio corporativo, sala de reunião, ambientes editoriais — mas sem inventar marca/produto.
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

Antes de expandir, PESQUISE na web pra entender de que assunto/entidade o briefing realmente trata (não assuma pelo seu conhecimento prévio — termos podem ser recentes ou ambíguos). Depois expanda usando a estrutura definida, baseado nos fatos reais que encontrar.`

    const { text, grounded } = await refineWithGrounding(
      client,
      userMessage,
      SYSTEM_PROMPT,
    )

    if (!text) {
      return NextResponse.json({ error: "IA não retornou texto" }, { status: 500 })
    }

    return NextResponse.json({ refined: text, grounded, ms: 0 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[refine-prompt]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Roda o refino com a ferramenta de busca web da Anthropic (grounding).
 * Se a busca web não estiver disponível na conta (erro da API), faz fallback
 * automático pra geração sem ferramenta — o prompt anti-alucinação continua valendo.
 */
async function refineWithGrounding(
  client: Anthropic,
  userMessage: string,
  system: string,
): Promise<{ text: string; grounded: boolean }> {
  const MODEL = "claude-sonnet-4-6"
  const MAX_TOKENS = 1500
  // web_search é um server tool da Anthropic (cobrado por busca).
  const webSearchTool = { type: "web_search_20250305", name: "web_search", max_uses: 3 }

  const extractText = (content: Anthropic.ContentBlock[]) =>
    content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim()

  try {
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: userMessage },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      tools: [webSearchTool] as any,
      messages,
    })
    // Server tools podem pausar (pause_turn) — reenvia até concluir.
    let guard = 0
    while (response.stop_reason === "pause_turn" && guard < 4) {
      messages.push({ role: "assistant", content: response.content })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        tools: [webSearchTool] as any,
        messages,
      })
      guard++
    }
    return { text: extractText(response.content), grounded: true }
  } catch (err) {
    // Busca web indisponível/não habilitada → fallback sem ferramenta.
    console.warn(
      "[refine-prompt] web search falhou, fallback sem grounding:",
      err instanceof Error ? err.message : err,
    )
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: userMessage }],
    })
    return { text: extractText(response.content), grounded: false }
  }
}
