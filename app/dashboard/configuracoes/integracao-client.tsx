"use client"

import { useState, useTransition } from "react"
import { Check, Copy, KeyRound, Loader2, Plus, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { criarChaveApi, revogarChaveApi } from "@/app/actions/chaves-api"

// =====================================================================
// Configurações > Integração
//
// A tela existe pra uma pessoa que NÃO é programadora conseguir ligar o
// Nexus a outro sistema sozinha. Por isso o texto fala de "chave" e
// "conectar", nunca de "token bearer" e "endpoint"; e por isso os
// exemplos vêm prontos pra copiar, com a chave já dentro — o erro mais
// comum de quem integra é colar a chave no lugar errado.
//
// A chave completa aparece UMA vez, logo depois de gerada. Isso não é
// limitação técnica que dá pra contornar: o banco só guarda o hash. O
// aviso na tela é literal por isso.
// =====================================================================

export interface ChaveListada {
  id: string
  nome: string
  prefixo: string
  criada_em: string
  ultimo_uso: string | null
}

interface Props {
  chaves: ChaveListada[]
  /** Base absoluta usada nos exemplos (http://localhost:3003 em dev). */
  baseUrl: string
}

function formatarData(iso: string | null): string {
  if (!iso) return "nunca usada"
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Copia pro clipboard com plano B. `navigator.clipboard` falha calado em
 * contexto sem permissão (iframe, navegador corporativo, alguns portais de
 * teste): era o "Copiar não dá retorno nenhum" do R4-21. Aqui tenta a API,
 * cai no execCommand antigo, e só então admite que não deu.
 */
async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    try {
      const area = document.createElement("textarea")
      area.value = texto
      area.setAttribute("readonly", "")
      area.style.position = "fixed"
      area.style.opacity = "0"
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}

/** Botão de copiar que SEMPRE responde na própria etiqueta. */
function BotaoCopiar({ texto, rotulo = "Copiar" }: { texto: string; rotulo?: string }) {
  const [estado, setEstado] = useState<"parado" | "copiado" | "falhou">("parado")
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        void copiar(texto).then((ok) => {
          setEstado(ok ? "copiado" : "falhou")
          setTimeout(() => setEstado("parado"), 2500)
        })
      }}
    >
      {estado === "copiado" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {estado === "copiado" ? "Copiado" : estado === "falhou" ? "Selecione e copie" : rotulo}
    </Button>
  )
}

function Exemplo({ titulo, explicacao, comando }: { titulo: string; explicacao: string; comando: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{titulo}</p>
          <p className="text-xs text-text-muted">{explicacao}</p>
        </div>
        <BotaoCopiar texto={comando} />
      </div>
      <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-background-tertiary/50 p-3 font-mono text-[11px] leading-relaxed text-text-secondary">
        {comando}
      </pre>
    </div>
  )
}

