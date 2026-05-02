"use client"

import Link from "next/link"
import {
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Download,
  Plus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { getProjectGradient } from "@/lib/brand-colors"
import { formatRelativeDate } from "@/lib/format-date"

interface ProjectCard {
  id: string
  title: string
  created_at: string
  brand: { id: string; name: string }
}

interface RecentProjectsProps {
  projects: ProjectCard[]
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-h3 font-display font-semibold text-text-primary">Projetos recentes</h2>
        {projects.length > 0 && (
          <Link
            href="/dashboard/projetos"
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Ver todos &rarr;
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-medium bg-gradient-card backdrop-blur-xl p-12 text-center space-y-3">
          <p className="text-text-secondary">
            Você ainda não criou nenhum carrossel.
          </p>
          <Button asChild className="bg-gradient-purple hover:shadow-glow">
            <Link href="/dashboard/criar">
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro carrossel
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projetos/${project.id}`}
              className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border-subtle hover:border-purple-600/50 hover:shadow-glow-sm transition-all hover:scale-[1.02]"
            >
              <div
                className={`absolute inset-0 ${getProjectGradient(project.id)}`}
              />
              <Badge
                variant="secondary"
                className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white border-0 text-xs"
              >
                {project.brand.name}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-white"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="font-semibold text-white truncate">
                  {project.title}
                </h3>
                <p className="text-sm text-white/60">
                  {formatRelativeDate(project.created_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
