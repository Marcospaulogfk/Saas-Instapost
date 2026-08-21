import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { MODEL_MECANICO } from "@/lib/generation/models"
import { logGenerationUsage } from "@/lib/generation/usage-log"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * O system prompt muda com o REGISTRO do briefing. No registro "noticia" o
 * slot de headline vira manchete de revista (15-25 palavras, protagonista +
 * fonte) — antes ele sugeria sempre um slogan de 6-9 palavras, e esse slogan
 * pré-pronto contaminava a capa do carrossel gerado depois (caso "VOCÊ TORCEU
 * PELA VILÃ": hook curto sem nomear a série, herdado daqui).
 */
function buildSystemPrompt(registro?: string): string {
  const isNoticia = registro === "noticia"

  const headlineSlot = isNoticia
    ? `**Headline de Impacto (Hook):**
* [MANCHETE DE REVISTA com 15-25 palavras — NÃO slogan curto. Ela DEVE nomear o protagonista do fato (pessoa, obra, série, marca) e creditar a fonte quando o fato depende dela. Estrutura: "[sujeito/fenômeno nomeado]: [pergunta por que/como OU tese]". Esconder o nome do protagonista é erro grave]`
    : `**Headline de Impacto (Hook):**
* [Sugestão de 1 frase forte de gancho — específica, não chavão. 6-9 palavras. Usa só o que o usuário disse, sem fato novo]`

  const noticiaRules = isNoticia
    ? `
- REGISTRO NOTÍCIA: o briefing relata um fato apurado. NUNCA remova nomes próprios do briefing — todo ponto-chave sobre o fato nomeia o sujeito explicitamente (nada de "a vilã", "uma brasileira", "o profissional" quando o nome existe no briefing). Se o briefing traz linhas "Fato central:", "Fonte do fato:" ou "Entidades:", os nomes delas são inegociáveis no output.`
    : ""

  return `Você é copy + diretor de arte sênior tipo Wieden+Kennedy / Pentagram. Vai receber uma ideia bruta de post e EXPANDIR pra um prompt estruturado que vai virar input pra outra IA gerar arte+copy.

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

${headlineSlot}

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
- PROIBIDO travessão ("—" ou "–") em qualquer trecho de copy sugerida (hook, CTA, pontos-chave). Use vírgula, dois-pontos ou ponto. O travessão é o tique que mais denuncia texto de IA em português, e o que você sugere aqui é copiado pela IA seguinte.
- Pra tópicos abstratos (tech, business, finanças), a Direção Visual NUNCA pode ser metáfora literal (ships drifting apart, hands letting go, broken chain). Sempre concreto: prédio corporativo, sala de reunião, ambientes editoriais — mas sem inventar marca/produto.
- Português brasileiro coloquial culto. Sem gerundismo.${noticiaRules}

Devolva APENAS o texto estruturado acima — sem JSON, sem fence, sem explicação extra.`
}

interface RequestBody {
  briefing: string
  formato?: string
  objetivo?: string
  abordagem?: string | null
  /** Registro editorial vindo da extração do link (noticia/educativo/opiniao/case). */
  registro?: string
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

Expanda usando a estrutura definida, a partir do que o briefing diz. Se o briefing cita um fato, número ou entidade que você não conhece com segurança, NÃO invente detalhes: mantenha o que o usuário escreveu e marque o ponto como [a confirmar] em vez de completar com suposição.`

    const start = performance.now()
    const { text, usage } = await refine(
      client,
      userMessage,
      buildSystemPrompt(body.registro),
    )
    // Medidor de COGS (etapa 5, 21/08/2026): era a etapa mais cara e a única
    // sem medida no banco. Best-effort, nunca bloqueia a resposta.
    await logRefineUsage(usage, performance.now() - start)

    if (!text) {
      return NextResponse.json({ error: "IA não retornou texto" }, { status: 500 })
    }

    return NextResponse.json({ refined: text, grounded: false, ms: 0 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[refine-prompt]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Refino do briefing em UMA chamada, sem ferramenta de busca.
 *
 * Decisão de produto (21/08/2026, CUSTOS-IA-MARGEM): a busca web rodava em toda
 * geração (até 3 buscas + releitura dos resultados em cada pause_turn) e
 * custava R$0,44 por geração, mais que o próprio roteiro. Não é opt-in nem
 * toggle: o custo não existe mais. No modo link a página já é a fonte; no
 * modo do-zero o briefing do usuário é a fonte. O prompt anti-alucinação
 * continua valendo e a resposta mantém `grounded: false` pra compatibilidade.
 */
async function refine(
  client: Anthropic,
  userMessage: string,
  system: string,
): Promise<{ text: string; usage: Anthropic.Usage }> {
  const MODEL = MODEL_MECANICO
  const MAX_TOKENS = 1500

  // O system prompt é fixo por registro; cachear pega as gerações seguintes.
  const systemBlocks: Anthropic.TextBlockParam[] = [
    { type: "text", text: system, cache_control: { type: "ephemeral" } },
  ]

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemBlocks,
    messages: [{ role: "user", content: userMessage }],
  })
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim()
  return { text, usage: response.usage }
}

async function logRefineUsage(usage: Anthropic.Usage, ms: number): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    await logGenerationUsage(supabase, {
      stage: "refine_briefing",
      model: MODEL_MECANICO,
      usage,
      userId: user?.id ?? null,
      durationMs: ms,
    })
  } catch (err) {
    console.warn("[refine-prompt] log de uso falhou:", err)
  }
}
