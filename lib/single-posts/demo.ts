import type { PostBrand, PostContent } from "./types"

export const DEMO_BRAND: PostBrand = {
  id: "demo-eriosvaldo",
  name: "ERIOSVALDO DINIZ",
  monogram: "ED",
  profession: "ADVOGADO",
  brand_colors: ["#1F1F1F", "#C9A572", "#F0EFEC"],
  logo_url: null,
  phone: "(11) 99999-9999",
  website: "eriosvaldodiniz.com.br",
  instagram_handle: "eriosvaldodiniz",
  tagline: null,
}

// Fotos demo — Unsplash, retratos profissionais sérios
const PHOTO_RETRATO_FACE =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1080&h=1350&fit=crop&q=80"
const PHOTO_RETRATO_CORPO =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1080&h=1350&fit=crop&q=80"
const PHOTO_RETRATO_SERIO =
  "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=1080&h=1350&fit=crop&q=80"
const PHOTO_RETRATO_PENSATIVO =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&h=1350&fit=crop&q=80"

export const DEMO_CONTENT: Record<string, PostContent> = {
  "profissional-01-retrato-titulo-bottom": {
    intro: "O que eu aprendi",
    intro_2: "depois de atender vários",
    title_lines: ["SUPER", "ENDIVIDADOS"],
    image_url: PHOTO_RETRATO_FACE,
  },
  "profissional-02-retrato-card-cta": {
    title: "Funcionário\npúblico",
    body: "Conheça os benefícios do processo de superendividamento.",
    cta_text: "Veja mais na legenda",
    image_url: PHOTO_RETRATO_CORPO,
  },
  "profissional-03-pergunta-provocativa": {
    title_lines: ["O BANCO PODE", "CANCELAR SEU CPF?"],
    strikethrough_word: "CANCELAR",
    image_url: PHOTO_RETRATO_SERIO,
  },
  "profissional-04-frase-educativa-moldura": {
    title: "A consciência é o primeiro passo para evitar o",
    framed_word: "superendividamento",
    highlight_words: ["consciência"],
    image_url: PHOTO_RETRATO_PENSATIVO,
  },

  // ===== BEAUTY =====
  "beauty-01-closeup-serif-editorial": {
    title_lines: ["A boca", "perfeita", "existe..."],
    body: "E eu posso te provar com esse resultado que tivemos por aqui.",
    highlight_words: ["resultado"],
    image_url:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1080&h=1350&fit=crop&q=85",
  },
  "beauty-03-instagram-ui-mockup": {
    kicker: "Glúteo",
    title: "Sculpt",
    subtitle: "mais\ncurvas",
    image_url:
      "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1080&h=1350&fit=crop&q=85",
  },
  "beauty-04-produto-com-elemento": {
    intro: "Um hábito simples,",
    intro_2: "um resultado incrível.",
    title: "Colágeno",
    image_url:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1080&h=1350&fit=crop&q=85",
  },
  "beauty-05-frase-conceitual-centered": {
    title_lines: ["Beleza é", "equilíbrio!"],
    body: "confiança é consequência.",
    image_url:
      "https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?w=1080&h=1350&fit=crop&q=85",
  },

  // ===== COMERCIAL =====
  "comercial-01-split-color-product": {
    title_lines: ["O DESEMPENHO", "QUE ACOMPANHA", "SEU RITMO."],
    highlight_words: ["DESEMPENHO", "RITMO."],
    subtitle: "iPhone 16 feito pra quem exige mais, todos os dias.",
    image_url:
      "https://images.unsplash.com/photo-1554384645-13eab165c24b?w=1080&h=810&fit=crop&q=85",
  },
  "comercial-02-produto-isolado-clean": {
    title_lines: ["QUEM TEM,", "NÃO VOLTA", "ATRÁS."],
    highlight_words: ["NÃO", "VOLTA"],
    body: "Porque é experiência pra mais alto.",
    contact_website: "seusite.com.br",
    product_image_url:
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=900&h=900&fit=crop&q=85",
  },
  "comercial-03-equipe-card-lateral": {
    ghost_word: "CFTV",
    title_lines: ["SOLUÇÕES", "COMPLETAS EM", "SEGURANÇA!"],
    body: "Conte com a nossa experiência para escolher o melhor sistema de CFTV e portão para o seu imóvel.",
    cta_text: "Leia a legenda",
    contact_website: "seusite.com.br",
    image_url:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1080&h=1350&fit=crop&q=85",
  },
  "comercial-04-numero-grande-retrato": {
    kicker: "VIGILÂNCIA",
    stat_value: "24H",
    body: "Segurança sem\ninterrupções, 24/7",
    cta_text: "Fale conosco",
    contact_website: "seusite.com.br",
    image_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1080&h=1350&fit=crop&q=85",
  },

  // ===== EMPRESA =====
  "empresa-03-cta-seta-grande": {
    title: "Formalize seu negócio\ncom segurança!",
    body: "A nossa equipe cuida de toda a burocracia para você focar no crescimento da sua empresa.",
    highlight_words: ["nossa equipe", "crescimento"],
    cta_text: "Saiba mais",
    image_url:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1080&h=720&fit=crop&q=85",
  },

  // ===== FITNESS =====
  "fitness-01-resultados-grid": {
    title_lines: ["VEJA OS", "RESULTADOS", "VISÍVEIS EM 30 DIAS"],
    outline_word: "RESULTADOS",
    body: "Siga nosso programa de 30 dias e veja como é possível mudar seu corpo e atingir seus objetivos rapidamente.",
    cta_text: "Inicie seu programa hoje",
    image_url:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=600&fit=crop&q=85",
    image_2_url:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=600&fit=crop&q=85",
    image_3_url:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop&q=85",
  },
  "fitness-02-promocional-retrato": {
    intro: "Mês da\nTransformação:",
    title_lines: ["30% DE", "DESCONTO", "EM TODOS", "OS PLANOS!"],
    body: "Aproveite o mês da transformação para começar sua jornada fitness com um super desconto.",
    image_url:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=720&h=1200&fit=crop&q=85",
  },
  "fitness-03-desafio-com-selo": {
    ghost_word: "DESAFIO",
    title_lines: ["DESAFIO DE 21 DIAS:", "EMAGREÇA E GANHE", "PRÊMIOS!"],
    outline_word: "PRÊMIOS!",
    body: "Participe do nosso desafio e concorra a prêmios incríveis enquanto melhora sua saúde e condicionamento físico.",
    badge_label: "GARANTIA",
    image_url:
      "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=540&h=1350&fit=crop&q=85",
  },
  "fitness-04-institucional-fotos-espaco": {
    kicker: "VEM SER",
    body: "Na nossa academia, você encontra os melhores equipamentos e os melhores professores para te ajudar a chegar no seu objetivo.",
    cta_text: "Venha experimentar uma aula",
    title_emphasis: "em grupo!",
    image_url:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop&q=85",
    image_2_url:
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&h=400&fit=crop&q=85",
  },

  // ===== INFORMATIVO =====
  "informativo-01-alerta-card-buttons": {
    ghost_word: "ATENÇÃO",
    title: "ATENÇÃO",
    body: "Monitore sua casa ou empresa em tempo real com sistema moderno e de última geração de CFTV.",
    cta_text: "Saiba Mais",
    cta_secondary: "Ignorar",
    subtitle: "Fique atento, nós cuidamos da sua segurança!",
    contact_website: "seusite.com.br",
  },
  "informativo-02-case-storytelling": {
    ghost_word: "REAL",
    kicker: "TRANSFORMAÇÃO REAL:",
    title: "Conheça a História de João",
    highlight_words: ["João"],
    body: "João perdeu 10kg em 3 meses, e você também pode alcançar seus objetivos. Inspire-se com sua jornada.",
  },
  "informativo-03-vagas-requisitos": {
    title_lines: ["VAGAS", "ABERTAS"],
    kicker: "Instrutor de Muay Thai",
    checklist: [
      "Certificado em muay thai",
      "Experiência comprovada na área",
      "Boa comunicação",
      "Disponibilidade horária",
    ],
    contact_email: "vagas@empresa.com.br",
    image_url:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=540&h=900&fit=crop&q=85",
  },
}
