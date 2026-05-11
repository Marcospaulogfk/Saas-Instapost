import Link from "next/link"
import { Plus, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listSinglePosts } from "@/lib/single-posts/queries"
import { getTemplate } from "@/lib/single-posts/catalog"
import { formatRelativeDate } from "@/lib/format-date"
import { DeletePostButton } from "./delete-post-button"

export default async function PostsUnicosPage() {
  const posts = await listSinglePosts()

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h1 font-display font-bold text-text-primary">
            Posts únicos
          </h1>
          <p className="text-text-secondary mt-1">
            {posts.length === 0
              ? "Você ainda não salvou nenhum post único."
              : `${posts.length} post${posts.length === 1 ? "" : "s"} salvo${posts.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/criar/post-unico">
            <Plus className="w-4 h-4 mr-2" />
            Criar post único
          </Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-medium bg-gradient-card backdrop-blur-xl p-12 text-center space-y-4">
          <div className="rounded-full bg-purple-500/10 w-16 h-16 mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Comece pelo primeiro</h2>
            <p className="text-sm text-text-secondary mt-1 max-w-md mx-auto">
              Posts únicos são imagens 4:5 prontas pra Instagram — comunicados,
              ofertas, vagas, manifesto da marca, transformações, etc.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/criar/post-unico">
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro post
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p) => {
            const template = getTemplate(p.template_id)
            return (
              <div
                key={p.id}
                className="rounded-xl border border-border-subtle bg-card hover:border-purple-500/40 transition-all overflow-hidden flex flex-col"
              >
                <Link
                  href={`/dashboard/posts-unicos/${p.id}`}
                  className="block aspect-[4/5] bg-zinc-900 relative overflow-hidden"
                >
                  {p.rendered_image_url ? (
                    <img
                      src={p.rendered_image_url}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-text-muted text-xs">
                      sem preview salvo
                    </div>
                  )}
                </Link>
                <div className="p-3 space-y-1">
                  <Link
                    href={`/dashboard/posts-unicos/${p.id}`}
                    className="font-semibold text-sm text-text-primary truncate block hover:text-purple-400"
                  >
                    {p.title}
                  </Link>
                  <p className="text-[11px] text-text-muted truncate">
                    {template?.label ?? p.template_id} · {p.brand_name}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[10px] text-text-muted">
                      {formatRelativeDate(p.created_at)}
                    </p>
                    <DeletePostButton postId={p.id} title={p.title} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
