"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Bookmark,
  Eye,
  Heart,
  Instagram,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  Users,
  ExternalLink,
} from "lucide-react"
import type {
  AccountInsights,
  InstagramMedia,
  InstagramProfile,
  MediaInsights,
} from "@/lib/instagram/meta"

type MediaRow = InstagramMedia & { insights: MediaInsights | null; viaSyncPost: boolean }

interface Payload {
  ok: boolean
  connected?: boolean
  expired?: boolean
  error?: string
  profile?: InstagramProfile
  account?: AccountInsights
  followers?: Array<{ date: string; value: number }>
  media?: MediaRow[]
}

interface Status {
  connected: boolean
  username: string | null
  expiresAt: string | null
  configured: boolean
}

const fmt = (n: number | undefined) =>
  typeof n === "number" ? n.toLocaleString("pt-BR") : "–"

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })

function Metrica({
  icone: Icone,
  tile,
  valor,
  rotulo,
}: {
  icone: typeof Users
  tile: string
  valor: string
  rotulo: string
}) {
  return (
    <div className="nv-card nv-fade p-4 flex items-center gap-3">
      <span className={`nv-tile ${tile} w-10 h-10 shrink-0`}>
        <Icone className="w-[18px] h-[18px]" strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p
          className="text-[20px] font-bold leading-none tabular-nums"
          style={{ color: "var(--nv-text)" }}
        >
          {valor}
        </p>
        <p className="text-[11.5px] mt-1" style={{ color: "var(--nv-text-subtle)" }}>
          {rotulo}
        </p>
      </div>
    </div>
  )
}

/** Série de seguidores em barras puras de CSS: sem lib de gráfico. */
function Seguidores({ serie }: { serie: Array<{ date: string; value: number }> }) {
  if (serie.length < 2) return null
  const max = Math.max(...serie.map((s) => s.value), 1)
  const primeiro = serie[0].value
  const ultimo = serie[serie.length - 1].value
  const delta = ultimo - primeiro
  const deltaClass = delta > 0 ? "nv-delta-up" : delta < 0 ? "nv-delta-down" : "nv-delta-flat"
  return (
    <div className="nv-card nv-fade p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p
            className="text-[10.5px] uppercase tracking-wider"
            style={{ color: "var(--nv-text-subtle)" }}
          >
            Seguidores
          </p>
          <p
            className="text-[22px] font-bold leading-none mt-1 tabular-nums"
            style={{ color: "var(--nv-text)" }}
          >
            {fmt(ultimo)}
          </p>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full tabular-nums ${deltaClass}`}>
          {delta > 0 ? "+" : ""}
          {fmt(delta)} em 30 dias
        </span>
      </div>
      <div className="flex items-end gap-[3px] h-20">
        {serie.map((s) => (
          <div
            key={s.date}
            title={`${dataCurta(s.date)}: ${fmt(s.value)}`}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${Math.max(4, (s.value / max) * 100)}%`,
              background: "linear-gradient(180deg, #12A5F5 0%, #0D4396 100%)",
              opacity: 0.85,
            }}
          />
        ))}
      </div>
      <div
        className="flex justify-between mt-2 text-[10.5px]"
        style={{ color: "var(--nv-text-subtle)" }}
      >
        <span>{dataCurta(serie[0].date)}</span>
        <span>{dataCurta(serie[serie.length - 1].date)}</span>
      </div>
    </div>
  )
}

