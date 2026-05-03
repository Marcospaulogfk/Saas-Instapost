'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Save, Loader2, Check } from 'lucide-react'
import type { EditorialCarousel } from '@/components/templates/editorial/editorial.types'
import { exportCarouselAsZip } from '@/lib/editorial/exporter'
import { saveCarouselAction, updateCarouselAction } from '@/app/actions/editorial'

interface ExportMenuProps {
  carousel: EditorialCarousel
  /** Se vier preenchido, atualiza o carrossel existente em vez de criar novo. */
  existingId?: string | null
  onSaved?: (id: string) => void
}

export function ExportMenu({ carousel, existingId, onSaved }: ExportMenuProps) {
  const [exporting, setExporting] = useState<'png' | 'jpg' | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [savedJustNow, setSavedJustNow] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, startSaveTransition] = useTransition()

  async function handleExportZip(format: 'png' | 'jpg') {
    setExporting(format)
    setExportError(null)
    try {
      await exportCarouselAsZip(carousel, format)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Erro ao exportar.')
    } finally {
      setExporting(null)
    }
  }

  function handleSave() {
    setSaveError(null)
    setSavedJustNow(false)
    startSaveTransition(async () => {
      const result = existingId
        ? await updateCarouselAction(existingId, carousel)
        : await saveCarouselAction(carousel)
      if (!result.ok) {
        setSaveError(result.error)
        return
      }
      setSavedJustNow(true)
      onSaved?.(result.id)
      setTimeout(() => setSavedJustNow(false), 2500)
    })
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={() => handleExportZip('png')}
        disabled={exporting !== null}
        className="w-full"
      >
        {exporting === 'png' ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Baixar ZIP (PNG)
      </Button>

      <Button
        onClick={() => handleExportZip('jpg')}
        disabled={exporting !== null}
        variant="outline"
        className="w-full border-border-medium"
      >
        {exporting === 'jpg' ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Baixar ZIP (JPG)
      </Button>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        variant="ghost"
        className="w-full"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : savedJustNow ? (
          <Check className="w-4 h-4 mr-2 text-lime" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {savedJustNow ? 'Salvo' : existingId ? 'Atualizar carrossel' : 'Salvar carrossel'}
      </Button>

      {(exportError || saveError) && (
        <div className="text-xs text-danger pt-1">{exportError || saveError}</div>
      )}
    </div>
  )
}
