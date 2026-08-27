import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_PREFIXES = ["/login", "/cadastro", "/recuperar-senha", "/auth", "/afiliados"]
// Sandboxes de dev (/teste*, /test-*, /preview-*) entram aqui: nenhuma tela do
// produto linka mais pra elas, mas as rotas continuam no build e ficavam
// abertas pra qualquer visitante. As APIs caras já eram protegidas pela
// allowlist abaixo — isto fecha a vitrine.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/editor",
  "/onboarding",
  "/teste",
  "/test-editorial",
  "/preview-estilos",
  "/preview-posts-unicos",
]

// /api inteiro exige login, MENOS o que está aqui. Antes o /api ficava de fora
// do PROTECTED_PREFIXES e rotas caras de IA (generate-stream com maxDuration
// 300, refine-prompt com web_search) respondiam a qualquer um — em GET, dava
// pra queimar crédito Anthropic/Fal só com uma <img> apontando pra elas.
// Allowlist em vez de denylist: rota nova nasce protegida.
const PUBLIC_API_PREFIXES = [
  "/api/webhooks", // chamado por provedor externo (Asaas, WebSync OS); valida segredo próprio
  "/api/proxy-image", // proxy de imagem, já limitado por allowlist de host
  "/api/cron", // jobs agendados; valida CRON_SECRET no header
  // Callbacks da Meta (desautorização e exclusão de dados): sem sessão, a
  // autenticidade é o HMAC do signed_request com o App Secret.
  "/api/instagram/deauthorize",
  "/api/instagram/data-deletion",
]

// Piloto do loop bitmap→spec (PLANO-LOOP-POST-EDITAVEL.md): a rota já devolve
// 404 em produção por conta própria; a exceção só existe fora dela.
if (process.env.NODE_ENV !== "production") {
  PUBLIC_API_PREFIXES.push("/api/dev/pilot")
}

// === Split de domínio ===
// Raiz (nexuscontentai.com.br / www) = landing/marketing.
// app.nexuscontentai.com.br = o app. lp.* = landing pages avulsas (vazio ainda).
const SITE_DOMAIN = "nexuscontentai.com.br"
const APEX_HOSTS = new Set([SITE_DOMAIN, `www.${SITE_DOMAIN}`])
const APP_HOST = `app.${SITE_DOMAIN}`
const LP_HOST = `lp.${SITE_DOMAIN}`
// fabrica.* = o chão de fábrica (painel admin de templates). O host é só um
// atalho: a raiz reescreve pro painel e o resto segue o fluxo normal do app
// (login incluso — a sessão é por host, então o admin loga uma vez lá).
const FABRICA_HOST = `fabrica.${SITE_DOMAIN}`

// Domínio anterior ao rebrand. Continua respondendo e manda todo mundo pro
// novo com 301, MENOS /auth e /api: OAuth e webhooks têm a URL de callback
// registrada na mão em cada provedor (Google, Supabase, Meta, Asaas) e um
// redirect no meio do fluxo quebra a troca de code por sessão. Essas rotas só
// saem daqui depois que TODOS os provedores estiverem apontando pro domínio
// novo — aí este bloco inteiro pode virar um 301 sem exceção.
const LEGACY_DOMAIN = "syncpost.com.br"
const LEGACY_HOSTS = new Set([
  LEGACY_DOMAIN,
  `www.${LEGACY_DOMAIN}`,
  `app.${LEGACY_DOMAIN}`,
])
const LEGACY_KEEP_PREFIXES = ["/auth", "/api"]

// Caminhos que PERMANECEM no domínio raiz (landing). Todo o resto é do app.
// /instagram = página pública de exclusão de dados (exigida pela Meta).
const MARKETING_PREFIXES = ["/pricing", "/termos", "/privacidade", "/instagram"]
// Arquivos/rotas que DEVEM ser servidos na raiz (SEO): o Google busca
// robots.txt e sitemap.xml no apex — redirecionar pro subdomínio prejudica.
const MARKETING_EXACT = new Set(["/", "/robots.txt", "/sitemap.xml"])

