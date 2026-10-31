"use client"

import { useState } from "react"
import Link from "next/link"
import { createPortal } from "react-dom"
import { CalendarCheck, Check, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  agendarPecaNoCalendario,
  prepararArteParaAgendar,
  type TipoArte,
} from "@/app/actions/publish-art"
import { hojeNoFuso } from "@/lib/calendario/agenda"
import { validarEdicaoPauta } from "@/lib/pautas/editar"

interface Props {
  tipo: TipoArte
  /** Id da peça salva. Null = ainda não salvou: sem isso não há onde guardar. */
  pecaId: string | null | undefined
  /**
   * Renderiza a ARTE FINAL (tamanho de publicação) e devolve as URLs públicas,
   * na ordem. É o MESMO caminho do botão de publicar — a diferença é que aqui
   * o resultado é guardado em vez de ser jogado fora depois do envio.
   *
   * Importante: não pode usar atalho de URL externa (o bitmap do Fal). Só
   * arquivo do nosso Storage sobrevive até o dia agendado.
   */
  getImageUrls: () => Promise<string[]>
  /**
   * Grava o que está na tela antes de agendar: a legenda que vai ao ar é a
   * salva. Devolve false se não conseguiu (o editor já mostra o erro).
   */
  salvar?: () => Promise<boolean>
  /** Peça em formato Stories: sai nos stories, não no feed. */
  comoStory?: boolean
  /** Largura total (usado na lista de ações do celular). */
  cheio?: boolean
}

type Estado = "idle" | "salvando" | "render" | "agendando"

const AVISO_PASSO: Record<Exclude<Estado, "idle">, string> = {
  salvando: "Salvando a peça…",
  render: "Montando a arte. Deixe esta aba aberta e à frente.",
  agendando: "Agendando…",
}

/** "2026-10-31" → "31/10/2026". */
function dataNaTela(data: string): string {
  return data.split("-").reverse().join("/")
}

/**
 * "Agendar": dia e hora em cima da peça.
 *
 * O agendamento automático publica sem ninguém por perto, e a arte final só
 * existe enquanto o editor está aberto (o PNG é renderizado do DOM). Este
 * quadro é o momento em que a peça deixa de depender da tela: renderiza,
 * hospeda, guarda e marca no calendário. Depois disso o worker publica sozinho.
 */
export function AgendarPublicacao({ tipo, pecaId, getImageUrls, salvar, comoStory, cheio }: Props) {
  const [aberto, setAberto] = useState(false)
  const [data, setData] = useState("")
  const [hora, setHora] = useState("")
  const [estado, setEstado] = useState<Estado>("idle")
  const [erro, setErro] = useState<string | null>(null)
  const [agendado, setAgendado] = useState<{ data: string; hora: string } | null>(null)

  const ocupado = estado !== "idle"
  const hoje = hojeNoFuso()

  function abrir() {
    setData((d) => d || hoje)
    setErro(null)
    setAgendado(null)
    setAberto(true)
  }

  function fechar() {
    if (!ocupado) setAberto(false)
  }

  async function agendar() {
    if (!pecaId) return
    setErro(null)
    const recusa = validarEdicaoPauta({ statusAtual: "ideia", status: "agendado", data, hora })
    if (recusa) {
      setErro(recusa)
      return
    }
    try {
      if (salvar) {
        setEstado("salvando")
        if (!(await salvar())) {
          setErro("Não consegui salvar a peça. Salve e tente de novo.")
          return
        }
      }
      setEstado("render")
      const urls = await getImageUrls()
      if (!urls.length) {
        setErro("Nenhuma imagem foi gerada.")
        return
      }
      setEstado("agendando")
      const preparo = await prepararArteParaAgendar(tipo, pecaId, urls)
      if (!preparo.ok) {
        setErro(preparo.error)
        return
      }
      const res = await agendarPecaNoCalendario(tipo, pecaId, data, hora)
      if (!res.ok) {
        setErro(res.error)
        return
      }
      setAgendado({ data, hora })
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao agendar.")
    } finally {
      setEstado("idle")
    }
  }

  return (
    <div className={cheio ? "flex flex-col items-stretch gap-1 w-full" : "inline-flex flex-col items-start gap-1"}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={abrir}
        disabled={!pecaId}
        title={pecaId ? "Escolha o dia e a hora pra esta peça sair sozinha" : "Salve a peça primeiro"}
      >
        <CalendarCheck className="w-3.5 h-3.5 mr-1.5" />
        Agendar
      </Button>

      {/* No body, pelo mesmo motivo do quadro de publicar: as barras do editor
          têm backdrop-blur e prenderiam o "fixed" dentro delas. */}
      {aberto && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={fechar}
        >
          <div
            className="bg-background border border-border rounded-xl max-w-md w-full p-5 space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-brand-400" />
                {comoStory ? "Agendar nos stories" : "Agendar no Instagram"}
              </h2>
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar"
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {agendado ? (
              <div className="space-y-3 text-center py-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm text-text-primary font-medium">
                  Agendado para {dataNaTela(agendado.data)} às {agendado.hora}
                </p>
                <p className="text-xs text-text-secondary">
                  Sai sozinho, em até 15 minutos depois desse horário. Vai ao ar
                  a arte de agora: se mudar alguma coisa depois, agende de novo.
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/dashboard/calendario">Ver no calendário</Link>
                  </Button>
                  <Button type="button" className="flex-1" onClick={fechar}>
                    Entendi
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="agendar-dia">Dia</Label>
                    <Input
                      id="agendar-dia"
                      type="date"
                      min={hoje}
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      disabled={ocupado}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="agendar-hora">Hora</Label>
                    <Input
                      id="agendar-hora"
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      disabled={ocupado}
                    />
                  </div>
                </div>
                <p className="text-xs text-text-secondary">
                  {ocupado ? AVISO_PASSO[estado as Exclude<Estado, "idle">] : "Horário de Brasília."}
                </p>
                <Button
                  type="button"
                  className="w-full"
                  onClick={agendar}
                  disabled={ocupado || !data || !hora}
                >
                  {ocupado ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Agendando…
                    </>
                  ) : (
                    "Agendar"
                  )}
                </Button>
                {erro && (
                  <p className="text-xs text-destructive break-words whitespace-pre-wrap rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                    {erro}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
