# App Review — `instagram_business_content_publish` (handoff de submissão)

> Objetivo: sair de **Standard Access ("Pronto para teste")** → **Advanced Access**,
> que é o que libera CLIENTES publicarem na conta de Instagram deles pela SyncPost.
> Sem isso, só contas com papel no app (admin/dev/testador) publicam.
>
> App Meta: **SyncPost** (id `1503563704849302`) · Instagram App ID `1642022093558678`
> · Empresa vinculada: **BM 01** (`business_id 926588283384598`).
> Status verificado em 2026-07-15: permissão em "Pronto para teste"; testadores = 0.

## Pré-requisitos antes de submeter (checklist)
- [ ] **Conta testadora funcionando** — @syncpost_ (Business/Creator) aceita como
      Testador do Instagram + convite aceito no app. (Necessária pra gravar o screencast.)
- [ ] **1 publicação real de teste** feita pelo fluxo do app (pra provar que funciona).
- [ ] **Política de privacidade** pública e completa: `https://syncpost.com.br/privacidade`
      (precisa citar coleta/uso de dados do Instagram e como o usuário revoga acesso).
- [ ] **Verificação de negócio / "Provedor de Tecnologia"** concluída (card no Painel).
- [ ] **App publicado (go live)** — settings já constam completos na página "Lançar".
- [ ] **Screencast** gravado conforme roteiro abaixo (com áudio/legenda em inglês de preferência).

---

## 1) Descrição de uso da permissão (campo do App Review)

**EN (texto pra colar no formulário da Meta — eles revisam em inglês):**

> SyncPost is a content-creation tool for Instagram. Our users (small businesses and
> creators) generate posts and carousels (caption + images) inside SyncPost, then
> connect their own Instagram professional account via Instagram Login
> (`instagram_business_basic`, `instagram_business_content_publish`).
>
> We use `instagram_business_content_publish` to publish the exact content the user
> created and reviewed, to THEIR OWN Instagram account, only after they explicitly
> click "Publish now". Flow: the user creates content → connects their IG account
> (OAuth) → previews the post/carousel → taps "Publish now" → we call
> `POST /{ig-user-id}/media` for each image and `POST /{ig-user-id}/media_publish`
> to publish. We never post without an explicit per-post user action. Images are
> served from public HTTPS URLs so Meta can fetch them. We store only the long-lived
> token (per user, encrypted, revocable by disconnecting).

**PT (contexto, não vai no form):** é exatamente o que `lib/instagram/meta.ts` faz —
containers por imagem → CAROUSEL → `media_publish`. Nada publica sem o clique.

## 2) Instruções de teste pro revisor (campo "how to test")

**EN:**

> Test account (Instagram): provided in the App Review test credentials.
> 1. Go to https://app.syncpost.com.br and log in (test login provided).
> 2. Open the carousel editor (or a single post) — sample content is pre-loaded.
> 3. Click "Publicar no Instagram" (Publish to Instagram).
> 4. Click "Conectar Instagram" and authorize with the provided IG test account.
> 5. Back in the app, click "Publicar agora" (Publish now).
> 6. The post/carousel appears on the test account's feed within a few seconds.

> Fornecer no painel: login de teste do app + a conta IG testadora (@syncpost_) já
> aceita como testadora.

## 3) Roteiro do screencast (shot list)

Gravar tela (com o cursor visível), ~60–90s, mostrando o fluxo REAL ponta a ponta:

1. **Login** em `app.syncpost.com.br` (mostrar a URL na barra).
2. Abrir o **editor de carrossel** com conteúdo pronto (mostrar caption + slides).
3. Clicar **"Publicar no Instagram"** → modal.
4. Clicar **"Conectar Instagram"** → tela de **OAuth do Instagram** (mostrar o
   consentimento com os scopes, logar com a conta testadora).
5. Voltar conectado (`@syncpost_` aparece como conectado no modal).
6. Clicar **"Publicar agora"** → estado de "Publicando…" → sucesso ("Publicado ✅").
7. Abrir o **Instagram da conta testadora** e mostrar o **post/carrossel no feed**
   (prova de que publicou de verdade).

Dicas Meta: mostrar a **tela de permissão** e o **clique explícito de publicar**
são os dois momentos que o revisor mais procura. Sem cortes entre publicar e o feed.

## 4) Onde submeter (caminho no painel)
- **Casos de uso → Personalizar → Permissões e recursos** → linha
  `instagram_business_content_publish` → botão **"Ações"** → *Solicitar acesso avançado*
  → preencher descrição (seção 1), instruções (seção 2) e anexar o screencast (seção 3).
- Depois **Publicar** o app (página "Lançar").

## 5) Prazo realista
- Review da Meta: **~2–4 semanas por submissão**, geralmente com 1 rodada de ajuste.
- Só **depois de aprovado** os clientes publicam nas contas deles. Antes disso,
  só a conta testadora (@syncpost_) publica.
