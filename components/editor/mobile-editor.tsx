"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Editor em modo celular (abaixo de 1024px)?
 *
 * Devolve `null` até a tela montar. Os editores só desenham os botões de ação
 * depois disso: assim "Publicar no Instagram" monta UMA vez, no lugar certo, e
 * o retorno do login do Instagram (?ig=ok) não se perde numa montagem dupla.
 */
export function useEditorMobile(): boolean | null {
  const [mobile, setMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    const on = () => setMobile(mql.matches);
    on();
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, []);
  return mobile;
}

/**
 * Peças de tela que os dois editores (post único e carrossel) usam no celular.
 *
 * No computador o editor tem sidebar de 320px + canvas lado a lado. Em 375px
 * isso espremia a arte numa faixa de 55px. No celular os editores trocam esse
 * desenho por: barra de cima (voltar + abas "Arte" e "Editar"), conteúdo, e
 * barra de baixo com as ações (Salvar sempre visível).
 */

export type AbaMobile = "arte" | "editar";

export function BarraTopoMobile({
  aba,
  onAba,
  voltarHref,
  extra,
}: {
  aba: AbaMobile;
  onAba: (a: AbaMobile) => void;
  voltarHref: string;
  /** Controle à direita (ex.: formato). */
  extra?: React.ReactNode;
}) {
  return (
    <div className="lg:hidden flex-shrink-0 flex items-center gap-2 border-b border-border bg-background px-2 py-2">
      <Link
        href={voltarHref}
        aria-label="Voltar para o painel"
        className="flex items-center justify-center w-11 h-11 rounded-lg text-text-secondary"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div
        role="tablist"
        className="flex-1 grid grid-cols-2 gap-1 rounded-lg border border-border-subtle p-1"
      >
        {(
          [
            ["arte", "Arte"],
            ["editar", "Editar"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={aba === v}
            onClick={() => onAba(v)}
            className={`rounded-md text-sm font-medium transition-colors ${
              aba === v ? "bg-brand-600 text-white" : "text-text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {extra}
    </div>
  );
}

/** Barra de baixo: ações com o polegar. Some enquanto o teclado está aberto. */
export function BarraBaixoMobile({
  tecladoAberto,
  children,
}: {
  tecladoAberto: boolean;
  children: React.ReactNode;
}) {
  if (tecladoAberto) return null;
  return (
    <div className="editor-mobile-barra lg:hidden flex-shrink-0 border-t border-border bg-background/95 backdrop-blur px-2 pt-2 pb-2 flex items-center gap-2">
      {children}
    </div>
  );
}