function Post({ m }: { m: MediaRow }) {
  const thumb = m.thumbnailUrl ?? m.mediaUrl
  const i = m.insights
  return (
    <a
      href={m.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="nv-card nv-card-hover nv-fade overflow-hidden flex flex-col"
    >
      <div className="relative aspect-square w-full" style={{ background: "var(--nv-sheet)" }}>
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {m.viaSyncPost && (
          <span
            className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "var(--nv-grad-primary)", color: "#fff" }}
          >
            <Sparkles className="w-3 h-3" /> SyncPost
          </span>
        )}
        {m.mediaType === "CAROUSEL_ALBUM" && (
          <span
            className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded nv-pill"
            style={{ color: "var(--nv-text)" }}
          >
            Carrossel
          </span>
        )}
      </div>
      <div className="p-3 space-y-2">
        <p
          className="text-[11px] line-clamp-2 min-h-[2.6em]"
          style={{ color: "var(--nv-text-muted)" }}
        >
          {m.caption || "Sem legenda"}
        </p>
        <div
          className="grid grid-cols-4 gap-1 text-[11px] tabular-nums"
          style={{ color: "var(--nv-text)" }}
        >
          <span className="inline-flex items-center gap-1" title="Alcance">
            <Eye className="w-3 h-3 opacity-60" /> {fmt(i?.reach)}
          </span>
          <span className="inline-flex items-center gap-1" title="Curtidas">
            <Heart className="w-3 h-3 opacity-60" /> {fmt(i?.likes ?? m.likeCount)}
          </span>
          <span className="inline-flex items-center gap-1" title="Comentários">
            <MessageCircle className="w-3 h-3 opacity-60" /> {fmt(i?.comments ?? m.commentsCount)}
          </span>
          <span className="inline-flex items-center gap-1" title="Salvamentos">
            <Bookmark className="w-3 h-3 opacity-60" /> {fmt(i?.saved)}
          </span>
        </div>
        <p
          className="text-[10.5px] flex items-center justify-between"
          style={{ color: "var(--nv-text-subtle)" }}
        >
          {dataCurta(m.timestamp)}
          <ExternalLink className="w-3 h-3" />
        </p>
      </div>
    </a>
  )
}

const RESUMO: Array<[string, keyof AccountInsights, typeof Heart]> = [
  ["Curtidas", "likes", Heart],
  ["Comentários", "comments", MessageCircle],
  ["Salvamentos", "saves", Bookmark],
  ["Compartilhamentos", "shares", Send],
]

