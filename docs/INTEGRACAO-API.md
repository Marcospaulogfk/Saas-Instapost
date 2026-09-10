# Integração do Nexus Content com outros sistemas

> A chave de integração e as rotas `/api/v1/*`.
> Criado em 10/09/2026.

---

## Parte 1 — Pra que serve

### Em uma frase

A chave é a senha que **um outro programa** usa pra falar com o Nexus no seu
lugar.

### O problema que ela resolve

Hoje a sua rotina provavelmente é: alguém decide a pauta em algum lugar (uma
planilha, um CRM, um grupo de WhatsApp), alguém abre o Nexus, digita a pauta no
calendário e clica em gerar. É trabalho de digitação que existe só porque os
dois sistemas não se falam.

Com a chave, o outro sistema faz isso sozinho. Exemplos reais do que passa a ser
possível:

- **CRM:** fechou uma venda de um serviço novo, o CRM já cria a pauta do post de
  divulgação no calendário do Nexus, com data.
- **Automação (n8n, Make, Zapier):** toda segunda de manhã, o robô lê o que está
  planejado pra semana e manda no seu WhatsApp.
- **Planilha:** o time preenche a pauta na planilha que já usa; um script joga
  tudo no calendário do Nexus de uma vez.
- **Geração automática:** a pauta entrou, e o próprio sistema pede pro Nexus
  diagramar a arte. Ninguém abre o editor.

### O que a chave dá acesso

Quem tem a chave pode, **na sua conta**:

- ver quem é o dono da conta, o plano e quantos tokens sobraram;
- ver as suas marcas;
- ler o calendário de qualquer período;
- criar pautas novas no calendário;
- mudar data, hora e status de uma pauta;
- pedir que o Nexus gere a arte de uma pauta (isso **gasta tokens**, igual a
  gerar pelo painel).

O que a chave **não** faz: criar marca, mexer no seu plano, ver dados de outra
conta. Cada chave é de uma conta só, e enxerga exatamente o que aquela conta
enxerga.

### Como conseguir a sua

1. Entre no painel, em **Configurações > Integração**.
2. Escreva onde vai usar (ex.: "automação do n8n") e clique em **Gerar chave**.
3. **Copie na hora.** A chave aparece uma vez só.

A chave se parece com isto:

```
nxc_live_7dK2mNp4qRs8tUv3wXy6zAb9cDe1fGh5
```

### Cuidados (leia, são três)

1. **Quem tem a chave age como você.** Não mande por WhatsApp, não deixe em
   planilha compartilhada, não coloque em código que vai pro GitHub.
2. **Ela aparece uma vez.** O Nexus guarda só uma marca embaralhada dela
   (um "hash"), então nem o suporte consegue mostrar de novo. Perdeu? Gere
   outra e revogue a antiga.
3. **Desconfiou, revogue.** Revogar é imediato: quem estiver usando aquela chave
   para de funcionar no mesmo instante. Você pode ter várias chaves ativas (uma
   por sistema), e revogar uma não afeta as outras.

Na lista de chaves aparece a data de criação e o **último uso**. É por ali que
você descobre chave esquecida ("essa aí não é usada há três meses") e integração
parada ("o último uso foi na terça, então quebrou na terça").

### Limites

- 60 pedidos por minuto em cada chave. Passou disso, a resposta é um aviso
  pedindo pra esperar alguns segundos — não é bloqueio permanente.
- Até 20 pautas por chamada de criação e 10 por chamada de geração.
- Leitura do calendário: período de no máximo 120 dias e 200 pautas por
  resposta.

---

## Parte 2 — Como chamar (exemplos)

**Endereço base**

| Ambiente | Base |
|---|---|
| Produção | `https://app.nexuscontentai.com.br` |
| Local (dev) | `http://localhost:3003` |

**Autenticação** — todo pedido leva a chave neste cabeçalho:

```
Authorization: Bearer nxc_live_...
```

Nos exemplos abaixo, troque `$CHAVE` pela sua chave e o que estiver entre
`<>` pelo valor real.

```bash
CHAVE="nxc_live_..."
BASE="https://app.nexuscontentai.com.br"
```

---

### GET /api/v1/eu — quem sou eu

Use pra testar se a chave funciona. Não cria nem altera nada.

```bash
curl "$BASE/api/v1/eu" -H "Authorization: Bearer $CHAVE"
```

```json
{
  "ok": true,
  "id": "88654e3c-692e-4d4a-be20-60b72e398915",
  "email": "voce@empresa.com",
  "plano": { "id": "pro", "nome": "Pro", "status": "active" },
  "tokens": {
    "disponivel": 812,
    "plano": 800,
    "avulso": 12,
    "bonus": 0,
    "mensal": 1000,
    "usado_no_mes": 200
  }
}
```

`disponivel` é a soma dos três baldes — é o que dá pra gastar agora.

---

### GET /api/v1/marcas — as marcas da conta

Toda pauta pertence a uma marca. O `id` da marca sai daqui.

```bash
curl "$BASE/api/v1/marcas" -H "Authorization: Bearer $CHAVE"
```

