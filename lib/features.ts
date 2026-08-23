/**
 * Flags de produto — o que está no ar para o usuário final.
 *
 * Existe pra desligar uma feature no lançamento SEM arrancar o código dela:
 * arrancar significa reescrever na volta, e reescrever significa reintroduzir
 * os mesmos bugs. Aqui a superfície some da UI e o código continua íntegro,
 * testável e a uma linha de voltar.
 */

/**
 * Geração de POST ÚNICO (peça de 1 slide: "Post único" e "Stories único").
 *
 * Desligado no lançamento: o pipeline de composição livre (lib/single-posts/
 * compose.ts) ainda está em calibragem — a crítica programática já segura o
 * grosso, mas nem toda peça sai no nível que a gente quer mostrar. O carrossel,
 * que é o produto maduro, continua inteiro.
 *
 * O que isto desliga: os formatos de 1 slide no passo 1 do wizard, os atalhos
 * "Criar post único" do dashboard e o atalho `?tipo=post-unico`.
 *
 * O que NÃO desliga, de propósito: abrir, editar, exportar e salvar posts
 * únicos que já existem. Quem gerou um post antes do desligamento não pode
 * perder acesso ao que é dele — a biblioteca e o editor seguem de pé.
 *
 * LIGADO EM DESENVOLVIMENTO: em `next dev` (localhost) a feature aparece
 * inteira, senão não dá pra calibrar o pipeline — é justamente ali que ela
 * precisa ser exercitada. Em build de produção continua desligada.
 * `NEXT_PUBLIC_POST_UNICO=1` força ligar (e `=0` força desligar) em qualquer
 * ambiente. NODE_ENV e NEXT_PUBLIC_* são inlinados pelo Next no bundle do
 * cliente, então a flag vale igual no servidor e no browser.
 */
export const POST_UNICO_HABILITADO =
  process.env.NEXT_PUBLIC_POST_UNICO === "1" ||
  (process.env.NEXT_PUBLIC_POST_UNICO !== "0" &&
    process.env.NODE_ENV !== "production")

/** Formatos de 1 slide dependem do pipeline de post único. */
export function podeGerarFormato(multiSlide: boolean): boolean {
  return multiSlide || POST_UNICO_HABILITADO
}

/**
 * As duas flags abaixo estão desligadas por um motivo diferente das de cima:
 * não é maturidade, é BANCO. As features estão prontas e testadas em código,
 * mas dependem de migrations que ainda não rodaram em lugar nenhum
 * (0014_indicacao.sql e 0016_inspiration_sources.sql).
 *
 * Sem as tabelas, a tela não degrada — ela quebra na cara do usuário. Ligar
 * qualquer uma delas ANTES de aplicar a migration correspondente é o caminho
 * mais curto pra um erro em produção.
 *
 * Ordem certa pra ligar: aplicar a migration em dev → conferir → aplicar em
 * produção → trocar a flag → deploy.
 */

/**
 * Indique e ganhe. Em produção fica DESLIGADA até a migration 0014 (e a 0020,
 * que põe o bônus no extrato) rodarem no banco; liga com NEXT_PUBLIC_INDICACAO=1
 * na Coolify depois disso. Em dev aparece inteira. Decisão 22/08/2026: "prometer
 * 100 créditos que não existem é o pior dos cenários".
 *
 * ATENÇÃO — enquanto `0014_indicacao.sql` não rodar no banco,
 * /dashboard/indicacao não tem as tabelas (`referrals`, `referral_credits`,
 * RPC `get_or_create_referral_code`) e a página falha. Aplicar a migration é o
 * que fecha isso; a flag já está do lado certo.
 */
export const INDICACAO_HABILITADA =
  process.env.NEXT_PUBLIC_INDICACAO === "1" ||
  (process.env.NEXT_PUBLIC_INDICACAO !== "0" && process.env.NODE_ENV !== "production")

