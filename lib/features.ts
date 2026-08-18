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
 */
export const POST_UNICO_HABILITADO = false

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

/** Indique e ganhe. Depende de 0014_indicacao.sql. */
export const INDICACAO_HABILITADA = false

/** Fontes próprias de inspiração. Depende de 0016_inspiration_sources.sql. */
export const FONTES_INSPIRACAO_HABILITADAS = false
