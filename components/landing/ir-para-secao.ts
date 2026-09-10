/*
 * Salto para uma seção da landing, usado pelo menu do topo e pelo rodapé.
 *
 * POR QUE ISSO EXISTE EM VEZ DE UM `<a href="#planos">` puro. O app declara
 * `html { scroll-behavior: smooth }` no `@layer base` do globals.css, que é
 * regra global e não é desta landing pra mexer. Só que a landing tem cerca de
 * 12.000px de altura, e o scroll suave até "Planos" ou "FAQ" é uma viagem de
 * vários segundos que atravessa o mural 3D dos planos e o cartão de gradiente
 * animado do FAQ. Medido em 10/09: a URL mudava, a animação de scroll não
 * avançava e a página ficava parada no topo, no desktop e no celular. Era o
 * bug que o testador pegou.
 *
 * O salto INSTANTÂNEO não depende de nenhuma animação sobreviver, e é o mesmo
 * comportamento da landing do EverReply, que não liga scroll suave nenhum.
 *
 * `behavior: "instant"` e não `"auto"`: `auto` significa "use o que o CSS
 * disser", e o que o CSS diz aqui é `smooth`, que é justamente o problema.
 *
 * O `block: "start"` respeita o `scroll-margin-top` das seções (`scroll-mt-24`
 * no page.tsx), então a pílula flutuante do menu não cobre o título da seção
 * onde a pessoa acabou de chegar.
 *
 * A URL continua ganhando o hash, pela `history.pushState`: quem copia o
 * endereço leva a âncora, e o botão voltar do navegador continua funcionando.
 * Se o alvo não existir, a função não faz nada e devolve o controle pro
 * navegador (o `preventDefault` só acontece quando há pra onde ir).
 */
export function irParaSecao(evento: { preventDefault: () => void }, href: string): void {
  if (typeof document === "undefined") return
  if (!href.startsWith("#")) return

  /* `#top` é o id do <main>: serve ao clique no logo, que volta pro começo. */
  const alvo = document.querySelector(href)
  if (!alvo) return

  evento.preventDefault()
  alvo.scrollIntoView({ behavior: "instant", block: "start" })

  try {
    window.history.pushState(null, "", href)
  } catch {
    /* pushState pode falhar em contexto restrito (iframe de origem diferente).
       O scroll é o que importa; a URL é o extra. */
  }
}
