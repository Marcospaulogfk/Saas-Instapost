# Feedback do cliente (Culturize-se) — julho/2026

Fonte: "Feedback do Syncpost.docx" (recebido 13/07/2026). Status de cada item
após a rodada de correções na branch `feature/template-editorial`.

## Questões técnicas

| # | Feedback | Status | O que foi feito |
|---|----------|--------|-----------------|
| 1 | Post único não salva na biblioteca e não tem como sair da tela | ✅ Corrigido | `/teste` ganhou botão "← Dashboard" e "Salvar na biblioteca" (template → editor completo; modo livre → `single_posts` com `template_id free:*`, viewer em `/dashboard/posts-unicos/[id]`). Upload em data URL é re-hospedado no Storage ao salvar. |
| 2 | Marcadores (viral, educativo, dados…) geram conteúdo similar | ✅ Corrigido | A `abordagem` agora chega no prompt (`ABORDAGEM_BRIEF` em `lib/generation/claude.ts`) com registro/estrutura distintos por abordagem. Antes ela nem era enviada ao gerador de roteiro. |
| 3 | Com imagem de IA não dá pra baixar o ZIP do carrossel | ✅ Corrigido | Causa: CORS dos hosts externos (fal.media) sujava o canvas do html-to-image. Novo proxy `/api/proxy-image` (allowlist) + `proxiedImageUrl()` nas imagens dos slides; ZIP agora espera as imagens carregarem e não aborta tudo se 1 slide falhar. |
| 4 | Imagem IA quase sempre dá "forbidden" | ⚠️ Parcial (ops) | 401/403 do Fal.ai agora retorna mensagem clara em PT (era o "Forbidden" cru). **Causa raiz é a conta do Fal.ai (chave/saldo/acesso ao modelo) — verificar dashboard do Fal e o FAL_KEY do deploy.** |
| 5 | "200 imagens/mês, 47 usadas" — que imagens são essas? | ✅ Corrigido | Era MOCK hardcoded na tela de Configurações. Agora mostra tokens reais do perfil (usados/mês, saldo) com explicação: texto=1, imagem normal=5, imagem Pro=20 tokens. |
| 6 | Bot do Planejar engessado/"burro", trava | ✅ Corrigido | O "bot" era um roteiro fixo de 4 perguntas sem IA. Novo `/api/planejar/chat`: cada turno passa pelo Claude, reage ao que o cliente diz, pergunta só o que falta e decide quando gerar (brief/horizonte/quantidade). |
| 7 | Carrosséis da marca não aparecem na marca (zero conteúdo) | ✅ Corrigido | Página da marca só listava a tabela antiga `projects`. Aba virou "Conteúdos": inclui carrosséis v2 (match por `brand_name`) e posts únicos (`brand_id`). Card da lista de marcas também conta tudo. |
| 8 | Trocar o @ para @culturizesebrasil manualmente nos slides | ✅ Corrigido | O handle salvo da marca (`instagram_handle`) agora chega ao editor (antes era slug do nome). Campo "Handle do Instagram (@)" editável na sidebar do editor de carrossel. |
| 9 | Texto do canto superior direito dos cards não é editável | ✅ Corrigido | É o campo `cta_badge` (pill "categoria"). Campo renomeado pra "Tag do slide (canto superior direito)" com hint — sempre foi persistido, só não era claro. |
| 10 | Excluir projeto mostra tela "Cannot coerce the result to a single JSON object" | ✅ Corrigido | `loadCarouselV2` usava `.single()` → erro cru do PostgREST ao abrir carrossel excluído. Agora `maybeSingle()` + mensagem amigável + botões "Ir pra biblioteca"/"Criar novo". |

## Questões conceituais

| # | Feedback | Status | O que foi feito |
|---|----------|--------|-----------------|
| 11 | Legendas muito sucintas | ✅ Corrigido | Prompt da caption reescrito (carrossel e post único): gancho + 3-5 parágrafos com contexto/argumento/implicação + camada extra que não está nos slides + CTA + hashtags. |
| 12 | Conteúdo raso, "cara de IA", raciocínio podado | ✅ Melhorado | Nova seção "PROFUNDIDADE EDITORIAL" no system prompt: mecanismo (como/por quê), consequência de 2ª ordem/trade-off, cada slide avança o raciocínio, teste do especialista. |
| 13 | Importação de imagens limitada (retrabalho em toda postagem) | 🔜 Backlog | Upload pontual já existe nos editores. A dor real é reuso: proposta de "Biblioteca de imagens da marca" (tabela `brand_images` + galeria na marca + picker nos editores) — task spawnada, depende de migration (OK do CEO). |
| 14 | Pelo menos 10 slides (ideal 20) | ✅ Corrigido | Limite subiu pra 20 em todo o fluxo (wizard 1–20, API, /teste 5/7/10/15/20, `max_tokens` escala com nSlides). Obs: 15–20 slides demoram mais pra gerar (~1-3 min). |
| 15 | "Gerar novo roteiro" varia pouco | ✅ Corrigido | A regeração agora envia os títulos do roteiro rejeitado (`avoidTitles`) e o prompt exige versão substancialmente diferente (outro gancho/arco/exemplos). |

## Pendências operacionais (fora do código)

1. **Fal.ai "forbidden"**: conferir saldo/estado da conta e se o `FAL_KEY` do
   deploy (Coolify) é o mesmo (e válido) do `.env.local`. É a causa provável
   do item 4.
2. **Migration da biblioteca de imagens** (item 13): aguarda OK.
3. Deploy: mudanças na branch `feature/template-editorial` — build local OK.
