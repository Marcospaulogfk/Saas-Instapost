/**
 * Background do dashboard.
 *
 * Identidade visual: "alto contraste + respiro", sem glow/orbs/neon.
 * Restou apenas um grid sutil com fade radial — o fundo é o quase-preto
 * base do app, deixando o conteúdo respirar.
 */
export function DashboardAmbient() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      <div className="absolute inset-0 grid-bg-fade opacity-[0.12]" />
    </div>
  )
}
