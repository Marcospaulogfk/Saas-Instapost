import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { listCarouselsAction } from '@/app/actions/editorial'
import { EditorialListClient } from './list-client'

export default async function EditorialListPage() {
  const carousels = await listCarouselsAction()

  return (
    <div className="relative p-6 md:p-8 space-y-6 max-w-6xl">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-h1 font-display font-bold text-text-primary">
            Carrosséis <span className="gradient-text">Editoriais</span>
          </h1>
          <p className="text-text-secondary mt-1">
            Seus carrosséis salvos com o template Editorial.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/criar/editorial">
            <Plus className="w-4 h-4 mr-2" />
            Novo carrossel
          </Link>
        </Button>
      </header>

      {carousels.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-10 h-10 mx-auto mb-4 text-text-muted" />
          <p className="text-text-secondary mb-4">
            Você ainda não salvou nenhum carrossel editorial.
          </p>
          <Button asChild>
            <Link href="/dashboard/criar/editorial">
              <Plus className="w-4 h-4 mr-2" />
              Criar meu primeiro
            </Link>
          </Button>
        </Card>
      ) : (
        <EditorialListClient carousels={carousels} />
      )}
    </div>
  )
}
