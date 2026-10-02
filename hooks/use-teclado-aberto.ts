import * as React from "react";

/**
 * Diz se o teclado virtual do celular está aberto.
 *
 * Quando ele abre, a janela visível encolhe (visualViewport). Os editores usam
 * isso pra esconder a barra de baixo enquanto a pessoa digita: sem isso a barra
 * fica por cima do teclado e come metade da tela útil.
 */
export function useTecladoAberto() {
  const [aberto, setAberto] = React.useState(false);

  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const base = { h: window.innerHeight };
    const onChange = () => {
      // Girar o aparelho muda a altura "normal": reancora quando a largura muda.
      if (
        Math.abs(vv.width - window.innerWidth) < 2 &&
        window.innerHeight > base.h
      ) {
        base.h = window.innerHeight;
      }
      setAberto(base.h - vv.height > 140);
    };
    vv.addEventListener("resize", onChange);
    return () => vv.removeEventListener("resize", onChange);
  }, []);

  return aberto;
}
