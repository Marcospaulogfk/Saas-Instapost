"use client"

import { motion } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "O que conta como uma 'imagem'?",
    answer: "Cada geracao de imagem com IA consome 1 credito do seu plano. Isso inclui tanto a geracao inicial quanto regeneracoes. Editar texto, cores ou posicionar elementos nao consome creditos adicionais.",
  },
  {
    question: "Posso mudar de plano a qualquer momento?",
    answer: "Sim! Voce pode fazer upgrade ou downgrade a qualquer momento. Se fizer upgrade, pagara apenas a diferenca proporcional. Se fizer downgrade, o novo valor sera aplicado no proximo ciclo de cobranca.",
  },
  {
    question: "O que acontece se eu nao usar todas as imagens?",
    answer: "Os creditos de imagem nao acumulam para o proximo mes. Recomendamos escolher um plano adequado ao seu uso medio. Voce pode complementar com pacotes avulsos quando precisar de mais.",
  },
  {
    question: "Voces cobram em real ou dolar?",
    answer: "Todos os precos sao em Reais (BRL) e a cobranca e feita no cartao de credito em moeda local. Nao ha surpresas com variacao cambial.",
  },
  {
    question: "Posso usar o conteudo gerado comercialmente?",
    answer: "Sim! Todo conteudo gerado na plataforma e seu para usar como quiser, incluindo uso comercial. Voce mantem 100% dos direitos sobre suas criacoes.",
  },
  {
    question: "Como funciona o teste gratis?",
    answer: "Voce pode criar uma conta gratuita e gerar ate 2 imagens sem precisar cadastrar cartao de credito. E uma otima forma de conhecer a plataforma antes de assinar.",
  },
  {
    question: "Voces oferecem reembolso?",
    answer: "Sim! Oferecemos garantia de 7 dias. Se nao ficar satisfeito por qualquer motivo, entre em contato dentro dos primeiros 7 dias e faremos o reembolso integral, sem perguntas.",
  },
  {
    question: "Como cancelo minha assinatura?",
    answer: "Voce pode cancelar a qualquer momento diretamente nas configuracoes da sua conta. O cancelamento e imediato e voce continua com acesso ate o fim do periodo ja pago.",
  },
]

export function PricingFAQ() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto px-4 py-16"
    >
      <h2 className="text-3xl font-bold text-center mb-12">
        Perguntas frequentes
      </h2>

      <Accordion type="single" collapsible className="space-y-4">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border border-border rounded-lg px-6 data-[state=open]:border-primary/30"
          >
            <AccordionTrigger className="text-left hover:no-underline py-4">
              <span className="font-medium">{faq.question}</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.section>
  )
}
