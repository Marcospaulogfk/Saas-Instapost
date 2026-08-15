"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import { Check, Link2, Sparkles, Download } from "lucide-react"

const PASSOS = [
  {
    n: "01",
    icon: Link2,
    titulo: "Conte a sua marca",
    desc:
      "Cola o link do site ou responde 3 perguntas. A IA aprende tom de voz, público e estilo visual — e nunca mais esquece.",
    nota: "Qualquer nicho · várias marcas na mesma conta",
  },
  {
    n: "02",
    icon: Sparkles,
    titulo: "Digite o tema",
    desc:
      "Uma frase basta. A engine devolve roteiro de 8 slides e as imagens já no seu território visual.",
    nota: "Roteiro + design + imagem no mesmo passo",
  },
  {
    n: "03",
    icon: Download,
    titulo: "Ajuste e exporte",
    desc:
      "Refine o que quiser no editor e baixe em Full HD 4:5 — slide a slide ou o carrossel inteiro em ZIP.",
    nota: "Pronto pra subir no Instagram",
  },
]

/**
 * Trilha de 3 passos com a linha preenchendo conforme a seção passa pela tela.
 * A progressão é o próprio scroll — não um loop automático.
 */
export function StepsFlow() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 60%"],
  })
  const altura = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])

  return (
    <div ref={ref} className="relative max-w-4xl mx-auto">
      {/* Trilho */}
      <div className="absolute left-[27px] top-4 bottom-4 w-px bg-hairline-strong hidden sm:block">
        <motion.div
          className="w-full bg-primary origin-top"
          style={{ height: reduced ? "100%" : altura }}
        />
      </div>

      <div className="space-y-6">
        {PASSOS.map((p, i) => (
          <motion.div
            key={p.n}
            initial={reduced ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.55, delay: i * 0.1 }}
            className="relative flex gap-6"
          >
            {/* Marcador */}
            <div className="hidden sm:flex shrink-0 relative z-10">
              <div className="h-14 w-14 rounded-full border border-border-accent bg-surface flex items-center justify-center">
                <p.icon className="w-5 h-5 text-primary" />
              </div>
            </div>

            <div className="flex-1 rounded-2xl border border-hairline bg-surface p-6 md:p-7 lp-card">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-[11px] tabular-nums tracking-[0.18em] text-primary">
                  {p.n}
                </span>
                <div className="h-px flex-1 bg-hairline" />
              </div>
              <h3 className="lp-display text-xl md:text-2xl mb-2.5">{p.titulo}</h3>
              <p className="text-text-secondary leading-relaxed mb-4">{p.desc}</p>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                <Check className="w-3 h-3 text-primary" />
                {p.nota}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