```json
{
  "ok": true,
  "total": 2,
  "marcas": [
    { "id": "3f1c...", "nome": "Culturize-se", "instagram_handle": "@culturizese" },
    { "id": "9a77...", "nome": "Studio Ideação", "instagram_handle": null }
  ]
}
```

---

### GET /api/v1/calendario — ler o calendário

Parâmetros: `de` e `ate` (obrigatórios, `YYYY-MM-DD`) e `marca` (opcional, o id
da marca; `brand` também é aceito).

```bash
curl "$BASE/api/v1/calendario?de=2026-09-01&ate=2026-09-30" \
  -H "Authorization: Bearer $CHAVE"
```

```json
{
  "ok": true,
  "periodo": { "de": "2026-09-01", "ate": "2026-09-30" },
  "total": 12,
  "teto": 200,
  "itens": [
    {
      "id": "b21e...",
      "titulo": "3 erros que travam a venda",
      "descricao": "texto do post",
      "data": "2026-09-20",
      "hora": "09:00",
      "status": "pronto",
      "format": "post",
      "network": "instagram",
      "marca": { "brand_id": "3f1c...", "nome": "Culturize-se" },
      "arte": {
        "estado": "publicavel",
        "motivo": null,
        "artifact_type": "single_post",
        "artifact_id": "77aa...",
        "thumb_url": "https://...",
        "editor_url": "https://app.nexuscontentai.com.br/dashboard/editor/post-unico?post=77aa...",
        "imagens": 1
      },
      "publicacao": { "tentado_em": null, "ig_media_id": null, "erro": null },
      "updated_at": "2026-09-08T13:22:41.512Z"
    }
  ]
}
```

Campos que valem explicação:

| Campo | O que significa |
|---|---|
| `status` | `ideia`, `em_criacao`, `pronto`, `agendado`, `publicado`, `falhou` |
| `arte.estado` | `sem_arte`, `so_miniatura` (tem prévia, não serve pra publicar), `publicavel` |
| `arte.editor_url` | Link direto pro editor daquela peça |
| `total` | Quantas pautas existem no período (não quantas vieram na resposta) |
| `teto` | Máximo de itens por resposta (200) |
| `updated_at` | Mande de volta no PATCH pra não sobrescrever edição alheia |

---

### POST /api/v1/calendario — criar pautas

Cria até 20 por chamada. Campo `pautas` (ou `posts`, aceito por compatibilidade
com a rota antiga do CRM).

```bash
curl -X POST "$BASE/api/v1/calendario" \
  -H "Authorization: Bearer $CHAVE" \
  -H "Content-Type: application/json" \
  -d '{
    "pautas": [
      {
        "ref": "meu-id-1",
        "brand_id": "<id da marca>",
        "titulo": "3 erros que travam a venda",
        "descricao": "texto completo do post",
        "formato": "post",
        "objetivo": "inform",
        "data_sugerida": "2026-09-20"
      }
    ]
  }'
```

| Campo | Obrigatório | Observação |
|---|---|---|
| `ref` | sim | Seu identificador. Volta na resposta pra você casar cada item |
| `brand_id` | sim | Id de `GET /api/v1/marcas` |
| `titulo` | sim | Até 200 caracteres. É a chave da idempotência |
| `descricao` | não | O texto do post. Até 4000 caracteres |
| `formato` | não | `post`, `carrossel`, `stories`, `reels` (padrão: `post`) |
| `objetivo` | não | `sell`, `inform`, `engage`, `community` (padrão: `inform`) |
| `data_sugerida` | não | `YYYY-MM-DD` (padrão: amanhã) |
| `gerar` | não | `true` já pede a arte junto (ver `/api/v1/gerar`) |

```json
{
  "ok": true,
  "resultados": [
    { "ref": "meu-id-1", "resultado": "criado", "id": "b21e..." }
  ]
}
```

`resultado` por item: `criado`, `ja_existia` (mesmo título na mesma marca — não
duplica e devolve o id existente), `brand_nao_encontrada`, `invalido`. **Um item
ruim não derruba o lote**: cada um tem o seu desfecho, na ordem em que veio.

---

### PATCH /api/v1/calendario/&lt;id&gt; — mudar data, hora ou status

```bash
curl -X PATCH "$BASE/api/v1/calendario/<id da pauta>" \
  -H "Authorization: Bearer $CHAVE" \
  -H "Content-Type: application/json" \
  -d '{"data":"2026-09-22","hora":"09:00","status":"agendado"}'
```

Mande pelo menos um entre `data`, `hora` e `status`. `updated_at` é opcional e
recomendado: se a pauta tiver mudado no Nexus desde que você leu, a resposta é
`409 desatualizado` **com o item novo junto**, em vez de sobrescrever a edição de
outra pessoa.

Status que você pode escrever: `ideia`, `em_criacao`, `pronto`, `agendado`.
`publicado` e `falhou` são escritos pelo Nexus quando a publicação acontece —
tentar escrever devolve `409 campo_nao_seu`.

