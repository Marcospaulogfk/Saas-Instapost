"use client"

import { useMemo, useState } from "react"
import { Sparkles, ChevronRight, X, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FORMATO_LABEL, OBJETIVO_LABEL } from "@/lib/planejar"
import { totalDeSlots } from "@/lib/pautas/agenda"
import {
  DIA_SEMANA_LABEL,
  MAX_POSTS_SEMANA,
  MIN_POSTS_SEMANA,
  PERIODO_LABEL,
  REDE_LABEL,
  type GerarCalendarioResponse,
  type PautaGerada,
  type PautaPeriodo,
  type PautaRede,
} from "@/lib/pautas/types"
import { salvarPautas } from "@/app/actions/pautas"

// =====================================================================
// Calendário Inteligente — o gancho do funil.
//
// Gerar PAUTA é grátis (badge "0 tokens", explícito na UI). Só materializar
// a pauta em post cobra, e isso acontece no card do pipeline. A promessa de
// custo tem que estar visível ANTES do clique: é ela que faz o usuário
// encher o calendário sem medo.
// =====================================================================

const PRESETS_POR_SEMANA = [3, 5, 7]
const DIAS_PADRAO = [1, 3, 5] // seg/qua/sex — cadência que não cansa a audiência

type Etapa = "config" | "preview"

export function CalendarioInteligenteCard({
  brandId,
  onSaved,
}: {
  brandId: string | null
  onSaved: () => void
}) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      {/* Faixa cheia de marca: é a chamada principal do calendário e precisa
          pesar mais que o resto da tela — cor sólida, sem gradiente nem glow
          (DESIGN.md §6). */}
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="w-full mb-4 rounded-2xl bg-brand-600 hover:bg-brand-500 p-5 flex items-center gap-4 transition-colors text-left"
      >
        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-bold text-white">Recomendações IA</p>
            <BadgeGratis />
          </div>
          <p className="text-[13px] text-white/80 mt-0.5">
            Gere um calendário inteligente baseado nas suas inspirações — você só
            gasta token quando decidir gerar o post.
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-white/80 flex-shrink-0" />
      </button>

      {aberto && (
        <ModalCalendario
          brandId={brandId}
          onClose={() => setAberto(false)}
          onSaved={() => {
            setAberto(false)
            onSaved()
          }}
        />
      )}
    </>
  )
}

/** Badge de custo zero. Repetido no card e no botão — é o argumento. */
export function BadgeGratis() {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
      0 tokens
    </span>
  )
}

