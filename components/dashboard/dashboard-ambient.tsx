/**
 * Background do dashboard.
 *
 * Preto #000 + camadas de gradiente/sombra com as cores do efeito Instagram
 * "Rio de Janeiro" (roxo → magenta → laranja) — SÓ no fundo, pra dar vida sem
 * tocar em botões/UI. Glows flutuam devagar; vinheta dá profundidade.
 * Estilos em app/dashboard/dashboard.css (.dash-rio-*).
 */
export function DashboardAmbient() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* banda pôr-do-sol fraca full-bleed */}
      <div className="dash-rio-base" />
      {/* glows flutuantes */}
      <div className="dash-rio-glow dash-rio-1" />
      <div className="dash-rio-glow dash-rio-2" />
      <div className="dash-rio-glow dash-rio-3" />
      {/* grid bem sutil */}
      <div className="absolute inset-0 grid-bg-fade opacity-[0.05]" />
      {/* sombra nas bordas (profundidade) */}
      <div className="dash-rio-vignette" />
    </div>
  )
}
