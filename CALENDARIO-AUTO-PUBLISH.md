# Calendário compartilhado + publicação automática no Instagram

> 26/08/2026. **NO AR e ARMADO em produção**: commit `f12e33d`, migration 0024
> aplicada, e o cron `publicar-agendados` agendado na Coolify (`*/15 * * * *`,
> execução manual verde devolvendo o JSON do worker). A máquina roda sozinha.
> Nada disso publica pra cliente antes do Tech Provider na Meta (ver
> `INSTAGRAM_PENDENTE.md`).

## O problema que quase virou bug de produção

"Publica automático quando chega o dia" parecia configuração e era construção.
A arte final **é função do DOM com o editor aberto**: `renderSlidesForPublish`
roda `html-to-image` sobre o nó do preview, slide a slide, e só então hospeda.
Um cron não tem DOM — não existe imagem pra mandar pra Meta. Um worker ingênuo
só descobriria isso às 9h de um dia agendado, com o post não saindo e ninguém
sabendo por quê.

**Mas não faltava infraestrutura: faltava guardar.** O PNG em 1080x1350 já era
gerado e já era hospedado em URL pública nossa a cada clique em "Publicar no
Instagram" — e a URL era descartada logo depois. A v1 persiste o que já existe.

## O que foi medido antes de decidir (26/08, só leitura)

| | |
|---|---|
| single_posts | 18 (6 com `rendered_image_url`) |
| editorial_carousels | 37 (0 com imagem — a tabela não tem coluna) |
| **peças com arte publicável** | **0 de 55** |
| scheduled_posts | 0 linhas |
| instagram_connections | 0 |

As 6 URLs passam em qualquer checklist (HTTP 200 sem auth, `image/png`, bucket
nosso, não expiram) e são **540x675 — a miniatura da biblioteca**
(`THUMB_WIDTH` em `lib/single-posts/save.ts`). A Meta aceita 540 (o mínimo dela
é 320): publicaria sem erro nenhum, com metade da resolução, no perfil do
cliente. Por isso o estado da arte tem **três** valores e não é um booleano.

## Desenho

- **Um dono por campo, não espelho.** A data mora no Nexus porque quem publica
  precisa dela no mesmo banco do token e da arte: se morasse no CRM, uma queda
  dele viraria post não publicado. O calendário do CRM é uma **vista**.
- **Status dividido.** `ideia|em_criacao|pronto|agendado` é editorial e o CRM
  escreve; `publicado|falhou` só o worker escreve.
- **Hora é obrigatória pra agendar.** `scheduled_time` é nullable (0012) e
  nenhuma linha tem hora: sem exigir, o worker ou publica tudo à meia-noite ou
  não publica nada.

### Os freios (publicar sozinho é irreversível)

1. só publica o que está `agendado` **explicitamente** — `pronto` é sobre a
   arte, `agendado` é sobre a intenção;
2. falha **não tem retentativa cega**: carimba `falhou` com motivo e para;
3. peça vencida **não publica atrasada** (`JANELA_PADRAO_MIN`, 2h) — worker que
   volta com três posts de ontem viraria enxurrada no perfil;
4. a tentativa é registrada **antes** do envio: se o processo morrer entre o
   `publish` e o carimbo, a rodada seguinte não tenta de novo. Publicar duas
   vezes é o único desfecho pior que não publicar.

## Arquivos

| Arquivo | O quê |
|---|---|
| `supabase/migrations/0024_calendario_auto_publish.sql` | `publish_image_urls` + `publish_prepared_at` nas duas tabelas de arte, tabela `publish_attempts`, índice da varredura |
| `lib/calendario/agenda.ts` | relógio: hora de parede BR -> instante UTC, janela de publicação |
| `lib/calendario/arte.ts` | a regra dos três estados (`sem_arte`/`so_miniatura`/`publicavel`) |
| `lib/calendario/itens.ts` | monta o item do contrato (GET e PATCH usam o mesmo) |
| `app/actions/publish-art.ts` | "Preparar pra agendar": persiste a arte final |
| `components/instagram/preparar-agendamento.tsx` | o botão, nos dois editores |
| `app/api/cron/publicar/route.ts` | o worker |
| `app/api/webhooks/websync-os/calendario/route.ts` | GET do calendário |
| `app/api/webhooks/websync-os/calendario/[id]/route.ts` | PATCH (mover/agendar) |