function ModalCalendario({
  brandId,
  onClose,
  onSaved,
}: {
  brandId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const [etapa, setEtapa] = useState<Etapa>("config")
  const [periodo, setPeriodo] = useState<PautaPeriodo>("semana")
  const [porSemana, setPorSemana] = useState(3)
  const [custom, setCustom] = useState(false)
  const [dias, setDias] = useState<number[]>(DIAS_PADRAO)
  const [rede, setRede] = useState<PautaRede>("instagram")

  const [gerando, setGerando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pautas, setPautas] = useState<PautaGerada[]>([])

  const total = useMemo(
    () => totalDeSlots(periodo, porSemana),
    [periodo, porSemana],
  )

  function toggleDia(d: number) {
    setDias((atual) =>
      atual.includes(d) ? atual.filter((x) => x !== d) : [...atual, d].sort(),
    )
  }

  async function gerar() {
    if (!brandId) {
      setErro("Selecione ou crie uma marca antes de gerar pautas.")
      return
    }
    if (dias.length === 0) {
      setErro("Escolha pelo menos um dia da semana.")
      return
    }
    setErro(null)
    setGerando(true)
    try {
      const res = await fetch("/api/calendario/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          periodo,
          postsPorSemana: porSemana,
          diasSemana: dias,
          rede,
        }),
      })
      const json = (await res.json()) as GerarCalendarioResponse & {
        error?: string
      }
      if (!res.ok) throw new Error(json.error ?? "Falha ao gerar")
      if (!json.pautas?.length) throw new Error("A IA não devolveu pautas.")
      setPautas(json.pautas)
      setEtapa("preview")
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err))
    } finally {
      setGerando(false)
    }
  }

  async function salvar() {
    if (!brandId || !pautas.length) return
    setSalvando(true)
    const res = await salvarPautas(brandId, pautas, rede)
    setSalvando(false)
    if (!res.ok) {
      setErro(res.error)
      return
    }
    onSaved()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-background-tertiary border border-border-medium p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">
              Calendário Inteligente
            </h3>
            <BadgeGratis />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {etapa === "config" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Período</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["semana", "mes"] as const).map((p) => (
                  <Opcao
                    key={p}
                    ativo={periodo === p}
                    onClick={() => setPeriodo(p)}
                  >
                    {PERIODO_LABEL[p]}
                  </Opcao>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Posts por semana</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRESETS_POR_SEMANA.map((q) => (
                  <Opcao
                    key={q}
                    ativo={!custom && porSemana === q}
                    onClick={() => {
                      setCustom(false)
                      setPorSemana(q)
                    }}
                  >
                    {q}
                  </Opcao>
                ))}
                <Opcao ativo={custom} onClick={() => setCustom(true)}>
                  Outro
                </Opcao>
              </div>
              {custom && (
                <Input
                  type="number"
                  min={MIN_POSTS_SEMANA}
                  max={MAX_POSTS_SEMANA}
                  value={porSemana}
                  onChange={(e) =>
                    setPorSemana(
                      Math.max(
                        MIN_POSTS_SEMANA,
                        Math.min(MAX_POSTS_SEMANA, Number(e.target.value) || 1),
                      ),
                    )
                  }
                  className="mt-1.5"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Dias preferidos</Label>
              <div className="grid grid-cols-7 gap-1">
                {DIA_SEMANA_LABEL.map((label, idx) => (
                  <Opcao
                    key={label}
                    ativo={dias.includes(idx)}
                    onClick={() => toggleDia(idx)}
                  >
                    {label}
                  </Opcao>
                ))}
              </div>
              {/* O usuário precisa entender o efeito da combinação antes de
                  gerar — senão só descobre olhando o calendário depois. */}
              <p className="text-[11px] text-text-muted">
                {total} pauta{total === 1 ? "" : "s"} no total
                {porSemana > dias.length && dias.length > 0
                  ? " — como você pediu mais posts que dias, algum dia recebe mais de um."
                  : "."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Rede</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["instagram", "facebook", "linkedin"] as const).map((r) => (
                  <Opcao key={r} ativo={rede === r} onClick={() => setRede(r)}>
                    {REDE_LABEL[r]}
                  </Opcao>
                ))}
              </div>
            </div>

            {erro && <p className="text-xs text-red-400">{erro}</p>}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={gerar}
                disabled={gerando || !brandId}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                {gerando ? "Gerando…" : "Gerar Calendário"}
              </Button>
            </div>
            <p className="text-[11px] text-text-muted text-center">
              Gerar as pautas não consome tokens. Você só paga ao gerar o post.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary">
              {pautas.length} pauta{pautas.length === 1 ? "" : "s"} para{" "}
              {REDE_LABEL[rede]}. Tire o que não fizer sentido antes de salvar.
            </p>
            <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
              {pautas.map((p, i) => (
                <div
                  key={`${p.data}-${i}`}
                  className="rounded-lg border border-border-subtle bg-background-secondary/40 p-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] tabular-nums text-text-muted">
                          {p.data.split("-").reverse().slice(0, 2).join("/")}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {FORMATO_LABEL[p.formato]} · {OBJETIVO_LABEL[p.objetivo]}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium text-text-primary">
                        {p.titulo}
                      </p>
                      {p.descricao && (
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          {p.descricao}
                        </p>
                      )}
                      {p.motivo && (
                        <p className="text-[11px] text-text-muted mt-1">
                          Por quê: {p.motivo}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPautas((l) => l.filter((_, idx) => idx !== i))
                      }
                      className="text-text-muted hover:text-red-400 p-1"
                      aria-label="Remover pauta"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {erro && <p className="text-xs text-red-400">{erro}</p>}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEtapa("config")}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Refazer
              </Button>
              <Button
                type="button"
                onClick={salvar}
                disabled={salvando || pautas.length === 0}
                className="flex-1"
              >
                {salvando
                  ? "Salvando…"
                  : `Adicionar ${pautas.length} ao calendário`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Opcao({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs h-9 rounded border px-1 transition-colors ${
        ativo
          ? "bg-brand-600 border-brand-600 text-white"
          : "border-border-subtle text-text-secondary hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  )
}
