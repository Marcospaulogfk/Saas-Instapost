# Instagram (publicar + métricas) — estado e pendências

> Atualizado em 2026-08-22. Código completo pra publicar e ler métricas; o que
> segura é o App Review da Meta, que exige virar **Tech Provider** (irreversível).

## Código (feito)
- OAuth "Instagram API with Instagram Login", scopes
  `instagram_business_basic, instagram_business_content_publish, instagram_business_manage_insights`
  (`lib/instagram/meta.ts`, Graph v23.0).
- Publicar: `components/instagram/publish-to-instagram.tsx` renderiza a ARTE FINAL
  (html-to-image → upload → URL pública) na hora do clique, no carrossel e no post
  único. Antes ia a foto de fundo crua. Id da mídia publicada fica em
  `instagram_publications` (migration **0019 — aplicar em prod**).
- Token de 60 dias renovado automaticamente a <10 dias do vencimento
  (`lib/instagram/connection.ts`).
- Métricas: `GET /api/instagram/insights` + página `/dashboard/instagram`
  (perfil, alcance/views/engajamento 30d, série de seguidores, últimos posts com
  insights, selo "SyncPost" no que saiu daqui). Nada persistido.
- Callbacks exigidos pelo App Review (públicos, validam HMAC do signed_request):
  `POST /api/instagram/deauthorize` e `POST /api/instagram/data-deletion`.
  Página pública: `/instagram/exclusao-de-dados`.
- `/api/instagram/connect?returnTo=` volta pra página de origem.
- Privacidade cita insights e exclusão de dados.

## Painel da Meta (app SyncPost 1503563704849302 · IG app 1642022093558678)
Feito em 22/08: permissões basic + content_publish + manage_insights em "Pronto
para teste"; redirect URI confere; testador `nexuscontent_ai` cadastrado.

Pendente (na ordem):
1. Confirmar no Instagram que `nexuscontent_ai` ACEITOU o convite de testador.
2. Configurações do login da empresa → preencher
   - URL de desautorização: `https://app.syncpost.com.br/api/instagram/deauthorize`
   - URL de exclusão de dados: `https://app.syncpost.com.br/api/instagram/data-deletion`
3. Configurações básicas: Termos → `https://syncpost.com.br/termos`;
   Exclusão de dados (instruções) → `https://syncpost.com.br/instagram/exclusao-de-dados`;
   Categoria do app (vazia).
4. Teste real em dev mode: conectar (reconectar se já estava, pro scope de insights
   entrar) → publicar carrossel e post → abrir /dashboard/instagram.
5. Decidir/iniciar **Tech Provider** + verificação da empresa (MEI WebSync).
6. Screencast (roteiro em APP_REVIEW_INSTAGRAM.md) e submeter content_publish +
   manage_insights JUNTOS numa submissão só.
7. Publicar o app (botão "Publicar" já liberado).

## Deploy
- Coolify: nenhuma env nova. Aplicar migration 0019.
