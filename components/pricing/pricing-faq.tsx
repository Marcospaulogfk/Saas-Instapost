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
    answer: "Cada geração de imagem com IA consome 1 crédito do seu plano. Isso inclui tanto a geração inicial quanto regenerações. Editar texto, cores ou posicionar elementos não consome créditos adicionais.",
  },
  {
    question: "Posso mudar de plano a qualquer momento?",
    answer: "Sim! Você pode fazer upgrade ou downgrade a qualquer momento. Se fizer upgrade, pagará apenas a diferença proporcional. Se fizer downgrade, o novo valor será aplicado no próximo ciclo de cobrança.",
  },
  {
    question: "O que acontece se eu não usar todas as imagens?",
    answer: "Os créditos de imagem não acumulam para o próximo mês. Recomendamos escolher um plano adequado ao seu uso médio. Você pode complementar com pacotes avulsos quando precisar de mais.",
  },
  {
    question: "Vocês cobram em real ou dólar?",
    answer: "Todos os preços são em Reais (BRL) e a cobrança é feita no cartão de crédito em moeda local. Não há surpresas com variação cambial.",
  },
  {
    question: "Posso usar o conteúdo gerado comercialmente?",
    answer: "Sim! Todo conteúdo gerado na plataforma é seu para usar como quiser, incluindo uso comercial. Você mantém 100% dos direitos sobre suas criações.",
  },
  {
    question: "Como funciona o teste grátis?",
    answer: "Você pode criar uma conta gratuita e montar 1 carrossel completo, com capa gerada por IA, sem precisar cadastrar cartão de crédito. É uma ótima forma de conhecer a plataforma antes de assinar.",
  },
  {
    question: "Vocês oferecem reembolso?",
    answer: "Sim! Oferecemos garantia de 7 dias. Se não ficar satisfeito por qualquer motivo, entre em contato dentro dos primeiros 7 dias e faremos o reembolso integral, sem perguntas.",
  },
  {
    question: "Como cancelo minha assinatura?",
    answer: "Você pode cancelar a qualquer momento diretamente nas configurações da sua conta. O cancelamento é imediato e você continua com acesso até o fim do período já pago.",
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
