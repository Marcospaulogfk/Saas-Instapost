/**
 * Prefixa `next` com a etapa "como você vai usar o Nexus?" (skippable),
 * antes de seguir pro destino de verdade — usado no redirect pós-
 * confirmação de e-mail, no signup direto (client-side) e no callback
 * do Google.
 *
 * `/comecar`, não `/onboarding/*`: esse prefixo já é o wizard de configurar
 * MARCA (site/manual → objetivos de marketing → identidade → estilo),
 * outra etapa do produto. Reusar o nome ia colidir com a rota
 * `/onboarding/objetivo` que já existe (objetivo da marca, não da conta).
 *
 * Mora fora de app/actions porque arquivo "use server" só pode exportar
 * função async — helper síncrono de URL não tem o que fazer lá.
 */
export function comOnboarding(next: string): string {
  return `/comecar?next=${encodeURIComponent(next)}`
}
