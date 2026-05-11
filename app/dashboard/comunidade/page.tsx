import { Users, Heart, MessageCircle, Eye, Lock } from "lucide-react"

// Posts mockados — quando tivermos o feature real, vem do banco
const MOCK_POSTS = [
  { autor: "Juliana G.", titulo: "Não Existe Loja Invisível", likes: 234, comentarios: 12, gradient: "from-purple-500 to-pink-500" },
  { autor: "Prontozapy", titulo: "Você é Vendedor 24/7?", likes: 189, comentarios: 8, gradient: "from-blue-500 to-cyan-500" },
  { autor: "Francieli", titulo: "5 Erros do Insta", likes: 412, comentarios: 24, gradient: "from-orange-500 to-red-500" },
  { autor: "Prime Inv.", titulo: "Antes de Investir, Leia", likes: 156, comentarios: 6, gradient: "from-emerald-500 to-teal-500" },
  { autor: "Hellen Mac.", titulo: "Estética Real", likes: 298, comentarios: 18, gradient: "from-pink-500 to-rose-500" },
  { autor: "Marcos P.", titulo: "Site é Investimento", likes: 167, comentarios: 9, gradient: "from-violet-500 to-purple-500" },
  { autor: "Studio Fit", titulo: "Você não Treina pra Estar em Forma", likes: 521, comentarios: 32, gradient: "from-lime-500 to-green-500" },
  { autor: "Olha Aqui", titulo: "Carrossel que Salva o Algoritmo", likes: 378, comentarios: 21, gradient: "from-amber-500 to-orange-500" },
]

export default function ComunidadePage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Comunidade</h1>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-lime/10 border border-lime/30 text-lime uppercase tracking-wider">
            Em breve
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          Veja o que outros criadores estão postando, troque ideias e inspire-se com
          o feed da comunidade SyncPost.
        </p>
      </div>

      {/* Banner em breve */}
      <div className="rounded-xl bg-gradient-to-br from-purple-600/10 via-purple-600/5 to-transparent border border-purple-600/30 p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-purple/5 pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-text-primary mb-1">
              Feed da comunidade em construção
            </h2>
            <p className="text-sm text-text-secondary mb-3 max-w-2xl">
              Em breve você vai poder publicar seus posts pra comunidade SyncPost,
              dar curtida, comentar e remixar conteúdos. Por enquanto, dá uma olhada
              em como vai ficar.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] px-3 py-1 rounded-full bg-background-tertiary/60 border border-border-subtle text-text-secondary">
                Feed cronológico
              </span>
              <span className="text-[11px] px-3 py-1 rounded-full bg-background-tertiary/60 border border-border-subtle text-text-secondary">
                Curtir e comentar
              </span>
              <span className="text-[11px] px-3 py-1 rounded-full bg-background-tertiary/60 border border-border-subtle text-text-secondary">
                Remixar posts
              </span>
              <span className="text-[11px] px-3 py-1 rounded-full bg-background-tertiary/60 border border-border-subtle text-text-secondary">
                Ranking semanal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview do feed (mock) */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Preview · posts da comunidade
        </h3>
        <span className="text-[11px] text-text-muted">demonstração</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 opacity-70 pointer-events-none">
        {MOCK_POSTS.map((p, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden bg-background-tertiary/40 border border-border-subtle"
          >
            <div className={`aspect-[4/5] bg-gradient-to-br ${p.gradient} flex items-end p-3`}>
              <p className="text-white text-sm font-bold leading-tight drop-shadow-lg">
                {p.titulo}
              </p>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-[11px] text-text-secondary truncate">@{p.autor}</p>
              <div className="flex items-center gap-3 text-[10px] text-text-muted">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" /> {p.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> {p.comentarios}
                </span>
                <span className="flex items-center gap-1 ml-auto">
                  <Eye className="w-3 h-3" /> {(p.likes * 8).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
