"use client"

import { useEffect, useRef, useState } from "react"
import { toPng } from "html-to-image"
import { ChevronLeft, ChevronRight, Download, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  SlidePreview,
  type PreviewSlide,
  type EditorialStyle,
} from "@/components/carousel/slide-preview"

interface CarouselLightboxProps {
  slides: PreviewSlide[]
  startIndex: number
  template: "editorial" | "cinematic" | "hybrid"
  brandColors: string[]
  fontClass: string
  editorialStyle?: EditorialStyle
  handle?: string
  onClose: () => void
}

export function CarouselLightbox({
  slides,
  startIndex,
  template,
  brandColors,
  fontClass,
  editorialStyle,
  handle,
  onClose,
}: CarouselLightboxProps) {
  const [index, setIndex] = useState(startIndex)
  const [downloading, setDownloading] = useState(false)
  const slideRef = useRef<HTMLDivElement>(null)

  const next = () => setIndex((i) => (i + 1) % slides.length)
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowRight") next()
      else if (e.key === "ArrowLeft") prev()
    }
    window.addEventListener("keydown", handler)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handler)
      document.body.style.overflow = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const current = slides[index]

  async function download() {
    if (!slideRef.current || downloading) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(slideRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: "#000000",
        skipFonts: false,
      })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `slide-${index + 1}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      console.error("download failed:", err)
      if (current?.image.url) {
        window.open(current.image.url, "_blank", "noreferrer")
      }
    } finally {
      setDownloading(false)
    }
  }

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="absolute top-4 left-0 right-0 flex items-center justify-between px-6 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/80 text-sm tabular-nums">
          {index + 1} / {slides.length}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={download}
            disabled={!current.image.url || downloading}
            className="text-white hover:bg-white/10 hover:text-white"
            title="Baixar slide"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10 hover:text-white"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          prev()
        }}
        disabled={slides.length <= 1}
        className="absolute left-4 z-10 text-white hover:bg-white/10 hover:text-white h-12 w-12"
        title="Anterior (←)"
      >
        <ChevronLeft className="w-8 h-8" />
      </Button>

      <div
        className="w-full max-w-[440px] px-4 py-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={slideRef}>
          <SlidePreview
            slide={current}
            totalSlides={slides.length}
            template={template}
            brandColors={brandColors}
            editorialStyle={editorialStyle}
            handle={handle}
            fontClass={fontClass}
            showDevBadges={false}
          />
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          next()
        }}
        disabled={slides.length <= 1}
        className="absolute right-4 z-10 text-white hover:bg-white/10 hover:text-white h-12 w-12"
        title="Proximo (→)"
      >
        <ChevronRight className="w-8 h-8" />
      </Button>
    </div>
  )
}
