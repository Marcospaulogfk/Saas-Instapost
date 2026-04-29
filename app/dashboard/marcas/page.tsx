import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listBrands } from "@/lib/data/queries"
import { getBrandGradient } from "@/lib/brand-colors"

export default async function MarcasPage() {
  const brands = await listBrands()

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Marcas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a identidade visual de cada uma das suas marcas.
          </p>
        </div>
        {brands.length > 0 && (
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/onboarding">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar marca
            </Link>
          </Button>
        )}
      </div>

      {brands.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-4">
          <div className="rounded-full bg-primary/10 w-16 h-16 mx-auto flex items-center justify-center">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Sua primeira marca</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Cadastre sua marca pra que a InstaPost gere carrosseis com a
              identidade visual, tom de voz e foco no seu publico-alvo.
            </p>
          </div>
          <Button asChild>
            <Link href="/onboarding">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar marca
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/dashboard/marcas/${brand.id}`}
              className="rounded-xl border border-border bg-card hover:border-primary/30 transition-all hover:-translate-y-1 overflow-hidden"
            >
              <div
                className={`h-32 ${getBrandGradient(brand.id)} flex items-center justify-center`}
              >
                <span className="text-6xl font-bold text-white">
                  {brand.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-semibold text-lg">{brand.name}</h3>
                {brand.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {brand.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground pt-1">
                  {brand.project_count}{" "}
                  {brand.project_count === 1
                    ? "carrossel criado"
                    : "carrosseis criados"}
                </p>
              </div>
            </Link>
          ))}

          <Link
            href="/onboarding"
            className="rounded-xl border border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary min-h-[220px]"
          >
            <Plus className="w-10 h-10" />
            <span className="text-sm font-medium">Nova marca</span>
          </Link>
        </div>
      )}
    </div>
  )
}
