"use client"

// ============================================================================
// Dashboard V2 — client. Layout NyxFlow adaptado pro SyncPost com dados reais,
// modo dark/white (sidebar sempre preta, logo branca) e cards de posts no
// mesmo motor dos templates: SlidePreview ao vivo + navegação por slides.
// ============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Inter } from "next/font/google"
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Download,
  GalleryHorizontalEnd,
  Loader2,
  Moon,
  Plus,
  Sparkles,
  Store,
  Sun,
  Wallet,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { NAV_ITEMS } from "@/components/dashboard/nav-items"
import { Logo } from "@/components/brand/logo"
import {
  SlidePreview,
  type EditorialStyle,
  type PreviewSlide,
} from "@/components/carousel/slide-preview"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setActiveBrand } from "@/app/actions/brands"
import { signOut } from "@/app/actions/auth"
import { getBrandGradient } from "@/lib/brand-colors"

// Mesma fonte display dos previews do editor/templates
const inter = Inter({ subsets: ["latin"], weight: ["900"] })

// ----------------------------------------------------------------------------
// Paletas — dark (referência NyxFlow) e white. Sidebar é SEMPRE preta.
// ----------------------------------------------------------------------------
const DARK = {
  bg: "#07090F",
  card: "#0C111D",
  cardSoft: "#0E1422",
  line: "#161D2E",
  lineSoft: "#121828",
  text: "#E6EAF2",
  sub: "#8A94A8",
  muted: "#5B6478",
  brand: "#832FEC",
  brandSoft: "#9C5FF1",
  green: "#34D399",
  red: "#FB7185",
  gold: "#F5B94A",
  cyan: "#38BDF8",
}

const LIGHT: Palette = {
  bg: "#F5F6FA",
  card: "#FFFFFF",
  cardSoft: "#F6F7FB",
  line: "#E4E7EF",
  lineSoft: "#EDEFF5",
  text: "#14181F",
  sub: "#4C5568",
  muted: "#8A94A8",
  brand: "#7320E6",
  brandSoft: "#7320E6",
  green: "#0B9E6E",
  red: "#E02D4B",
  gold: "#B87407",
  cyan: "#0284C7",
}

type Palette = typeof DARK

const MAGENTA = "#D53FF4"
const CORE = "#7320E6"
const BRAND_GRADIENT = `linear-gradient(135deg, ${MAGENTA}, ${CORE})`

const POST_GRADIENTS = [
  `linear-gradient(160deg, ${MAGENTA}, ${CORE})`,
  `linear-gradient(160deg, ${CORE}, #38BDF8)`,
  `linear-gradient(160deg, #38BDF8, #34D399)`,
  `linear-gradient(160deg, #F5B94A, #FB7185)`,
  `linear-gradient(160deg, #9C5FF1, ${MAGENTA})`,
  `linear-gradient(160deg, #34D399, #38BDF8)`,
]

const PaletteContext = createContext<Palette>(DARK)
const useC = () => useContext(PaletteContext)

// ----------------------------------------------------------------------------
// Tipos das props (dados reais vindos do server)
// ----------------------------------------------------------------------------
export interface CarouselPreviewData {
  slides: PreviewSlide[]
  template: "editorial" | "cinematic" | "hybrid"
  editorialStyle: EditorialStyle
  colors: string[]
  handle: string
  brandName: string
  format: "feed" | "stories"
}

export interface PostItem {
  id: string
  title: string
  href: string
  image: string | null
  brand: string | null
  kind: "Carrossel" | "Post" | "Projeto"
  detail: string
  created_at: string
  /** Presente nos carrosséis: preview ao vivo navegável. */
  preview?: CarouselPreviewData | null
}

interface BrandItem {
  id: string
  name: string
  logo_url: string | null
}

export interface DashboardV2Props {
  userName: string
  userEmail: string
  userInitials: string
  userAvatarUrl: string | null
  credits: number
  planLabel: string
  planCreditsMonthly: number
  creditsUsed: number
  brands: BrandItem[]
  activeBrand: BrandItem | null
  posts: PostItem[]
  singleDates: string[]
  carouselDates: string[]
  projectDates: string[]
  scheduledDates: string[]
  brandsCount: number
  projectsCount: number
  slidesTotal: number
  periodLabel: string
}