export function MetricasClient() {
  const [status, setStatus] = useState<Status | null>(null)
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [aviso, setAviso] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const st: Status = await fetch("/api/instagram/status").then((r) => r.json())
      setStatus(st)
      if (st.connected) {
        const p: Payload = await fetch("/api/instagram/insights").then((r) => r.json())
        setData(p)
      } else {
        setData(null)
      }
    } catch {
      setAviso("Não deu pra falar com o Instagram agora. Tente de novo em instantes.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const ig = p.get("ig")
    if (ig === "erro") setAviso("Não deu pra conectar o Instagram. Tente de novo.")
    if (ig) {
      p.delete("ig")
      const qs = p.toString()
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""))
    }
    void carregar()
  }, [carregar])

  function conectar() {
    const returnTo = encodeURIComponent("/dashboard/instagram")
    window.location.href = `/api/instagram/connect?returnTo=${returnTo}`
  }

  async function desconectar() {
    await fetch("/api/instagram/status", { method: "DELETE" }).catch(() => {})
    setData(null)
    setStatus((s) => (s ? { ...s, connected: false, username: null } : s))
  }

  if (loading && !status) {
    return (
      <div className="nv-card p-10 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--nv-text-muted)" }} />
      </div>
    )
  }

  if (!status?.configured) {
    return (
      <div className="nv-card nv-fade p-5 text-[13px]" style={{ color: "var(--nv-text-muted)" }}>
        A integração com o Instagram ainda está sendo configurada neste ambiente.
      </div>
    )
  }

  if (!status.connected) {
    return (
      <div className="nv-upgrade nv-fade p-6">
        <div className="relative z-10 max-w-xl space-y-3">
          <p className="text-[18px] font-bold leading-tight" style={{ color: "var(--nv-text)" }}>
            Conecte o Instagram da marca
          </p>
          <p className="text-[12.5px]" style={{ color: "var(--nv-text-muted)" }}>
            Precisa ser uma conta profissional (Comercial ou Criador de conteúdo). Depois
            de conectar, você publica carrosséis e posts sem sair daqui e acompanha
            alcance, salvamentos e seguidores nesta página. A gente nunca publica nada
            sem você clicar.
          </p>
          {aviso && (
            <p className="text-[12px]" style={{ color: "#f6c35a" }}>
              {aviso}
            </p>
          )}
          <button
            type="button"
            onClick={conectar}
            className="nv-btn-primary px-4 py-2 text-[13px] inline-flex items-center gap-2"
          >
            <Instagram className="w-4 h-4" /> Conectar Instagram
          </button>
        </div>
      </div>
    )
  }

  const profile = data?.profile
  const acc: AccountInsights = data?.account ?? {}
  const media = data?.media ?? []

  return (
    <div className="space-y-5">
      {/* Conta conectada */}
      <div className="nv-card nv-fade p-4 flex items-center gap-3 flex-wrap">
        {profile?.profilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.profilePictureUrl}
            alt=""
            className="w-11 h-11 rounded-full object-cover"
          />
        ) : (
          <span className="nv-tile nv-tile-pink w-11 h-11">
            <Instagram className="w-5 h-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold" style={{ color: "var(--nv-text)" }}>
            @{profile?.username ?? status.username}
          </p>
          <p className="text-[11.5px]" style={{ color: "var(--nv-text-subtle)" }}>
            {profile
              ? `${fmt(profile.followersCount)} seguidores · ${fmt(profile.mediaCount)} publicações`
              : "Conectado"}
            {status.expiresAt && ` · conexão válida até ${dataCurta(status.expiresAt)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void carregar()}
          disabled={loading}
          className="nv-btn-ghost px-3 py-1.5 text-[12px] inline-flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </button>
        <button
          type="button"
          onClick={desconectar}
          className="text-[12px] px-2"
          style={{ color: "var(--nv-text-subtle)" }}
        >
          Desconectar
        </button>
      </div>

      {data && !data.ok && (
        <div className="nv-card nv-fade p-4 text-[12.5px]" style={{ color: "#f6c35a" }}>
          {data.expired
            ? "A conexão expirou. Desconecte e conecte de novo."
            : (data.error ?? "Não deu pra ler as métricas.")}
          {!data.expired && (
            <span className="block mt-1" style={{ color: "var(--nv-text-subtle)" }}>
              Se a conta foi conectada antes da permissão de métricas existir, desconecte e
              conecte de novo pra autorizar.
            </span>
          )}
        </div>
      )}

      {data?.ok && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metrica
              icone={Eye}
              tile="nv-tile-blue"
              valor={fmt(acc.reach)}
              rotulo="Alcance (contas únicas)"
            />
            <Metrica
              icone={Sparkles}
              tile="nv-tile-purple"
              valor={fmt(acc.views)}
              rotulo="Visualizações"
            />
            <Metrica
              icone={Users}
              tile="nv-tile-green"
              valor={fmt(acc.accounts_engaged)}
              rotulo="Contas que interagiram"
            />
            <Metrica
              icone={Send}
              tile="nv-tile-orange"
              valor={fmt(acc.total_interactions)}
              rotulo="Interações"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <Seguidores serie={data.followers ?? []} />
            <div className="nv-card nv-fade p-5 grid grid-cols-2 gap-4 content-start">
              {RESUMO.map(([rotulo, chave, Icone]) => (
                <div key={chave}>
                  <p
                    className="text-[10.5px] uppercase tracking-wider inline-flex items-center gap-1"
                    style={{ color: "var(--nv-text-subtle)" }}
                  >
                    <Icone className="w-3 h-3" /> {rotulo}
                  </p>
                  <p
                    className="text-[20px] font-bold tabular-nums"
                    style={{ color: "var(--nv-text)" }}
                  >
                    {fmt(acc[chave])}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[13px] font-semibold mb-3" style={{ color: "var(--nv-text)" }}>
              Últimas publicações
            </p>
            {media.length === 0 ? (
              <div className="nv-card p-5 text-[12.5px]" style={{ color: "var(--nv-text-muted)" }}>
                Nenhuma publicação encontrada nessa conta ainda.
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                {media.map((m) => (
                  <Post key={m.id} m={m} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
