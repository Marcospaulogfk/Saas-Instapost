/**
 * Origem pública de uma requisição (https://app.nexuscontentai.com.br).
 *
 * `new URL(request.url).origin` NÃO serve atrás do proxy do Coolify: o Next
 * recebe a requisição no container e enxerga `localhost:3000`, então o
 * redirect mandava a pessoa pra https://localhost:3000/... Os headers
 * X-Forwarded-* carregam o domínio real, e usá-los (em vez de fixar
 * NEXT_PUBLIC_APP_URL) mantém os dois domínios funcionando na transição.
 *
 * Nasceu em app/auth/callback (login com Google) e foi extraída em
 * 10/09/2026 porque app/auth/confirm (links de e-mail: confirmação e troca
 * de senha) tinha o mesmo defeito sem a correção.
 */
export function origemPublica(request: Request): string {
  const h = request.headers
  const host = h.get("x-forwarded-host") ?? h.get("host")
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
    return `${proto}://${host}`
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
}