Colocar em `agendado` é um compromisso, então tem regras: precisa de hora
(`sem_hora`), o horário não pode ter passado (`data_no_passado`) e a arte
precisa estar pronta pra publicar (`sem_arte_publicavel`). Cada recusa vem com o
motivo escrito.

```json
{ "ok": true, "item": { "id": "b21e...", "data": "2026-09-22", "hora": "09:00" } }
```

O `item` devolvido é idêntico ao do `GET /api/v1/calendario`: dá pra redesenhar a
tela com a resposta, sem uma segunda chamada.

---

### POST /api/v1/gerar — pedir a arte (a ponte)

Pede pro Nexus diagramar a arte de pautas que já existem. **Gasta tokens**, igual
a gerar pelo painel. Até 10 por chamada.

```bash
curl -X POST "$BASE/api/v1/gerar" \
  -H "Authorization: Bearer $CHAVE" \
  -H "Content-Type: application/json" \
  -d '{"itens":[{"id":"<id da pauta>"}]}'
```

Opcionalmente você manda as fotos e os termos de busca que já escolheu:

```json
{
  "itens": [
    {
      "id": "<id da pauta>",
      "imagens": [{ "slide": 1, "url": "https://...", "origem": "unsplash" }],
      "buscas": [{ "slide": 1, "termo": "sala de reunião corporativa" }]
    }
  ]
}
```

```json
{ "ok": true, "itens": [{ "id": "b21e...", "resultado": "iniciado" }] }
```

A resposta volta **na hora**; a arte fica pronta depois (a geração roda em
segundo plano). Desfechos possíveis:

| `resultado` | Significa |
|---|---|
| `iniciado` | Entrou na fila. Consulte o calendário daqui a pouco |
| `em_andamento` | Já estava gerando (outra chamada chegou antes) |
| `ja_tem_arte` | Essa pauta já tem arte; gerar de novo só pelo painel |
| `sem_copy` | A pauta não tem texto (`descricao`) pra virar arte |
| `formato_nao_suportado` | Formato que a geração automática ainda não cobre |
| `nao_encontrado` | Id inexistente, ou de outra conta |

Pra acompanhar: leia o calendário de novo e olhe `arte.estado` do item.

---

## Erros

Todo erro vem em JSON, com **código** (pra o seu sistema decidir) e **motivo**
(em português, pra gente ler):

```json
{
  "ok": false,
  "erro": "chave_invalida",
  "motivo": "chave inválida ou revogada. Gere outra em Configurações > Integração."
}
```

| HTTP | `erro` | Quando acontece |
|---|---|---|
| 401 | `chave_ausente` | Faltou o cabeçalho `Authorization` |
| 401 | `chave_invalida` | Chave errada, mal copiada ou revogada |
| 429 | `limite_excedido` | Mais de 60 pedidos por minuto nessa chave |
| 400 | `json_invalido` | O corpo não é JSON válido |
| 400 | `periodo_invalido` / `periodo_longo` | `de`/`ate` ausentes, invertidos ou acima de 120 dias |
| 400 | `data_invalida` / `hora_invalida` | Use `YYYY-MM-DD` e `HH:MM` |
| 400 | `status_desconhecido` / `nada_pra_mudar` | Status fora da lista, ou PATCH vazio |
| 404 | `nao_encontrado` | A pauta não existe (ou não é desta conta) |
| 409 | `campo_nao_seu` | Tentou escrever `publicado`/`falhou` |
| 409 | `ja_publicado` | Peça já publicada: a data dela virou histórico |
| 409 | `sem_hora` / `data_no_passado` / `sem_arte_publicavel` | Faltou requisito pra agendar |
| 409 | `desatualizado` | A pauta mudou no Nexus; o item novo vem junto |
| 500 | `falha_interna` | Erro nosso. Tente de novo; se insistir, fale com o suporte |

---

## Notas técnicas (pra quem for mexer no código)

- A chave é `nxc_live_` + 32 caracteres (base58, sem `0`, `O`, `I` e `l`). Só o
  `sha256` dela vai pro banco (`public.api_keys`, migration `0028`), com o
  prefixo visível guardado à parte pra a tela conseguir listar.
- Quem autentica é `lib/chaves-api/autenticar.ts`, e é ele quem resolve o
  **dono pela chave** — nunca por variável de ambiente, nunca pelo
  `resolverDono` (esse responde "o dono do servidor" e só serve pro webhook
  antigo do WebSync-OS).
- O miolo do calendário mora em `lib/calendario/operacoes.ts`, dividido entre
  estas rotas e as antigas `/api/webhooks/websync-os/*`. As regras são as
  mesmas por construção, não por coincidência.
- `/api/v1` está na allowlist do middleware (`middleware.ts`). Rota nova nesse
  prefixo nasce **aberta**: o handler tem que começar chamando `autenticar()`.
- `last_used_at` é carimbado a cada chamada, sem `await`, pra não pagar
  latência por telemetria.
- Limite de 60/min por chave é em memória (uma instância). Se um dia o app
  rodar em várias, isso vira Redis.
