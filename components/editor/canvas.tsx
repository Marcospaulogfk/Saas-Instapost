"use client"

import { useState } from "react"
import { Minus, Plus, RotateCcw, Grid3X3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"

export function EditorCanvas() {
  const [zoom, setZoom] = useState(75)
  const [showGrid, setShowGrid] = useState(true)

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 25))
  const handleZoomReset = () => setZoom(75)

  return (
    <div className="flex-1 relative bg-[#1A1A1A] overflow-hidden">
      {/* Grid pattern background */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, #333 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />
      )}

      {/* Canvas info */}
      <div className="absolute top-4 left-4 text-xs text-muted-foreground bg-black/50 px-2 py-1 rounded">
        1080 x 1350 px (Instagram retrato)
      </div>

      {/* Main canvas */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="bg-surface border border-white/10 shadow-2xl flex items-center justify-center"
          style={{
            width: `${540 * (zoom / 100)}px`,
            height: `${675 * (zoom / 100)}px`,
            transition: "width 0.2s, height 0.2s",
          }}
        >
          <div className="text-center text-muted-foreground p-8">
            <div className="text-4xl mb-4">[Konva.js Canvas]</div>
            <p className="text-sm">O canvas interativo sera renderizado aqui</p>
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-surface/80 backdrop-blur-sm border border-border rounded-full px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleZoomOut}
        >
          <Minus className="w-4 h-4" />
        </Button>

        <button
          onClick={handleZoomReset}
          className="px-3 py-1 text-sm font-medium tabular-nums hover:text-primary transition-colors"
        >
          {zoom}%
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleZoomIn}
        >
          <Plus className="w-4 h-4" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleZoomReset}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <Toggle
          pressed={showGrid}
          onPressedChange={setShowGrid}
          size="sm"
          className="h-8 w-8"
        >
          <Grid3X3 className="w-4 h-4" />
        </Toggle>
      </div>
    </div>
  )
}
