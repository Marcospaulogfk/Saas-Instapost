# Deploy

**Onde roda:** VPS da Hetzner com Coolify, servindo https://syncpost.com.br.
Não é Vercel (o README antigo dizia Vercel, está desatualizado).

**Painel do Coolify:** http://188.245.226.71:8000/

**Branch que vai pro ar:** `feature/template-editorial`

## Auto-deploy: ATIVO desde 21/08/2026

O webhook do Git está conectado no Coolify. **Push na branch `feature/template-editorial`
dispara build e deploy sozinho**, sem precisar clicar em nada no painel.

Medição do dia em que foi ligado: push às 07:32:12Z, build novo no ar às 07:34:29Z.
Cerca de **2 minutos e 20 segundos** do push até estar servindo.

Fluxo normal de uma entrega:

```bash
git push origin HEAD:feature/template-editorial
```

E só. O deploy acontece em seguida.

## Como saber se o deploy chegou

`app/sitemap.ts` usa `new Date()` no prerender, então o `<lastmod>` do sitemap é o
**timestamp do build**. É a forma mais confiável de saber a idade do que está no ar:

```bash
curl -s https://syncpost.com.br/sitemap.xml | grep -m1 lastmod
```

Se o `lastmod` ainda for anterior ao seu push, o build não chegou (ou falhou).

## Smoke test pós-deploy

```bash
for p in / /login /pricing /robots.txt; do curl -s -o /dev/null -w "$p -> %{http_code}\n" "https://syncpost.com.br$p"; done
```

Todas devem responder 200. Atenção: a rota de preços é `/pricing`, não `/precos`.

## Riscos conhecidos

1. **Build depende da rede.** `app/layout.tsx` e outras páginas usam `next/font/google`
   (Bebas_Neue, Playfair_Display, Anton, Inter, Archivo), então o build baixa fontes do
   Google em tempo de compilação. Num VPS que perde conexão isso já derrubou build com
   erro "Failed to fetch `Archivo` from Google Fonts", de forma intermitente. Correção de
   fundo, ainda não feita: migrar pra `next/font/local` com os `.woff2` versionados.
2. **VPS instável.** Historicamente ~25% das conexões davam timeout de TCP nas portas
   443 e 80.
3. **Deploy não é reprodutível fora do painel.** Não há `Dockerfile`, `nixpacks.toml` nem
   `.nvmrc` versionados: a configuração de build existe só dentro do Coolify.
4. **Dois lockfiles rastreados** (`package-lock.json` e `pnpm-lock.yaml`), divergentes.

Se o build falhar, o Coolify mantém o container anterior no ar, então build quebrado
não derruba produção: só significa que a versão nova não subiu.

## Histórico

Entre o fim de julho e 21/08/2026 o auto-deploy **não** disparava: os pushes iam pro
GitHub e produção continuava servindo build antigo por horas, exigindo clique manual em
Deploy no painel. Resolvido com a conexão do webhook.