Testes: `lib/calendario/*.test.ts` (26 passando, incluindo o caso das 540px e o
da URL do Fal que expira).

## Contrato com o WebSync-OS

Mesmo `x-websync-secret` e mesmo guard de dono do `/status`. Vive em
`/api/webhooks/*` porque é a allowlist do middleware (`middleware.ts:25`):
fora dali cai no gate de sessão e responde 401 sem explicar.

```
GET /api/webhooks/websync-os/calendario?de=YYYY-MM-DD&ate=YYYY-MM-DD[&brand=]
  -> { ok, periodo, total, teto, itens: [{ id, titulo, descricao, data, hora,
       status, format, network, marca:{brand_id,nome},
       arte:{estado,motivo,artifact_type,artifact_id,thumb_url,editor_url,imagens},
       publicacao:{tentado_em,ig_media_id,erro}, updated_at }] }

PATCH /api/webhooks/websync-os/calendario/<id>  { data?, hora?, status?, updated_at? }
  -> { ok:true, item } | { ok:false, erro, motivo, ... }
```

**Todo erro sai no mesmo formato**, sem exceção: `{ ok:false, erro:<código>,
motivo:<texto legível> }`. Não há chave `error` nestas rotas — a sessão do CRM
achou a divergência exercitando o dev (as validações de formato ainda saíam no
estilo antigo), e valia arrumar: quem escrever o próximo consumidor lê o
contrato, vê só `erro` e descarta em silêncio as mensagens mais úteis que a
gente tem. Códigos em `lib/calendario/resposta.ts`:

| HTTP | Códigos |
|---|---|
| 400 | `json_invalido`, `periodo_invalido`, `periodo_longo`, `data_invalida`, `hora_invalida`, `status_desconhecido`, `nada_pra_mudar` |
| 401 / 503 | `nao_autorizado` / `nao_configurado` |
| 404 | `nao_encontrado` (pauta de outro dono responde igual a inexistente) |
| 409 | `campo_nao_seu`, `ja_publicado`, `sem_hora`, `sem_arte_publicavel`, `data_no_passado`, `desatualizado`, `dono_indefinido` |
| 500 | `falha_interna` |

`desatualizado` devolve o `item` novo junto, pra tela se redesenhar sem uma
segunda chamada; `sem_arte_publicavel` devolve `arte_estado`, pra etiqueta
saber se diz "falta gerar" ou "só tem miniatura".

## Pra ir ao ar

1. ~~Aplicar a migration 0024~~ **FEITO em 26/08/2026.** Pelo próprio
   `supabase db push --linked` (dry-run antes): o histórico remoto foi
   reparado hoje mais cedo e a CLI voltou a funcionar neste repo — não precisou
   do SQL Editor. Conferido depois rodando os selects exatos que o código usa
   (as duas tabelas de arte com as colunas novas e `publish_attempts`): 200 nos
   três.
2. **Agendar o cron** na Coolify, ao lado do de renovação — **ÚNICO passo que
   falta do lado do Nexus**:
   ```
   */15 * * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
     https://app.nexuscontentai.com.br/api/cron/publicar
   ```
3. **Fumaça:** preparar uma peça no editor ("Preparar pra agendar"), agendar
   pelo PATCH com hora daqui a alguns minutos, e conferir se saiu — em dev mode
   isso só funciona na conta de testador `@nexuscontent_ai`.
4. Do lado do CRM: `SYNCPOST_WEBHOOK_URL` ainda aponta pra `localhost:3007`.
   Enquanto não virar `https://app.nexuscontentai.com.br/api/webhooks/websync-os`
   (no `.env` da **VPS**, não só no local), nenhuma pauta atravessa.

## O que NÃO está pronto

- A tela do calendário do CRM (é do lado de lá, em construção).
- Publicar pra qualquer conta que não seja a de testador: depende do Tech
  Provider na Meta, que é decisão do CEO e irreversível.
- Uma conta de Instagram por **marca**: hoje `instagram_connections` tem
  `user_id` como PK — uma conta do app, uma conta do Instagram. Cada item do
  calendário já carrega a marca, então a segunda conta é migration, não
  refazer tela.