/**
 * Afiliados (dinheiro, 25% recorrente via split do Asaas). Codado inteiro
 * (formulário de candidatura, aprovação, página do afiliado, split na
 * assinatura, comissões), mas DESLIGADO em produção por decisão do Marcos em
 * 22/08/2026: "cria essa opção mas não sobe para produção até estar rodando,
 * poucas pessoas têm conta Asaas, preciso pensar em outra coisa". Comissão,
 * cookie e e-mail de candidatura ficaram "indefinido por enquanto".
 * Depende da migration 0021_afiliados.sql. Liga com NEXT_PUBLIC_AFILIADOS=1.
 */
export const AFILIADOS_HABILITADO =
  process.env.NEXT_PUBLIC_AFILIADOS === "1" ||
  (process.env.NEXT_PUBLIC_AFILIADOS !== "0" && process.env.NODE_ENV !== "production")

/** Fontes próprias de inspiração. Depende de 0016_inspiration_sources.sql. */
export const FONTES_INSPIRACAO_HABILITADAS = false

/**
 * MODO BITMAP do post único (teste 19/08): a arte final É a imagem completa
 * gerada pelo nano-banana-2 (mesmo motor do BestContent) — sem clean plate e
 * sem transcrição HTML. A rodada de 3 posts da Rota B2 mostrou que re-diagramar
 * em HTML o que o modelo de imagem compôs quebra o layout a cada geração
 * (fontes medem diferente); o bitmap cru é o que tem qualidade de venda hoje.
 * A edição vira operação de imagem (nano-banana /edit) por cima, e camadas
 * HTML continuam disponíveis no editor pra quem quiser sobrepor.
 */
export const POST_UNICO_BITMAP = true

/**
 * HÍBRIDO (camadas medidas por visão sobre a clean plate): DESLIGADO.
 * Testado em 19/08: a posição sai certa, mas re-renderizar com as nossas
 * fontes perde a tipografia integrada do bitmap (luz, kerning, efeitos) — a
 * peça cai de qualidade na comparação direta com o bitmap puro. Fica como
 * experimento; a edição do produto é a cirúrgica (edit-bitmap) + camadas
 * HTML adicionais que o usuário mesmo põe por cima.
 */
export const POST_UNICO_HIBRIDO = false

/**
 * FOTO REAL (Wikimedia) no post único: DESLIGADA.
 *
 * A decisão de produto é que post único é gerado pelo nano-banana. Só que ela
 * não estava implementada: `resolvePhotoUrl` tenta a entidade real ANTES de
 * olhar o `photo_prompt`, sem nenhum guard de formato — então bastava a copy
 * citar uma pessoa pública nomeada pra peça desviar do nano-banana e cair no
 * compositor de camadas.
 *
 * Esse desvio é o pior dos três eixos ao mesmo tempo (medido em 21/08/2026):
 *   - arte PIOR   — texto em cima do rosto, cabeça cortada, contraste ruim,
 *                   e a crítica programática não pega nada disso;
 *   - custa MAIS  — US$0,104 de composição contra US$0,014 de copy só;
 *   - cobra MENOS — 4 tokens, porque foto de acervo não debita imagem.
 *
 * Fica como flag, e não arrancado, pelo mesmo motivo do resto deste arquivo:
 * o dia em que a crítica souber reprovar sobreposição de rosto e a composição
 * chegar no nível do bitmap, isto volta trocando uma linha.
 */
/**
 * FOTO REAL (Wikimedia) no post único: LIGADA em 21/08/2026, depois de uma
 * reprovação falsa no mesmo dia.
 *
 * O histórico importa pra ninguém reintroduzir o bug: a primeira rodada saiu
 * OUTRA PESSOA no lugar da Marília Mendonça, e parecia guarda-corpo do modelo.
 * Não era — o Fal baixa `image_urls` do lado dele e não consegue baixar
 * upload.wikimedia.org, então o modelo gerava sem referência nenhuma (ou
 * devolvia 422). Corrigido mandando a foto INLINE em base64; retestado com a
 * própria Marília, identidade pixel-fiel.
 *
 * O caminho é: Wikimedia acha a pessoa → foto baixa aqui → `editNanoBanana`
 * monta o design em volta do rosto verdadeiro → sai bitmap, mesmo padrão das
 * outras peças, cobrado como capa (25 tokens). A composição livre continua
 * fora deste caminho.
 */
export const POST_UNICO_FOTO_REAL = true
