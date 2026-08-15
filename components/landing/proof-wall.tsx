/**
 * Parede de prova: peças reais geradas na plataforma, rolando em colunas
 * verticais com velocidades diferentes. Só CSS — nenhum JS no cliente.
 */

type Peca = { src: string; nicho: string }

const COLUNAS: Peca[][] = [
  [
    { src: "/refs-posts-unicos/beauty/01/referencia.jpg", nicho: "Beleza" },
    { src: "/refs-posts-unicos/Profissional/01/referencia.jpg", nicho: "Serviços" },
    { src: "/refs-posts-unicos/fitness/02/referencia.jpg", nicho: "Fitness" },
    { src: "/refs-posts-unicos/informativo/01/referencia.jpg", nicho: "Informativo" },
    { src: "/refs-posts-unicos/comercial/01/referencia.jpg", nicho: "Comércio" },
    { src: "/refs-posts-unicos/empresa/03/referencia.jpg", nicho: "Empresa" },
  ],
  [
    { src: "/refs-posts-unicos/comercial/02/referencia.jpg", nicho: "Comércio" },
    { src: "/refs-posts-unicos/beauty/03/referencia.jpg", nicho: "Beleza" },
    { src: "/refs-posts-unicos/Profissional/02/referencia.jpg", nicho: "Serviços" },
    { src: "/refs-posts-unicos/fitness/01/referencia.jpg", nicho: "Fitness" },
    { src: "/refs-posts-unicos/informativo/02/referencia.jpg", nicho: "Informativo" },
    { src: "/refs-posts-unicos/comercial/03/referencia.jpg", nicho: "Comércio" },
    { src: "/refs-posts-unicos/beauty/04/referencia.jpg", nicho: "Beleza" },
  ],
  [
    { src: "/refs-posts-unicos/fitness/03/referencia.jpg", nicho: "Fitness" },
    { src: "/refs-posts-unicos/informativo/03/referencia.jpg", nicho: "Informativo" },
    { src: "/refs-posts-unicos/Profissional/03/referencia.jpg", nicho: "Serviços" },
    { src: "/refs-posts-unicos/beauty/05/referencia.jpg", nicho: "Beleza" },
    { src: "/refs-posts-unicos/comercial/04/referencia.jpg", nicho: "Comércio" },
    { src: "/refs-posts-unicos/fitness/04/referencia.jpg", nicho: "Fitness" },
    { src: "/refs-posts-unicos/Profissional/04/referencia.jpg", nicho: "Serviços" },
  ],
]

/* Velocidades diferentes por coluna quebram o efeito de "esteira única". */
const VELOCIDADE = ["46s", "62s", "54s"]

function Card({ peca, eager }: { peca: Peca; eager?: boolean }) {
  return (
    <div className="group relative mb-3 overflow-hidden rounded-xl border border-hairline bg-surface">
      <img
        src={peca.src}
        alt={`Carrossel de ${peca.nicho} gerado no Nexus Content`}
        /* As primeiras de cada coluna entram na tela junto com a seção; o resto
           só rola depois — daí o lazy. */
        loading={eager ? "eager" : "lazy"}
        className="w-full aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <span className="absolute bottom-2 left-2 rounded-full bg-black/65 backdrop-blur-sm px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/90">
        {peca.nicho}
      </span>
    </div>
  )
}

export function ProofWall({ className = "h-[460px] md:h-[560px]" }: { className?: string }) {
  return (
    <div
      className={`lp-fade-y grid grid-cols-2 md:grid-cols-3 gap-3 overflow-hidden ${className}`}
    >
      {COLUNAS.map((coluna, i) => (
        <div
          key={i}
          className={`${i === 2 ? "hidden md:block" : ""} relative`}
        >
          <div
            className={`lp-marquee-y ${i === 1 ? "lp-marquee-y-rev" : ""}`}
            style={{ ["--lp-speed" as string]: VELOCIDADE[i] }}
          >
            {/* duplicado: o loop de -50% precisa da lista repetida */}
            {[...coluna, ...coluna].map((peca, j) => (
              <Card key={`${peca.src}-${j}`} peca={peca} eager={j < 3} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