// ----------------------------------------------------------------------------
// Helpers de série temporal
// ----------------------------------------------------------------------------
type Period = "Semana" | "Mês" | "Trimestre" | "Ano"

const MONTH_SHORT = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function countInMonth(dates: string[], monthOffset: number) {
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  return dates.filter((s) => {
    const d = new Date(s)
    return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth()
  }).length
}

function weeklySeries(dates: string[], weeks = 8): number[] {
  const now = startOfDay(new Date()).getTime()
  const WEEK = 7 * 24 * 60 * 60 * 1000
  const buckets = new Array(weeks).fill(0)
  for (const s of dates) {
    const diff = now - startOfDay(new Date(s)).getTime()
    const idx = weeks - 1 - Math.floor(diff / WEEK)
    if (idx >= 0 && idx < weeks) buckets[idx]++
  }
  return buckets
}

function chartSeries(singles: string[], carousels: string[], period: Period) {
  const now = new Date()
  const spec =
    period === "Semana"
      ? { unit: "day" as const, count: 7 }
      : period === "Mês"
        ? { unit: "day" as const, count: 30 }
        : period === "Trimestre"
          ? { unit: "month" as const, count: 3 }
          : { unit: "month" as const, count: 12 }

  const buckets: { key: string; label: string; posts: number; carrosseis: number }[] = []
  const index = new Map<string, number>()

  for (let i = spec.count - 1; i >= 0; i--) {
    let key: string
    let label: string
    if (spec.unit === "day") {
      const d = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000))
      key = d.toISOString().slice(0, 10)
      label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
    } else {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      key = `${d.getFullYear()}-${d.getMonth()}`
      label = MONTH_SHORT[d.getMonth()]
    }
    index.set(key, buckets.length)
    buckets.push({ key, label, posts: 0, carrosseis: 0 })
  }

  const add = (dates: string[], field: "posts" | "carrosseis") => {
    for (const s of dates) {
      const d = new Date(s)
      const key =
        spec.unit === "day"
          ? startOfDay(d).toISOString().slice(0, 10)
          : `${d.getFullYear()}-${d.getMonth()}`
      const idx = index.get(key)
      if (idx !== undefined) buckets[idx][field]++
    }
  }
  add(singles, "posts")
  add(carousels, "carrosseis")
  return buckets
}