function matchesPrefix(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`))
}

function isMarketingPath(path: string) {
  return MARKETING_EXACT.has(path) || matchesPrefix(path, MARKETING_PREFIXES)
}

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return false
  if (url.includes("seu-projeto") || anon.includes("aqui")) return false
  return true
}

const DEV_MODE_BYPASS =
  process.env.DEV_MODE === "true" &&
  process.env.NODE_ENV !== "production"

async function middlewareBase(request: NextRequest) {
  const path = request.nextUrl.pathname
  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0]

  // Domínio antigo: 301 pro equivalente no novo, preservando o subdomínio
  // (app.antigo → app.novo) pra não jogar quem estava logado na landing.
  if (LEGACY_HOSTS.has(host) && !matchesPrefix(path, LEGACY_KEEP_PREFIXES)) {
    const destHost = host.startsWith("app.") ? APP_HOST : SITE_DOMAIN
    const dest = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      `https://${destHost}`,
    )
    return NextResponse.redirect(dest, 301)
  }

  // lp.*: sem conteúdo ainda. Responde 200 com um placeholder em vez de deixar
  // o proxy devolver 502 — o subdomínio já existe no DNS e no Coolify.
  if (host === LP_HOST) {
    return new NextResponse(
      "<!doctype html><meta charset=utf-8><title>Nexus Content</title>" +
        "<body style=\"margin:0;display:grid;place-items:center;height:100vh;" +
        "background:#05070c;color:#f2f5fa;font:500 15px system-ui\">Em breve.</body>",
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
    )
  }

  // fabrica.*: a raiz abre direto o painel da fábrica. Demais rotas passam
  // (login, /_next, /api) — o gate real é o ADMIN_EMAILS na própria página.
  if (host === FABRICA_HOST && path === "/") {
    return NextResponse.rewrite(
      new URL("/dashboard/admin/fabrica", request.url),
      { request },
    )
  }

  // Raiz: rotas do app (tudo que não é landing) vão pro subdomínio app.
  if (APEX_HOSTS.has(host) && !isMarketingPath(path)) {
    const dest = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      `https://${APP_HOST}`,
    )
    return NextResponse.redirect(dest, 307)
  }
  // Subdomínio app: a home vira o dashboard (a landing mora na raiz).
  if (host === APP_HOST && path === "/") {
    return NextResponse.redirect(new URL("/dashboard", `https://${APP_HOST}`))
  }

  if (matchesPrefix(path, PUBLIC_PREFIXES)) {
    return NextResponse.next({ request })
  }

  if (DEV_MODE_BYPASS) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  if (!isSupabaseConfigured()) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isApi = path === "/api" || path.startsWith("/api/")
  const isProtected =
    matchesPrefix(path, PROTECTED_PREFIXES) ||
    (isApi && !matchesPrefix(path, PUBLIC_API_PREFIXES))

  if (isProtected && !user) {
    // API responde 401: redirecionar pro /login devolveria HTML pro fetch e o
    // cliente trataria como sucesso.
    if (isApi) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", path)
    return NextResponse.redirect(url)
  }

  return response
}

// === Atribuição de afiliado ===
// `?af=CODIGO` em qualquer página grava o cookie nx_af (60 dias, legível no
// client, sameSite lax). Fica FORA da lógica acima de propósito: vale também
// pra resposta de redirect (apex -> app), senão o clique no link do afiliado
// perderia a atribuição no primeiro salto. O cookie sobe pro domínio base em
// produção pra valer na landing e no app.
const AF_COOKIE = "nx_af"
const AF_COOKIE_DIAS = 60
const AF_CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/

export async function middleware(request: NextRequest) {
  const response = await middlewareBase(request)
  const af = (request.nextUrl.searchParams.get("af") || "").trim().toUpperCase()
  if (af && AF_CODE_RE.test(af)) {
    const host = (request.headers.get("host") || "").toLowerCase().split(":")[0]
    const domain = host.endsWith(SITE_DOMAIN) ? `.${SITE_DOMAIN}` : undefined
    response.cookies.set(AF_COOKIE, af, {
      maxAge: AF_COOKIE_DIAS * 24 * 60 * 60,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      ...(domain ? { domain } : {}),
    })
  }
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
