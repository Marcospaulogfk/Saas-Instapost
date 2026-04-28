"use client"

import Link from "next/link"
import { MoreHorizontal, Pencil, Copy, Trash2, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const projects = [
  {
    id: 1,
    title: "10 dicas de churrasco",
    brand: "Culturize-se",
    date: "ha 2 dias",
    color: "bg-gradient-to-br from-orange-600 to-red-700",
  },
  {
    id: 2,
    title: "Marketing Digital 2024",
    brand: "Agencia X",
    date: "ha 3 dias",
    color: "bg-gradient-to-br from-blue-600 to-purple-700",
  },
  {
    id: 3,
    title: "Receitas de verao",
    brand: "Culturize-se",
    date: "ha 5 dias",
    color: "bg-gradient-to-br from-green-600 to-teal-700",
  },
  {
    id: 4,
    title: "Guia de vinhos",
    brand: "Culturize-se",
    date: "ha 1 semana",
    color: "bg-gradient-to-br from-purple-600 to-pink-700",
  },
  {
    id: 5,
    title: "Tendencias tech",
    brand: "Agencia X",
    date: "ha 1 semana",
    color: "bg-gradient-to-br from-cyan-600 to-blue-700",
  },
  {
    id: 6,
    title: "Fitness em casa",
    brand: "FitBrand",
    date: "ha 2 semanas",
    color: "bg-gradient-to-br from-yellow-600 to-orange-700",
  },
]

export function RecentProjects() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Projetos recentes</h2>
        <Link href="/dashboard/projetos" className="text-sm text-primary hover:underline">
          Ver todos &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/editor/${project.id}`}
            className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all hover:scale-[1.02]"
          >
            {/* Background */}
            <div className={`absolute inset-0 ${project.color}`} />
            
            {/* Brand badge */}
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white border-0 text-xs"
            >
              {project.brand}
            </Badge>

            {/* Action menu */}
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

            {/* Bottom overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <h3 className="font-semibold text-white truncate">{project.title}</h3>
              <p className="text-sm text-white/60">{project.date}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
