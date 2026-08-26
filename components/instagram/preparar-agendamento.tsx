"use client"

import { useState } from "react"
import { CalendarCheck, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { prepararArteParaAgendar, type TipoArte } from "@/app/actions/publish-art"

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
  /** Chamado depois de preparar, pra tela poder refletir o estado novo. */
  onPreparado?: (imagens: number) => void
}

/**
 * "Preparar pra agendar".
 *
 * O agendamento automático publica sem ninguém por perto, e a arte final só
 * existe enquanto o editor está aberto (o PNG é renderizado do DOM). Este
 * botão é o momento em que a peça deixa de depender da tela: renderiza,
 * hospeda e guarda. Depois disso o worker consegue publicar sozinho.
 */
export function PrepararAgendamento({ tipo, pecaId, getImageUrls, onPreparado }: Props) {
  const [estado, setEstado] = useState<"idle" | "render" | "salvando" | "ok">("idle")
  const [erro, setErro] = useState<string | null>(null)

  const ocupado = estado === "render" || estado === "salvando"

  async function preparar() {
    if (!pecaId) return
    setErro(null)
    setEstado("render")
    try {
      const urls = await getImageUrls()
      if (!urls.length) {
        setErro("Nenhuma imagem foi gerada.")
        setEstado("idle")
        return
      }
      setEstado("salvando")
      const res = await prepararArteParaAgendar(tipo, pecaId, urls)
      if (!res.ok) {
        setErro(res.error)
        setEstado("idle")
        return
      }
      setEstado("ok")
      onPreparado?.(res.imagens)
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao preparar a arte.")
      setEstado("idle")
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={preparar}
        disabled={!pecaId || ocupado}
        title={
          pecaId
            ? "Gera a arte no tamanho final e guarda, pra esta peça poder ser publicada automaticamente na data agendada"
            : "Salve a peça primeiro"
        }
      >
        {ocupado ? (
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        ) : estado === "ok" ? (
          <Check className="w-3.5 h-3.5 mr-1.5" />
        ) : (
          <CalendarCheck className="w-3.5 h-3.5 mr-1.5" />
        )}
        {estado === "render"
          ? "Gerando arte…"
          : estado === "salvando"
            ? "Guardando…"
            : estado === "ok"
              ? "Pronto pra agendar"
              : "Preparar pra agendar"}
      </Button>
      {erro && <span className="text-xs text-red-400 max-w-xs">{erro}</span>}
    </div>
  )
}
