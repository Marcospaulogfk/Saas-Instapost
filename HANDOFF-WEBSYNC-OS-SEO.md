# Handoff pro WebSync-OS: SEO programático do Nexus Content

Documento pra quem trabalha no repo do **websync-os** (CRM). Escrito em 01/09/2026, do lado do Nexus Content (repo SyncPost), onde tudo descrito aqui já está construído e NO AR em produção. O que falta é a ponta do CRM: duas telas que consomem dois endpoints prontos.

## 1. A ideia geral do que foi feito no Nexus Content

Replicamos a jogada de aquisição do Canva: ser encontrado por quem busca o resultado, não a ferramenta. Quem pesquisa "carrossel para nutricionista" no Google cai numa página pública que parece o app (galeria de modelos ao vivo, filtro por profissão), e o gate de login só aparece quando clica em "Usar este modelo". O CTA atravessa o cadastro e entrega a pessoa dentro do gerador com o modelo e o briefing do nicho já carregados.

O que está no ar:

- **Piloto de 5 nichos** (decisão do Marcos em 01/09, validada por pesquisa com Search Console, autocomplete do Google, Trends e análise de SERP; doc completo em `PESQUISA-SEO-KEYWORDS.docx` neste repo): nutricionista, advogado, dentista, psicólogo, personal trainer. Outros 5 ficam em reserva pra onda 2 (páginas ainda respondem 404).
- **Catálogo de 10 templates curados** (2 por nicho, cada um casando um estilo visual com um tema forte do nicho). Todas as páginas mostram o catálogo inteiro com filtro por profissão; os do nicho da página vêm primeiro.
- **Atribuição de primeiro toque**: o middleware carimba o primeiro hit do visitante num cookie `nx_ft` (UTMs, gclid/fbclid, referrer externo, landing page, timestamp). No cadastro (email ou Google), isso vira a coluna imutável `users.first_touch` no banco. Ou seja: **toda conta criada sabe de onde veio**, e é assim que separamos orgânico de tráfego pago por canal e por nicho.
- **SEO técnico**: sitemap com as URLs do piloto (reenviado e processado no Search Console em 01/09), titles agressivos ("Carrossel para Advogado Pronto em Segundos | Grátis com IA"), JSON-LD, canonical.

Expectativa de canal: SEO em domínio novo leva 30 a 60 dias pra gerar impressão. Avaliação do piloto marcada pra outubro/2026, olhando impressão e clique por página no Search Console.

## 2. O que o websync-os precisa construir

### 2.1 Tela de preview SERP em Analytics (pedido do Marcos)

Igual ao preview do Yoast SEO no WordPress: pra cada página do piloto, mostrar como ela aparece no Google (title azul clicável, URL verde, description cinza), pra avaliar o apelo de clique de cada uma. Os dados vêm prontos do endpoint da seção 3.1; **não montar title/description no CRM**, eles saem da mesma função que gera a página real, então o preview nunca diverge do que o Google vê.

Sugestão de conteúdo da tela, por página: preview SERP + keyword primária + badge ativo/reserva + lista dos templates da página (nome e estilo). Páginas com `ativo: false` são de reserva: a URL listada é a que elas TERÃO, mas hoje responde 404 (mostrar como "onda 2", não como erro).

### 2.2 Leads com origem de aquisição

Puxar os cadastros do produto com `first_touch` pra alimentar o funil do CRM: quem veio de qual página de nicho, quem veio de tráfego pago, quem veio direto. Endpoint na seção 3.2, com sincronização incremental via `?since=`.

Como ler a origem de um lead pelo `first_touch`:

- **Orgânico de SEO**: `referrer` contendo google e SEM `utm_*`/`gclid`; o nicho é o path em `landing_page` (ex. `/modelos/carrossel/advogado`).
- **Pago**: presença de `utm_*` (Meta etc.) ou `gclid` (Google Ads).
- **Direto/desconhecido**: sem referrer e sem UTM.
- `first_touch: null`: conta criada antes da feature (01/09/2026) ou visitante sem cookie.

## 3. Contratos dos endpoints (prontos, em produção)

Autenticação nos dois: header `x-websync-secret` com o MESMO secret que o websync-os já usa na integração existente de pautas/status (`WEBSYNC_WEBHOOK_SECRET`). Sem o header: 401. Base: `https://app.nexuscontentai.com.br` (no apex `nexuscontentai.com.br` as rotas /api respondem 307 pro subdomínio; chamar direto o `app.`).

