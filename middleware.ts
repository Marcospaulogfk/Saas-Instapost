import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_PREFIXES = ["/login", "/cadastro", "/recuperar-senha", "/auth"]
const PROTECTED_PREFIXES = ["/dashboard", "/editor", "/onboarding"]

// === Split de domínio ===
// Raiz (syncpost.com.br / www) = landing/marketing. app.syncpost.com.br = o app.
const APEX_HOSTS = new Set(["syncpost.com.br", "www.syncpost.com.br"])
const APP_HOST = "app.syncpost.com.br"
// Caminhos que PERMANECEM no domínio raiz (landing). Todo o resto é do app.
const MARKETING_PREFIXES = ["/pricing", "/termos", "/privacidade"]
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

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0]

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

  const isProtected = matchesPrefix(path, PROTECTED_PREFIXES)

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", path)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
