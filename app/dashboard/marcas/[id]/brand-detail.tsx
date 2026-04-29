"use client"

import Link from "next/link"
import { ArrowLeft, Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getBrandGradient, getProjectGradient } from "@/lib/brand-colors"
import { formatRelativeDate } from "@/lib/format-date"

interface Brand {
  id: string
  name: string
  description: string | null
  website_url: string | null
  instagram_handle: string | null
  target_audience: string | null
  tone_of_voice: string | null
  visual_style: string | null
  main_objective: string | null
  brand_colors: string[]
}

interface Project {
  id: string
  title: string
  created_at: string
}

interface BrandDetailProps {
  brand: Brand
  projects: Project[]
}

export function BrandDetail({ brand, projects }: BrandDetailProps) {
  const hasIdentity =
    !!brand.tone_of_voice ||
    !!brand.target_audience ||
    !!brand.visual_style ||
    brand.brand_colors.length > 0 ||
    !!brand.website_url ||
    !!brand.instagram_handle

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/dashboard/marcas">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para marcas
        </Link>
      </Button>

      <div className="flex items-center gap-4">
        <div
          className={`w-20 h-20 rounded-xl ${getBrandGradient(brand.id)} flex items-center justify-center flex-shrink-0`}
        >
          <span className="text-4xl font-bold text-white">
            {brand.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{brand.name}</h1>
          {brand.description && (
            <p className="text-muted-foreground">{brand.description}</p>
          )}
        </div>
        <Button variant="outline">
          <Pencil className="w-4 h-4 mr-2" />
          Editar marca
        </Button>
      </div>

      <Tabs defaultValue="identidade" className="w-full">
        <TabsList>
          <TabsTrigger value="identidade">Identidade</TabsTrigger>
          <TabsTrigger value="projetos">
            Projetos {projects.length > 0 && `(${projects.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identidade" className="space-y-6 pt-6">
          {!hasIdentity && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              Esta marca ainda nao tem identidade configurada. Edite a marca pra
              adicionar tom de voz, paleta de cores e publico-alvo.
            </div>
          )}

          {brand.tone_of_voice && (
            <section className="rounded-xl border border-border p-6 space-y-2">
              <h3 className="font-semibold">Tom de voz</h3>
              <p className="text-muted-foreground">{brand.tone_of_voice}</p>
            </section>
          )}

          {brand.target_audience && (
            <section className="rounded-xl border border-border p-6 space-y-2">
              <h3 className="font-semibold">Publico-alvo</h3>
              <p className="text-muted-foreground">{brand.target_audience}</p>
            </section>
          )}

          {brand.brand_colors.length > 0 && (
            <section className="rounded-xl border border-border p-6 space-y-3">
              <h3 className="font-semibold">Paleta de cores</h3>
              <div className="flex flex-wrap gap-3">
                {brand.brand_colors.map((color) => (
                  <div key={color} className="flex flex-col items-center gap-2">
                    <div
                      className="w-16 h-16 rounded-lg border border-border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-mono text-muted-foreground">
                      {color}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {brand.visual_style && (
            <section className="rounded-xl border border-border p-6 space-y-2">
              <h3 className="font-semibold">Estilo visual</h3>
              <p className="text-muted-foreground">{brand.visual_style}</p>
            </section>
          )}

          {(brand.website_url || brand.instagram_handle) && (
            <section className="rounded-xl border border-border p-6 space-y-3">
              <h3 className="font-semibold">Links</h3>
              <div className="space-y-2 text-sm">
                {brand.website_url && (
                  <p>
                    <span className="text-muted-foreground">Site: </span>
                    <a
                      href={brand.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {brand.website_url}
                    </a>
                  </p>
                )}
                {brand.instagram_handle && (
                  <p>
                    <span className="text-muted-foreground">Instagram: </span>
                    <span className="font-medium">
                      @{brand.instagram_handle.replace(/^@/, "")}
                    </span>
                  </p>
                )}
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="projetos" className="pt-6">
          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
              <p className="text-muted-foreground">
                Nenhum carrossel criado nesta marca ainda.
              </p>
              <Button asChild>
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
                  className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all"
                >
                  <div
                    className={`absolute inset-0 ${getProjectGradient(project.id)}`}
                  />
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
