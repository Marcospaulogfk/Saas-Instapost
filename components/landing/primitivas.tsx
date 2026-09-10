import type { ReactNode } from "react"

import { Reveal } from "./reveal"

/*
 * Primitivas de layout e tipografia da landing.
 *
 * Existem pelo mesmo motivo das primitivas da landing do EverReply: a página
 * tem uma largura só, um cabeçalho de seção só e um cartão só. Espalhar
 * `max-w-6xl mx-auto px-6` e `text-3xl md:text-[3rem]` por vinte pontos do
 * page.tsx é o que fazia cada seção acordar com uma régua diferente.
 */

/** Rótulo de seção: Geist Mono, caixa alta, espaçado, com a bolinha da marca. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
      <span className="text-primary">●</span>
      {children}
    </span>
  )
}

/**
 * Cabeçalho de seção: rótulo, título e linha de apoio.
 *
 * Já vem dentro de um <Reveal>: em vez de repetir o wrapper em cada seção do
 * page.tsx, a primitiva entra animada e a página inteira ganha o mesmo ritmo
 * de entrada de uma vez.
 */
export function SectionHead({
  eyebrow,
  title,
  sub,
  align = "center",
  className = "",
}: {
  eyebrow?: string
  title: ReactNode
  sub?: ReactNode
  align?: "center" | "left"
  className?: string
}) {
  const box = align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"
  return (
    <Reveal className={`${box} ${className}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="lp-display mt-5 text-[2rem] leading-[1.08] md:text-[3rem]">{title}</h2>
      {sub ? (
        <p className="mt-4 text-[17px] leading-relaxed text-text-secondary">{sub}</p>
      ) : null}
    </Reveal>
  )
}

/** Container padrão. Uma única largura na página inteira. */
export function Wrap({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-[1160px] px-5 md:px-8 ${className}`}>{children}</div>
  )
}

/** Cartão: fio de borda e superfície um degrau acima do fundo. Sem glow. */
export function CardLp({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-hairline bg-surface ${className}`}>{children}</div>
  )
}

/**
 * Destaque de trecho de título. Fill azul suave com texto claro, e NÃO texto
 * azul: o azul da marca sobre o preto da landing fica em 3,4:1, abaixo do
 * mínimo. Como caixa, o contraste é do texto branco por cima dela.
 */
export function Marca({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-brand-800/45 px-1.5 text-foreground decoration-clone">
      {children}
    </span>
  )
}
