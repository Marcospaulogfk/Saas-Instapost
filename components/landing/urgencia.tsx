"use client"

import { Check, X } from "lucide-react"

import { Reveal } from "./reveal"
import { Marca, SectionHead, Wrap } from "./primitivas"

/* ============================================================================
 * URGÊNCIA: "os 90 dias passam de qualquer jeito"
 *
 * O lugar desta seção na página é o da seção de urgência da landing do
 * EverReply, e o desenho é o mesmo: cabeçalho, um cartão de peso no meio da
 * faixa e um fecho curto. SEM CTA dentro do cartão, como a referência depois
 * de 06/09: a seção termina no argumento, e o próximo botão da página é o dos
 * planos, que é onde a pessoa decide.
 *
 * O QUE MUDA, E POR QUÊ. A versão do EverReply carrega uma prova de fora
 * (comunicado do WhatsApp, vídeo de um executivo com nome e cargo, previsão da
 * IDC com a fonte na tela). Aqui não existe peça equivalente, e a regra da
 * página é a mesma: nada de número que a gente não possa defender. Então esta
 * seção NÃO cita marca, NÃO traz porcentagem e NÃO inventa escassez (sem
 * contador, sem "restam X vagas", sem desconto que não existe). A pressão vem
 * de uma comparação que o próprio visitante checa olhando o feed dele.
 *
 * O ESPAÇO DA PROVA ESTÁ RESERVADO: quando houver caso real com autorização
 * (perfil, print e o número medido) ou uma citação pública com autor nomeado,
 * ela entra no cartão escuro daqui, com fonte visível, do jeito que o
 * EverReply faz. Enquanto não houver, o cartão fica com o argumento.
 * ========================================================================== */

const CENARIOS = {
  parado: [
    "O feed segue com o mesmo post de três semanas atrás.",
    "Você continua abrindo o Canva no domingo à noite pra dar conta da semana.",
    "O alcance cai de novo e a culpa vai pro algoritmo.",
    "Quem publica todo dia aparece pra quem ainda não te segue. Você, não.",
  ],
  andando: [
    "Uma sequência de carrosséis publicados, todos com a identidade da marca.",
    "A semana de conteúdo sai numa sentada de meia hora.",
    "O perfil aparece pra gente nova, todo dia, sem depender do seu domingo.",
    "A conversa vira pauta e oferta, não fonte e alinhamento.",
  ],
}

/* O bloco nomeava o mês no texto e envelhecia sozinho. Calcula no render: como
   a página é estática, o mês acompanha o rebuild. */
const MES_EM_90_DIAS = new Date(Date.now() + 90 * 864e5).toLocaleDateString("pt-BR", {
  month: "long",
})

export function Urgencia({ className = "", id }: { className?: string; id?: string }) {
  return (
    <section id={id} className={`py-20 md:py-28 ${className}`}>
      <Wrap>
        <SectionHead
          eyebrow="Enquanto você decide"
          title={
            <>
              O feed não espera a sua semana{" "}
              <Marca>ficar mais tranquila</Marca>
            </>
          }
          sub="Publicar todo dia é o que faz o Instagram te mostrar pra quem ainda não te segue. Não é talento, não é orçamento: é constância, e constância na mão é o que ninguém aguenta manter."
        />

        {/* O CARTÃO DE PESO. É o único bloco da faixa com fundo próprio, e é a
            pontuação visual da seção: as duas colunas dizem o mesmo período
            visto de dois jeitos. */}
        <Reveal from="scale" className="mt-12 md:mt-16">
          <div className="rounded-3xl border border-hairline bg-surface p-6 shadow-card md:p-10">
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
              Os dois feeds que você pode ter em {MES_EM_90_DIAS}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-full rounded-2xl border border-hairline bg-background p-6 md:p-7">
                <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
                  Se nada mudar
                </p>
                <ul className="space-y-4">
                  {CENARIOS.parado.map((linha) => (
                    <li
                      key={linha}
                      className="flex gap-3 text-[15px] leading-relaxed text-text-secondary"
                    >
                      <X className="mt-1 h-4 w-4 shrink-0 text-danger" />
                      {linha}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="h-full rounded-2xl border border-brand-600/50 bg-[linear-gradient(150deg,rgba(22,104,227,0.20),rgba(13,67,150,0.14))] p-6 md:p-7">
                <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
                  Com o Nexus Content
                </p>
                <ul className="space-y-4">
                  {CENARIOS.andando.map((linha) => (
                    <li key={linha} className="flex gap-3 text-[15px] leading-relaxed text-foreground">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      {linha}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* O fecho fica DENTRO do cartão: ele é a conclusão das duas
                colunas, não um assunto novo depois delas. */}
            <div className="mt-8 border-t border-hairline pt-8 text-center">
              <p className="mx-auto max-w-xl text-[16px] leading-relaxed text-text-secondary">
                Os 90 dias passam de qualquer jeito.{" "}
                <span className="font-semibold text-foreground">
                  A única variável é o que sobra no fim.
                </span>
              </p>
            </div>
          </div>
        </Reveal>
      </Wrap>
    </section>
  )
}

export default Urgencia
