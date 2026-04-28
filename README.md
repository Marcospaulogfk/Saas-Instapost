# InstaPost

> SaaS de criação de carrosséis virais para Instagram com IA

## 🚀 Rodar localmente (primeira vez)

### 1. Pré-requisitos
- Node.js 18+ instalado
- pnpm ou npm
- Conta no GitHub
- Conta no Supabase
- Conta no Vercel (opcional pra deploy)

### 2. Instalar dependências
```bash
pnpm install
# ou
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.local.example .env.local
```

Edite `.env.local` e preencha com suas chaves reais. **NUNCA** commite esse arquivo.

### 4. Rodar em desenvolvimento
```bash
pnpm dev
# ou
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura

```
app/
├── page.tsx                    Landing page
├── pricing/                    Página de preços
├── onboarding/                 Cadastro de marca (com upload de logo)
├── editor/                     Editor visual (placeholder pra Konva)
└── dashboard/
    ├── page.tsx                Dashboard home
    └── criar/
        ├── page.tsx            Escolha IA vs Manual
        ├── ia/                 Wizard com objetivo
        └── manual/             Criação manual

components/
├── ui/                         Shadcn components
├── dashboard/                  Componentes do dashboard
├── onboarding/                 Steps do wizard
└── editor/                     Componentes do editor

supabase/                       (a criar)
├── migrations/
└── functions/

lib/                            (a criar)
└── supabase/
```

## 🛠️ Próximos passos com Claude Code

1. Abra o terminal na pasta do projeto
2. Rode `claude` (Claude Code)
3. Cole o conteúdo de `BLUEPRINT.md` no início da conversa
4. Siga as instruções do Claude Code

## 📋 Modificações já aplicadas

- ✅ Landing page real (substituiu demo do V0)
- ✅ Onboarding redireciona pro dashboard após salvar
- ✅ Rota `/dashboard/criar` com escolha IA vs Manual
- ✅ Wizard IA com 4 objetivos de marketing
- ✅ Criação manual em `/dashboard/criar/manual`
- ✅ Upload de logo no onboarding
- ✅ Sidebar com seletor de marca
- ✅ Nome InstaPost (provisório)

## ⚠️ Avisos importantes

1. **Nome "InstaPost"** é provisório. "Insta" é marca da Meta. Trocar antes do lançamento público.
2. **Nunca commite `.env.local`**. Está no `.gitignore`.
3. **Nunca exponha service_role_key**. Use só em Edge Functions.

## 📞 Suporte

Veja `BLUEPRINT.md` pra documentação completa do projeto.
