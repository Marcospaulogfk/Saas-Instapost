"use client"

import { forwardRef, type AnchorHTMLAttributes } from "react"

import { irParaSecao } from "./ir-para-secao"

/*
 * Link pra uma seção da própria landing ("Ver planos", "Ver como funciona").
 *
 * Existe porque o page.tsx é server component e não pode passar `onClick` pra
 * um <Link>. Sem o clique interceptado, esses botões caíam no mesmo bug do
 * menu: o `scroll-behavior: smooth` global não completa a viagem até a seção,
 * a URL troca e a página não sai do lugar (ver ir-para-secao.ts).
 *
 * `forwardRef` e as props espalhadas no <a> são pra ele funcionar dentro do
 * `<Button asChild>`: o Slot do botão entrega className e ref pro filho.
 */
type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

export const LinkSecao = forwardRef<HTMLAnchorElement, Props>(function LinkSecao(
  { href, onClick, ...resto },
  ref,
) {
  return (
    <a
      ref={ref}
      href={href}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) irParaSecao(e, href)
      }}
      {...resto}
    />
  )
})

export default LinkSecao
