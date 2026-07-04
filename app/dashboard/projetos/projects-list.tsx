"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  Search,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Download,
  Plus,
  Loader2,
  Layers,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getProjectGradient } from "@/lib/brand-colors"
import { formatRelativeDate } from "@/lib/format-date"
import { deleteCarouselV2, type CarouselListItem } from "@/app/actions/carousel"

interface Project {
  id: string
  title: string
  created_at: string
  brand: { id: string; name: string }
}

interface BrandOption {
  id: string
  name: string
}

interface ProjectsListProps {
  projects: Project[]
  carousels?: CarouselListItem[]
  brands: BrandOption[]
}

export function ProjectsList({
  projects,
  carousels = [],
  brands,
}: ProjectsListProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [brandFilter, setBrandFilter] = useState("todos")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const isEmpty = projects.length === 0 && carousels.length === 0

  const selectedBrandName =
    brandFilter === "todos"
      ? null
      : (brands.find((b) => b.id === brandFilter)?.name ?? null)

  const filtered = projects.filter((p) => {
    const matchesQuery = p.title.toLowerCase().includes(query.toLowerCase())
    const matchesBrand = brandFilter === "todos" || p.brand.id === brandFilter
    return matchesQuery && matchesBrand
  })

  const filteredCarousels = carousels.filter((c) => {
    const matchesQuery = c.title.toLowerCase().includes(query.toLowerCase())
    // Carrosséis guardam brand por nome (não têm brand_id), então filtramos
    // por nome da marca selecionada.
    const matchesBrand =
      !selectedBrandName ||
      (c.brand_name?.toLowerCase() === selectedBrandName.toLowerCase())
    return matchesQuery && matchesBrand
  })

  function handleDeleteCarousel(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteCarouselV2(id)
      setDeletingId(null)
      router.refresh()
    })
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Projetos</h1>
          <p className="text-muted-foreground mt-1">
            Todos os carrosseis que voce ja criou.
          </p>
        </div>
        {!isEmpty && (
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/dashboard/criar">
              <Plus className="w-4 h-4 mr-2" />
              Novo carrossel
            </Link>
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-4">
          <div className="rounded-full bg-primary/10 w-16 h-16 mx-auto flex items-center justify-center">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Seu primeiro carrossel</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Use a IA pra gerar copy + imagens em segundos, ou monte do zero
              no editor manual.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/criar">
              <Plus className="w-4 h-4 mr-2" />
              Criar carrossel
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar projetos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {brands.length > 0 && (
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="sm:w-56">
                  <SelectValue placeholder="Filtrar por marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as marcas</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {filtered.length === 0 && filteredCarousels.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">
                Nenhum projeto encontrado com esses filtros.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCarousels.map((carousel) => (
                <Link
                  key={carousel.id}
                  href={`/dashboard/carrossel?id=${carousel.id}`}
                  className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all hover:scale-[1.02] bg-black"
                >
                  {carousel.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={carousel.cover_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 ${getProjectGradient(carousel.id)}`}
                    />
                  )}
                  <Badge
                    variant="secondary"
                    className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white border-0 text-xs flex items-center gap-1"
                  >
                    <Layers className="w-3 h-3" />
                    {carousel.slide_count} slides
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-white"
                        onClick={(e) => e.preventDefault()}
                      >
                        {deletingId === carousel.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="w-4 h-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/carrossel?id=${carousel.id}`}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Abrir no editor
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={(e) => {
                          e.preventDefault()
                          handleDeleteCarousel(carousel.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="font-semibold text-white truncate">
                      {carousel.title}
                    </h3>
                    <p className="text-sm text-white/60">
                      {carousel.brand_name
                        ? `${carousel.brand_name} · ${formatRelativeDate(carousel.updated_at)}`
                        : formatRelativeDate(carousel.updated_at)}
                    </p>
                  </div>
                </Link>
              ))}
              {filtered.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projetos/${project.id}`}
                  className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all hover:scale-[1.02]"
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
        </>
      )}
    </div>
  )
}
