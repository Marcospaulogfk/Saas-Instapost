# Publicar no Instagram — PENDENTE (handoff entre sessões)

> Status em 2026-07-10. A integração REAL está **codada, deployada e configurada**
> em produção. O que falta é **100% do lado do painel da Meta** (permissão + testers
> + App Review) — não tem mais código obrigatório pra publicar em dev mode.

## ✅ Já feito
- **Código** (fluxo "Instagram API with Instagram Login"):
  - `lib/instagram/meta.ts` — authorize URL, troca de code, token de longa duração,
    perfil e `publishCarousel` (containers por imagem → CAROUSEL → media_publish).
  - `app/api/instagram/{connect,callback,status,publish}/route.ts`.
  - `components/instagram/publish-to-instagram.tsx` — ligado nos endpoints reais
    (sem env → mostra "em configuração", não simula).
  - Scopes: `instagram_business_basic,instagram_business_content_publish`.
- **Banco:** migration `0011_instagram_connections.sql` **aplicada em produção**
  (tabela `instagram_connections`, token por usuário, RLS própria).
- **Coolify (produção), variáveis setadas:**
  - `INSTAGRAM_APP_ID=1642022093558678` ← **Instagram app ID** (NÃO é o app-level
    1503563704849302; o de Instagram Login é diferente).
  - `INSTAGRAM_REDIRECT_URI=https://app.syncpost.com.br/api/instagram/callback`
  - `INSTAGRAM_APP_SECRET` = chave secreta do app do Instagram (colada pelo Marcos;
    NÃO fica no repo; foi/serve rotacionar).
- **Deploy no ar** (branch `feature/template-editorial`). Verificado:
  `GET https://app.syncpost.com.br/api/instagram/status` → `{"connected":false,"configured":true}`
  (config reconhecida).

## ⏳ PENDENTE (do lado da Meta — conta do Marcos: developers.facebook.com, app "SyncPost" id 1503563704849302)
1. **Permissão de publicar:** *Permissões e recursos* → adicionar
   **`instagram_business_content_publish`** (o "Add all required permissions" do card
   de mensagens NÃO adiciona essa). Sem ela conecta mas não publica.
2. **Redirect URI no Meta:** conferir que `https://app.syncpost.com.br/api/instagram/callback`
   está salvo em *Configuração da API com login do Instagram → OAuth redirect URIs*.
   (Marcos disse que colou — reconferir.)
3. **Política de privacidade:** *Configurações do app → Básico* → URL =
   `https://syncpost.com.br/privacidade` (a Meta exige pra publicar/App Review).
4. **Testadores (modo dev):** *Funções do app → Testadores do Instagram* → adicionar a
   conta IG que vai publicar (Business/Creator + vinculada a Página) e **aceitar o
   convite** dentro do Instagram. Em dev mode, SÓ contas testadoras publicam — inclusive
   a do próprio Marcos. (Decisão do Marcos: NÃO colocar a conta do CLIENTE como tester.)
5. **App Review + verificação de negócio:** necessário pra publicar em contas de
   CLIENTES sem serem testers (produção geral). Leva alguns dias. É o gate final.

## 🔜 Próximo teste (quando 1–4 estiverem prontos)
- Logar no app → editor do carrossel → **Publicar no Instagram → Conectar Instagram**
  → login IG (conta testadora) → volta `?ig=ok` conectado → **Publicar agora**.
- Verificar o post no feed da conta. As imagens já são URLs públicas (fal.media), então
  o container da Meta consegue baixá-las.

## Observações técnicas
- O `callback` valida CSRF via cookie `ig_oauth_state` e salva token de longa duração
  (~60 dias) em `instagram_connections`. Renovação automática do token NÃO está
  implementada (TODO futuro: refresh antes de expirar).
- Se o "Conectar" der erro, checar: redirect URI idêntico ao registrado, permissão
  content_publish concedida, e conta é tester.
