'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  deleteCarouselAction,
  type EditorialListItem,
} from '@/app/actions/editorial'

interface Props {
  carousels: EditorialListItem[]
}

export function EditorialListClient({ carousels }: Props) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Excluir esse carrossel? Essa ação não pode ser desfeita.')) return
    setPendingId(id)
    startTransition(async () => {
      const result = await deleteCarouselAction(id)
      setPendingId(null)
      if (!result.ok) {
        alert(`Erro ao excluir: ${result.error}`)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {carousels.map((carousel) => (
        <Card key={carousel.id} className="p-6 group">
          <h3 className="font-display font-semibold text-text-primary mb-2 line-clamp-2">
            {carousel.topic}
          </h3>
          <p className="text-xs text-text-muted mb-4">
            {carousel.brand_name || '—'} ·{' '}
            {new Date(carousel.created_at).toLocaleDateString('pt-BR')}
          </p>

          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1 border-border-medium">
              <Link href={`/dashboard/criar/editorial?id=${carousel.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Abrir
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(carousel.id)}
              disabled={pendingId === carousel.id}
              aria-label="Excluir"
              className="text-text-muted hover:text-danger"
            >
              {pendingId === carousel.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