function deltaLabel(current: number, previous: number): { text: string; tone: "up" | "flat" } {
  if (previous === 0) return current > 0 ? { text: "novo", tone: "up" } : { text: "—", tone: "flat" }
  const pct = ((current - previous) / previous) * 100
  if (Math.abs(pct) < 0.5) return { text: "estável", tone: "flat" }
  return { text: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`, tone: pct > 0 ? "up" : "flat" }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "agora"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d`
  return `${Math.floor(d / 30)}mês`
}

const toSeries = (arr: number[]) => arr.map((v, i) => ({ i, v }))

// ----------------------------------------------------------------------------
// Blocos visuais
// ----------------------------------------------------------------------------
function MonoLabel({ children, color }: { children: ReactNode; color?: string }) {
  const C = useC()
  return (
    <div
      className="text-[9.5px] font-mono uppercase tracking-[0.14em]"
      style={{ color: color ?? C.muted }}
    >
      {children}
    </div>
  )
}

function CardTitle({
  title,
  sub,
  right,
}: {
  title: string
  sub?: string
  right?: ReactNode
}) {
  const C = useC()
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <div
          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.14em]"
          style={{ color: C.brandSoft }}
        >
          <span className="text-[8px]">◆</span> {title}
        </div>
        {sub && (
          <div className="text-[12px]" style={{ color: C.sub }}>
            {sub}
          </div>
        )}
      </div>
      {right}
    </div>
  )
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={toSeries(data)} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.6}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface Kpi {
  label: string
  value: string
  unit?: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  accent: string
  delta: string
  deltaTone: string
  note: string
  spark?: number[]
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const C = useC()
  const Icon = kpi.icon
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-4"
      style={{ background: C.card, borderColor: C.line }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-80"
        style={{ background: `linear-gradient(90deg, transparent, ${kpi.accent}, transparent)` }}
      />
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${kpi.accent}1F`, color: kpi.accent }}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <MonoLabel>{kpi.label}</MonoLabel>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-[30px] font-semibold leading-none tracking-tight" style={{ color: C.text }}>
          {kpi.value}
        </span>
        {kpi.unit && (
          <span className="text-[15px] font-medium" style={{ color: C.muted }}>
            {kpi.unit}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        {kpi.spark && kpi.spark.some((v) => v > 0) ? (
          <Sparkline data={kpi.spark} color={kpi.accent} />
        ) : (
          <div className="h-8 w-20" />
        )}
        <div className="flex items-center gap-1.5 text-right">
          <span
            className="rounded-md px-1.5 py-0.5 text-[10.5px] font-medium"
            style={{ background: `${kpi.deltaTone}1A`, color: kpi.deltaTone }}
          >
            {kpi.delta}
          </span>
          <span className="text-[10px]" style={{ color: C.muted }}>
            {kpi.note}
          </span>
        </div>
      </div>
    </div>
  )
}

function BrandAvatar({ brand, small }: { brand: BrandItem; small?: boolean }) {
  const sizeClass = small ? "h-6 w-6 rounded" : "h-9 w-9 rounded-lg"
  if (brand.logo_url) {
    return (
      <div className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden bg-white/10`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-contain" />
      </div>
    )
  }
  return (
    <div className={`${sizeClass} ${getBrandGradient(brand.id)} flex shrink-0 items-center justify-center`}>
      <span className={`${small ? "text-[10px]" : "text-sm"} font-bold text-white`}>
        {brand.name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Preview escalado — mesma mecânica do CarouselCover/templates (REF_W = 420)
// ----------------------------------------------------------------------------
const REF_W = 420

function ScaledSlide({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setScale(el.clientWidth / REF_W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden bg-black">
      <div
        style={{
          width: REF_W,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Card de post gerado — igual aos cards de template: preview ao vivo,
// setas no hover, pontinhos e CTA.
// ----------------------------------------------------------------------------
function PostCard({ post, index }: { post: PostItem; index: number }) {
  const C = useC()
  const [active, setActive] = useState(0)
  const slides = post.preview?.slides ?? []
  const total = slides.length
  const go = (i: number) => setActive((i + total) % total)

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl border transition-colors"
      style={{ background: C.card, borderColor: C.line }}
    >
      {/* Preview 4:5 */}
      <div className="relative aspect-[4/5]">
        {total > 0 && post.preview ? (
          <ScaledSlide>
            <SlidePreview
              slide={slides[active]}
              totalSlides={total}
              template={post.preview.template}
              brandColors={post.preview.colors}
              fontClass={inter.className}
              editorialStyle={post.preview.editorialStyle}
              handle={post.preview.handle}
              brandLabel={post.preview.brandName}
              showDevBadges={false}
              format={post.preview.format}
            />
          </ScaledSlide>
        ) : post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image}
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 opacity-80"
            style={{ background: POST_GRADIENTS[index % POST_GRADIENTS.length] }}
          />
        )}

        <span
          className="absolute left-2 top-2 z-10 rounded-md px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.1em] text-white"
          style={{ background: "rgba(7,9,15,0.65)" }}
        >
          {post.kind}
        </span>

        {/* Setas — aparecem no hover, navegam os slides reais */}
        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Slide anterior"
              onClick={() => go(active - 1)}
              className="absolute left-2 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100"
              style={{ background: "rgba(7,9,15,0.6)" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Próximo slide"
              onClick={() => go(active + 1)}
              className="absolute right-2 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100"
              style={{ background: "rgba(7,9,15,0.6)" }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span
              className="absolute bottom-2 right-2 z-10 rounded-md px-1.5 py-0.5 text-[9px] font-mono text-white"
              style={{ background: "rgba(7,9,15,0.65)" }}
            >
              {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </>
        )}
      </div>

      {/* Rodapé — título + pontinhos + meta + CTA (mesma estrutura do template) */}
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="min-w-0 truncate text-[13.5px] font-semibold" style={{ color: C.text }}>
            {post.title}
          </h3>
          {total > 1 && (
            <div className="flex shrink-0 items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ver slide ${i + 1}`}
                  onClick={() => setActive(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === active ? 16 : 6,
                    background: i === active ? C.brandSoft : C.line,
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-[10.5px]" style={{ color: C.muted }}>
          <span className="truncate">
            {post.brand ?? "—"} · {post.detail}
          </span>
          <span className="shrink-0 font-mono" suppressHydrationWarning>
            {timeAgo(post.created_at)}
          </span>
        </div>
        <Link
          href={post.href}
          className="mt-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-medium text-white transition-colors"
          style={{ background: CORE }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#5F14D6")}
          onMouseLeave={(e) => (e.currentTarget.style.background = CORE)}
        >
          Abrir {post.kind.toLowerCase()}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Sidebar — SEMPRE preta (logo branca oficial), sem widget de créditos
// ----------------------------------------------------------------------------
function Sidebar(props: DashboardV2Props) {
  const C = DARK
  const pathname = usePathname()
  const router = useRouter()
  const [isSwitching, startSwitching] = useTransition()
  const [switchingId, setSwitchingId] = useState<string | null>(null)

  function handleSwitchBrand(brandId: string) {
    if (!brandId || brandId === props.activeBrand?.id) return
    setSwitchingId(brandId)
    startSwitching(async () => {
      const result = await setActiveBrand(brandId)
      if (result.ok) router.refresh()
      setSwitchingId(null)
    })
  }

  async function handleSignOut() {
    await signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <PaletteContext.Provider value={DARK}>
      <aside
        className="hidden w-[240px] shrink-0 flex-col border-r lg:flex"
        style={{ background: "#000000", borderColor: C.line }}
      >
        {/* Logo oficial branca */}
        <div className="px-4 pb-2 pt-5">
          <Link href="/dashboard" className="mb-4 flex items-center px-1">
            <Logo size={28} variant="light" />
          </Link>

          {/* Marca ativa */}
          {props.activeBrand && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors hover:border-[#2A3347]"
                  style={{ background: C.cardSoft, borderColor: C.line }}
                  aria-label="Trocar marca"
                >
                  <BrandAvatar brand={props.activeBrand} />
                  <div className="min-w-0 flex-1">
                    <MonoLabel>Marca ativa</MonoLabel>
                    <p className="truncate text-[13px] font-medium" style={{ color: C.text }}>
                      {props.activeBrand.name}
                    </p>
                  </div>
                  {isSwitching ? (
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: C.muted }} />
                  ) : (
                    <ChevronsUpDown className="h-3.5 w-3.5" style={{ color: C.muted }} />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60">
                <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
                  Trocar marca
                </div>
                {props.brands.map((b) => (
                  <DropdownMenuItem
                    key={b.id}
                    onSelect={(e) => {
                      e.preventDefault()
                      handleSwitchBrand(b.id)
                    }}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <BrandAvatar brand={b} small />
                    <span className="flex-1 truncate text-[13px]">{b.name}</span>
                    {switchingId === b.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : b.id === props.activeBrand?.id ? (
                      <Check className="h-3.5 w-3.5" style={{ color: C.brandSoft }} />
                    ) : null}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/marcas" className="cursor-pointer">
                    Ver todas as marcas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/onboarding" className="cursor-pointer">
                    Adicionar nova marca
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* CTA */}
        <div className="mb-3 mt-3 px-4">
          <Link
            href="/dashboard/criar"
            className="group flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-white transition-colors"
            style={{ background: CORE }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#5F14D6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = CORE)}
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Criar conteúdo
          </Link>
        </div>

        {/* Menu real do app */}
        <div className="px-4 pb-1 pt-3">
          <MonoLabel>Menu</MonoLabel>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname.startsWith("/dashboard-v2"))
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-[13px] transition-colors"
                style={
                  isActive
                    ? { background: `${C.brand}14`, borderColor: `${C.brand}33`, color: C.text }
                    : { borderColor: "transparent", color: C.sub }
                }
              >
                <Icon className="h-4 w-4" style={{ color: isActive ? C.brandSoft : C.muted }} />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ background: `${C.brandSoft}1F`, color: C.brandSoft }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Usuário */}
        <div className="border-t p-3" style={{ borderColor: C.line }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04]">
                {props.userAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={props.userAvatarUrl}
                    alt={props.userName}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-semibold text-white"
                    style={{ background: BRAND_GRADIENT }}
                  >
                    {props.userInitials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium" style={{ color: C.text }}>
                    {props.userName}
                  </div>
                  <div className="truncate text-[10px]" style={{ color: C.muted }}>
                    Plano {props.planLabel} · {props.credits.toLocaleString("pt-BR")} créditos
                  </div>
                </div>
                <ChevronUp className="h-3.5 w-3.5" style={{ color: C.muted }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/configuracoes">Configurações</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/pricing">Plano e cobrança</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  void handleSignOut()
                }}
                className="text-red-400 focus:text-red-400"
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </PaletteContext.Provider>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  const C = useC()
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border px-3 py-2 text-[11px] shadow-xl"
      style={{ background: C.card, borderColor: C.line, color: C.text }}
    >
      <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.12em]" style={{ color: C.muted }}>
        {label}
      </div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span style={{ color: C.sub }}>{p.name}</span>
          <span className="ml-auto font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Página
// ----------------------------------------------------------------------------
export function DashboardV2Client(props: DashboardV2Props) {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [period, setPeriod] = useState<Period>("Ano")
  const C = theme === "dark" ? DARK : LIGHT

  useEffect(() => {
    if (localStorage.getItem("spv2-theme") === "light") setTheme("light")
  }, [])

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    localStorage.setItem("spv2-theme", next)
  }

  const allPostDates = useMemo(
    () => [...props.singleDates, ...props.carouselDates, ...props.projectDates],
    [props.singleDates, props.carouselDates, props.projectDates],
  )

  const totalPosts = allPostDates.length
  const totalCarousels = props.carouselDates.length
  const totalSingles = props.singleDates.length

  const postsThisMonth = useMemo(() => countInMonth(allPostDates, 0), [allPostDates])
  const postsLastMonth = useMemo(() => countInMonth(allPostDates, -1), [allPostDates])
  const carouselsThisMonth = useMemo(() => countInMonth(props.carouselDates, 0), [props.carouselDates])
  const carouselsLastMonth = useMemo(() => countInMonth(props.carouselDates, -1), [props.carouselDates])

  const scheduledNext7 = useMemo(() => {
    const start = startOfDay(new Date())
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return props.scheduledDates.filter((s) => {
      const d = new Date(s + "T00:00:00")
      return d >= start && d <= end
    }).length
  }, [props.scheduledDates])

  const postsDelta = deltaLabel(postsThisMonth, postsLastMonth)
  const carouselsDelta = deltaLabel(carouselsThisMonth, carouselsLastMonth)
  const creditsPct =
    props.planCreditsMonthly > 0
      ? Math.round((props.creditsUsed / props.planCreditsMonthly) * 100)
      : null

  const kpis: Kpi[] = [
    {
      label: "POSTS CRIADOS",
      value: String(totalPosts),
      icon: Sparkles,
      accent: C.brandSoft,
      delta: postsDelta.text,
      deltaTone: postsDelta.tone === "up" ? C.green : C.sub,
      note: "vs mês passado",
      spark: weeklySeries(allPostDates),
    },
    {
      label: "CARROSSÉIS",
      value: String(totalCarousels),
      icon: GalleryHorizontalEnd,
      accent: C.green,
      delta: carouselsDelta.text,
      deltaTone: carouselsDelta.tone === "up" ? C.green : C.sub,
      note: `${props.slidesTotal} slides`,
      spark: weeklySeries(props.carouselDates),
    },
    {
      label: "CRÉDITOS USADOS",
      value: String(props.creditsUsed),
      icon: Wallet,
      accent: C.red,
      delta: creditsPct !== null ? `${creditsPct}%` : "este mês",
      deltaTone: C.sub,
      note: creditsPct !== null ? "do plano" : `${props.credits.toLocaleString("pt-BR")} restantes`,
    },
    {
      label: "AGENDADOS",
      value: String(scheduledNext7),
      icon: CalendarDays,
      accent: C.cyan,
      delta: `${props.scheduledDates.length} no total`,
      deltaTone: C.sub,
      note: "próximos 7 dias",
    },
    {
      label: "MARCAS",
      value: String(props.brandsCount),
      icon: Store,
      accent: C.gold,
      delta: "ativas",
      deltaTone: C.sub,
      note: "no workspace",
    },
  ]

  const series = useMemo(
    () => chartSeries(props.singleDates, props.carouselDates, period),
    [props.singleDates, props.carouselDates, period],
  )

  const donut = useMemo(
    () =>
      [
        { name: "Posts únicos", value: totalSingles, color: C.brand },
        { name: "Carrosséis", value: totalCarousels, color: C.green },
        { name: "Projetos", value: props.projectsCount, color: C.cyan },
      ].filter((d) => d.value > 0),
    [totalSingles, totalCarousels, props.projectsCount, C],
  )

  function downloadCsv() {
    const rows = [
      ["periodo", "posts", "carrosseis"],
      ...series.map((b) => [b.label, String(b.posts), String(b.carrosseis)]),
    ]
    const csv = rows.map((r) => r.join(";")).join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `syncpost-producao-${period.toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PaletteContext.Provider value={C}>
      <div
        className={`${theme === "dark" ? "dark" : ""} flex h-screen overflow-hidden`}
        style={{ background: C.bg }}
      >
        <Sidebar {...props} />

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto px-5 py-5 md:px-7">
            {/* Cabeçalho */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[9.5px] font-mono uppercase tracking-[0.14em]"
                  style={{ background: C.card, borderColor: C.line, color: C.sub }}
                >
                  <span style={{ color: C.brandSoft }}>◆</span> SyncPost · Produção
                </span>
                <h1 className="text-[26px] font-semibold tracking-tight" style={{ color: C.text }}>
                  Central de Conteúdo
                </h1>
                <p className="text-[12px]" style={{ color: C.sub }}>
                  {totalPosts} posts · {props.brandsCount}{" "}
                  {props.brandsCount === 1 ? "marca" : "marcas"} · {scheduledNext7} agendados ·{" "}
                  {props.periodLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center rounded-lg border p-0.5"
                  style={{ background: C.card, borderColor: C.line }}
                >
                  {(["Semana", "Mês", "Trimestre", "Ano"] as Period[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className="rounded-md px-3 py-1.5 text-[11.5px] font-medium transition-colors"
                      style={p === period ? { background: CORE, color: "#fff" } : { color: C.sub }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={downloadCsv}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11.5px] font-medium transition-colors"
                  style={{ background: C.card, borderColor: C.line, color: C.sub }}
                >
                  Baixar <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={toggleTheme}
                  aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
                  style={{ background: C.card, borderColor: C.line, color: C.sub }}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* KPIs */}
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {kpis.map((kpi) => (
                <KpiCard key={kpi.label} kpi={kpi} />
              ))}
            </div>

            {/* Posts gerados — cards navegáveis estilo template */}
            <div className="mt-4 rounded-2xl border p-5" style={{ background: C.card, borderColor: C.line }}>
              <CardTitle
                title="Posts Gerados"
                sub="Últimas criações — navegue pelos slides como nos templates"
                right={
                  <Link
                    href="/dashboard/projetos"
                    className="rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors"
                    style={{ borderColor: C.line, color: C.sub }}
                  >
                    Ver todos
                  </Link>
                }
              />
              {props.posts.length === 0 ? (
                <div
                  className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed py-10"
                  style={{ borderColor: C.line }}
                >
                  <p className="text-[13px]" style={{ color: C.sub }}>
                    Nenhum post ainda — crie o primeiro.
                  </p>
                  <Link
                    href="/dashboard/criar"
                    className="rounded-lg px-4 py-2 text-[12px] font-semibold text-white"
                    style={{ background: CORE }}
                  >
                    + Criar conteúdo
                  </Link>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {props.posts.map((post, i) => (
                    <PostCard key={`${post.kind}-${post.id}`} post={post} index={i} />
                  ))}
                </div>
              )}
            </div>

            {/* Gráficos */}
            <div className="mt-4 grid grid-cols-1 gap-4 pb-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,4fr)]">
              {/* Donut */}
              <div className="rounded-2xl border p-5" style={{ background: C.card, borderColor: C.line }}>
                <CardTitle title="Composição da Produção" sub="Formatos criados" />
                {donut.length === 0 ? (
                  <div className="mt-6 py-12 text-center text-[12px]" style={{ color: C.muted }}>
                    Sem produção ainda.
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-5">
                    <div className="relative h-[190px] w-[190px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donut}
                            dataKey="value"
                            innerRadius={64}
                            outerRadius={88}
                            paddingAngle={2}
                            strokeWidth={0}
                            startAngle={90}
                            endAngle={-270}
                            isAnimationActive={false}
                          >
                            {donut.map((d) => (
                              <Cell key={d.name} fill={d.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <MonoLabel>Posts</MonoLabel>
                        <div className="text-[22px] font-semibold tracking-tight" style={{ color: C.text }}>
                          {totalPosts}
                        </div>
                        <div className="text-[10.5px] font-medium" style={{ color: C.green }}>
                          +{postsThisMonth} este mês
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 space-y-3.5">
                      {donut.map((item) => (
                        <div key={item.name} className="flex items-start gap-2.5">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                          <div className="min-w-0 flex-1">
                            <div className="text-[12.5px] font-medium" style={{ color: item.color }}>
                              {item.name}
                            </div>
                            <div className="text-[10.5px]" style={{ color: C.muted }}>
                              {Math.round((item.value / Math.max(totalPosts, 1)) * 100)}% da produção
                            </div>
                          </div>
                          <div className="text-[13px] font-semibold" style={{ color: item.color }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Área */}
              <div className="rounded-2xl border p-5" style={{ background: C.card, borderColor: C.line }}>
                <CardTitle
                  title="Produção ao Longo do Tempo"
                  sub={`Posts únicos · Carrosséis — ${period.toLowerCase()}`}
                  right={
                    <div className="flex items-center gap-3 text-[10.5px]" style={{ color: C.sub }}>
                      {[
                        ["Posts", C.brand],
                        ["Carrosséis", C.green],
                      ].map(([l, c]) => (
                        <span key={l} className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                          {l}
                        </span>
                      ))}
                    </div>
                  }
                />
                <div className="mt-3 h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 10, right: 6, bottom: 0, left: -22 }}>
                      <defs>
                        <linearGradient id="gPosts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.brand} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={C.brand} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gCarrosseis" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.green} stopOpacity={0.18} />
                          <stop offset="100%" stopColor={C.green} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={C.lineSoft} strokeDasharray="3 6" vertical={false} />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: C.muted, fontSize: 9.5, fontFamily: "monospace" }}
                        dy={6}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        tick={{ fill: C.muted, fontSize: 9.5, fontFamily: "monospace" }}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: C.line }} />
                      <Area
                        type="monotone"
                        dataKey="posts"
                        name="Posts"
                        stroke={C.brand}
                        strokeWidth={2}
                        fill="url(#gPosts)"
                        dot={false}
                        activeDot={{ r: 4, fill: C.brand, stroke: C.card, strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="carrosseis"
                        name="Carrosséis"
                        stroke={C.green}
                        strokeWidth={1.8}
                        fill="url(#gCarrosseis)"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </PaletteContext.Provider>
  )
}