### 3.1 `GET /api/webhooks/websync-os/seo-pages`

Sem query params. Resposta:

```json
{
  "pages": [
    {
      "slug": "hub",
      "url": "https://nexuscontentai.com.br/modelos/carrossel",
      "title": "Modelos de Carrossel para Instagram: Crie o Seu em Segundos com IA",
      "description": "Escolha sua profissão, descreva o tema e a IA monta seu carrossel completo em segundos: copy, design e arte prontos pra editar. Comece grátis, sem cartão.",
      "h1": "Modelos de carrossel para Instagram",
      "keyword_primaria": "modelos de carrossel para instagram",
      "ativo": true,
      "templates": [
        { "id": "nutricionista-mitos-dieta", "nome": "Mitos da Dieta", "estilo": "minimal", "nicho": "nutricionista" }
      ]
    },
    {
      "slug": "advogado",
      "url": "https://nexuscontentai.com.br/modelos/carrossel/advogado",
      "title": "Carrossel para Advogado Pronto em Segundos | Grátis com IA",
      "description": "Descreva o tema e a IA monta seu carrossel de advogado completo: copy, design e arte em segundos. Modelos prontos pra editar. Comece grátis, sem cartão.",
      "h1": "Carrossel para advogado: pronto em segundos",
      "keyword_primaria": "carrossel para advogado",
      "ativo": true,
      "templates": [
        { "id": "advogado-voce-tem-direito", "nome": "Você Tem Direito", "estilo": "wesley", "nicho": "advogado" },
        { "id": "advogado-erros-custam-causa", "nome": "Erros que Custam a Causa", "estilo": "brandsdecoded", "nicho": "advogado" }
      ]
    }
  ]
}
```

O array real tem 11 entradas: `hub` (com os 10 templates), 5 nichos ativos (2 templates cada) e 5 de reserva (`ativo: false`, `templates: []`): esteticista, corretor-de-imoveis, social-media, barbearia, clinica-de-estetica.

### 3.2 `GET /api/webhooks/websync-os/leads?since=<ISO>&limit=<n>`

`since` opcional (sincronização incremental: mandar o `created_at` do último lead já puxado; valor inválido é ignorado, não dá erro). `limit` default 50, máximo 100. Ordenado por `created_at` desc. Resposta:

```json
{
  "leads": [
    {
      "id": "uuid",
      "email": "fulana@gmail.com",
      "created_at": "2026-09-01T18:00:00.000Z",
      "subscription_status": "trial",
      "objetivo_uso": "negocio_proprio",
      "first_touch": {
        "utm_source": "meta",
        "utm_medium": "paid",
        "utm_campaign": "lancamento",
        "gclid": "...",
        "fbclid": "...",
        "referrer": "https://www.google.com/",
        "landing_page": "/modelos/carrossel/advogado",
        "ts": "2026-09-01T17:40:00.000Z"
      }
    }
  ]
}
```

Todas as chaves de `first_touch` são opcionais exceto `landing_page` e `ts`; valores são strings de até 200 chars. `objetivo_uso` e `first_touch` podem ser `null`.

## 4. URLs do piloto (as que o Marcos quer ver no CRM)

- https://nexuscontentai.com.br/modelos/carrossel (hub)
- https://nexuscontentai.com.br/modelos/carrossel/nutricionista
- https://nexuscontentai.com.br/modelos/carrossel/advogado
- https://nexuscontentai.com.br/modelos/carrossel/dentista
- https://nexuscontentai.com.br/modelos/carrossel/psicologo
- https://nexuscontentai.com.br/modelos/carrossel/personal-trainer

Reserva (onda 2, hoje 404): esteticista, corretor-de-imoveis, social-media, barbearia, clinica-de-estetica (mesmo prefixo de URL).

## 5. Notas pra implementação no CRM

- Preferir puxar do endpoint a cada visualização (ou cache curto): quando um title mudar no produto, o preview deve refletir sem passo manual.
- O evento `cta_modelo_nicho` (dataLayer/GA4) dispara no clique de "Usar este modelo" com `{nicho, template, estilo}`, caso o CRM queira cruzar com dados do GA4 depois.
- A medição própria de landing do CRM (`lp.js`, injetada via `NEXT_PUBLIC_CRM_URL`) continua funcionando nas páginas novas; nada mudou nesse contrato.
- Não existe endpoint de escrita: o CRM só lê. Pautas/status/calendário da integração existente seguem intocados.