export function IntegracaoClient({ chaves, baseUrl }: Props) {
  const [nome, setNome] = useState("")
  const [chaveNova, setChaveNova] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  const [revogando, setRevogando] = useState<string | null>(null)

  // Enquanto a chave nova está na tela, os exemplos usam ela de verdade —
  // é o único momento em que dá pra entregar um comando que roda sem
  // ninguém editar nada.
  const chaveExemplo = chaveNova ?? "SUA_CHAVE_AQUI"

  function gerar() {
    setErro(null)
    // Nome obrigatório (R4-21): sem ele a chave nascia como "Chave sem nome",
    // indistinguível na lista, e o testador acabou com uma chave válida que
    // ninguém sabia pra que servia.
    if (!nome.trim()) {
      setErro("Dê um nome pra chave, por exemplo onde você vai usar. É o que te deixa saber qual revogar depois.")
      return
    }
    iniciar(async () => {
      const r = await criarChaveApi(nome)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setChaveNova(r.chave)
      setNome("")
    })
  }

  function revogar(id: string) {
    setErro(null)
    setRevogando(id)
    iniciar(async () => {
      const r = await revogarChaveApi(id)
      setRevogando(null)
      if (!r.ok) setErro(r.erro)
    })
  }

  return (
    <div className="space-y-6">
      {/* O que é isso ------------------------------------------------- */}
      <section className="space-y-3 rounded-xl border border-border-subtle bg-background-secondary p-6">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-brand-400" />
          <h3 className="font-semibold text-text-primary">Conectar outros sistemas</h3>
        </div>
        <p className="text-sm leading-relaxed text-text-secondary">
          A chave é a senha que um outro programa usa para falar com o Nexus no
          seu lugar. Com ela, o seu CRM, uma automação do n8n ou do Make
          conseguem ver as suas marcas, ler e criar pautas no calendário e pedir
          que a arte seja gerada, sem ninguém precisar abrir o painel.
        </p>
        <p className="text-sm leading-relaxed text-text-secondary">
          Quem tem a chave age como você. Trate ela como uma senha: não mande por
          WhatsApp, não coloque em planilha compartilhada. Se desconfiar que
          vazou, revogue aqui mesmo — quem estiver usando para de funcionar na
          hora.
        </p>
      </section>

      {/* Gerar --------------------------------------------------------- */}
      <section className="space-y-4 rounded-xl border border-border-subtle bg-background-secondary p-6">
        <h3 className="font-semibold text-text-primary">Gerar uma chave</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="nome-chave">Onde você vai usar essa chave?</Label>
            <Input
              id="nome-chave"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: automação do n8n"
              maxLength={60}
            />
          </div>
          <Button onClick={gerar} disabled={pendente}>
            {pendente && !revogando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Gerar chave
          </Button>
        </div>
        <p className="text-xs text-text-muted">
          O nome serve só para você lembrar depois qual chave é qual.
        </p>

        {chaveNova && (
          <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/5 p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium text-text-primary">
                Copie agora. Esta chave não aparece de novo.
              </p>
            </div>
            <p className="text-xs text-text-secondary">
              Guardamos apenas uma marca embaralhada dela, então nem nós
              conseguimos mostrar de novo. Se perder, é só gerar outra e revogar
              esta.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-lg border border-border-subtle bg-background-tertiary/60 px-3 py-2 font-mono text-xs text-text-primary">
                {chaveNova}
              </code>
              <BotaoCopiar texto={chaveNova} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChaveNova(null)}
              className="text-text-muted"
            >
              Já copiei, pode esconder
            </Button>
          </div>
        )}

        {erro && <p className="text-sm text-danger">{erro}</p>}
      </section>

      {/* Lista --------------------------------------------------------- */}
      <section className="space-y-4 rounded-xl border border-border-subtle bg-background-secondary p-6">
        <h3 className="font-semibold text-text-primary">Suas chaves</h3>
        {chaves.length === 0 ? (
          <p className="text-sm text-text-muted">
            Você ainda não tem nenhuma chave. Gere a primeira aí em cima.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {chaves.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium text-text-primary">{c.nome}</p>
                  <p className="font-mono text-xs text-text-muted">
                    {c.prefixo}
                    {"•".repeat(8)}
                  </p>
                  <p className="text-xs text-text-muted">
                    Criada em {formatarData(c.criada_em)} · Último uso:{" "}
                    {formatarData(c.ultimo_uso)}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 border-danger/40 text-danger hover:bg-danger/10"
                      disabled={pendente && revogando === c.id}
                    >
                      {pendente && revogando === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      Revogar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revogar “{c.nome}”?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Qualquer sistema que esteja usando esta chave para de
                        funcionar imediatamente. Isso não dá para desfazer: se
                        precisar depois, gere uma chave nova e troque lá.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Deixar como está</AlertDialogCancel>
                      <AlertDialogAction onClick={() => revogar(c.id)}>
                        Revogar a chave
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Como usar ----------------------------------------------------- */}
      <section className="space-y-5 rounded-xl border border-border-subtle bg-background-secondary p-6">
        <div>
          <h3 className="font-semibold text-text-primary">Como usar</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Todo pedido leva a chave no cabeçalho{" "}
            <code className="font-mono text-xs text-text-primary">Authorization</code>. Os
            exemplos abaixo estão prontos: copie, cole no terminal (ou no campo
            de URL da sua automação) e troque só o que estiver entre &lt;&gt;.
            {chaveNova
              ? " Enquanto a chave nova está na tela, ela já vem preenchida nos exemplos."
              : " Onde aparece SUA_CHAVE_AQUI, coloque a sua chave."}
          </p>
        </div>

        <Exemplo
          titulo="1. Testar se a chave funciona"
          explicacao="Responde quem você é, seu plano e quantos tokens tem. Não cria nada."
          comando={`curl ${baseUrl}/api/v1/eu \\\n  -H "Authorization: Bearer ${chaveExemplo}"`}
        />

        <Exemplo
          titulo="2. Ver suas marcas"
          explicacao="Toda pauta pertence a uma marca. O id dela sai daqui."
          comando={`curl ${baseUrl}/api/v1/marcas \\\n  -H "Authorization: Bearer ${chaveExemplo}"`}
        />

        <Exemplo
          titulo="3. Ler o calendário de um período"
          explicacao="As pautas com data, status e o estado da arte de cada uma."
          comando={`curl "${baseUrl}/api/v1/calendario?de=2026-09-01&ate=2026-09-30" \\\n  -H "Authorization: Bearer ${chaveExemplo}"`}
        />

        <Exemplo
          titulo="4. Criar uma pauta no calendário"
          explicacao="ref é o identificador do seu lado, para você reconhecer a resposta."
          comando={`curl -X POST ${baseUrl}/api/v1/calendario \\\n  -H "Authorization: Bearer ${chaveExemplo}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"pautas":[{"ref":"meu-id-1","brand_id":"<id da marca>","titulo":"3 erros que travam a venda","descricao":"texto do post","formato":"post","data_sugerida":"2026-09-20"}]}'`}
        />

        <Exemplo
          titulo="5. Mudar a data, a hora ou o status"
          explicacao="Status aceitos: ideia, em_criacao, pronto, agendado."
          comando={`curl -X PATCH ${baseUrl}/api/v1/calendario/<id da pauta> \\\n  -H "Authorization: Bearer ${chaveExemplo}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"data":"2026-09-22","hora":"09:00"}'`}
        />

        <Exemplo
          titulo="6. Pedir a arte de uma pauta"
          explicacao="O Nexus diagrama sozinho. A resposta volta na hora; a arte fica pronta em seguida, no calendário."
          comando={`curl -X POST ${baseUrl}/api/v1/gerar \\\n  -H "Authorization: Bearer ${chaveExemplo}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"itens":[{"id":"<id da pauta>"}]}'`}
        />

        <p className="text-xs text-text-muted">
          Limite: 60 pedidos por minuto em cada chave. Quando algo dá errado, a
          resposta vem em português dizendo o motivo. A explicação completa de
          cada campo está no arquivo docs/INTEGRACAO-API.md do projeto.
        </p>
      </section>
    </div>
  )
}
