import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { EditorialCarousel } from '@/components/templates/editorial/editorial.types'

/**
 * Captura canvases marcados com `data-slide-fullsize` e gera ZIP.
 * Os Stages em fullsize devem estar montados no DOM (ainda que hidden) com esse atributo.
 */
export async function exportCarouselAsZip(
  carousel: EditorialCarousel,
  format: 'png' | 'jpg' = 'png',
) {
  const slideContainers = document.querySelectorAll<HTMLElement>('[data-slide-fullsize]')

  if (slideContainers.length === 0) {
    throw new Error(
      'Nenhum slide fullsize encontrado. Certifique-se que os slides estão renderizados.',
    )
  }

  const zip = new JSZip()
  const mime = format === 'png' ? 'image/png' : 'image/jpeg'

  let added = 0
  for (let i = 0; i < slideContainers.length; i++) {
    // Cada Konva Stage cria múltiplos canvas por layer; pegamos o canvas que é
    // exatamente do tamanho 1080x1350 (o stage inteiro), ou compomos pelo seletor.
    const canvas = slideContainers[i].querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) continue

    const dataURL = canvas.toDataURL(mime, 0.95)
    const blob = dataURLtoBlob(dataURL)
    zip.file(`slide-${String(i + 1).padStart(2, '0')}.${format}`, blob)
    added++
  }

  if (added === 0) throw new Error('Nenhum canvas encontrado dentro dos containers.')

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const filename = `${sanitizeFilename(carousel.topic)}.zip`
  saveAs(zipBlob, filename)
}

/**
 * Exporta um único canvas (ex.: o que está visível) como imagem.
 */
export async function exportCanvasAsImage(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpg',
  filename: string,
) {
  const mime = format === 'png' ? 'image/png' : 'image/jpeg'
  const dataURL = canvas.toDataURL(mime, 0.95)
  const blob = dataURLtoBlob(dataURL)
  saveAs(blob, filename)
}

function dataURLtoBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(data)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
  return new Blob([array], { type: mime })
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'carrossel-editorial'
}
