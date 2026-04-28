"use client"

import { useState } from "react"
import { Sparkles, Upload } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export function ImagePanel() {
  const [opacity, setOpacity] = useState([100])
  const [borderRadius, setBorderRadius] = useState([0])
  const [brightness, setBrightness] = useState([100])
  const [contrast, setContrast] = useState([100])
  const [saturation, setSaturation] = useState([100])
  const [applyGradient, setApplyGradient] = useState(false)

  return (
    <div className="p-4 space-y-6">
      {/* Current image preview */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">Imagem atual</Label>
        <div className="aspect-video rounded-lg bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center">
          <span className="text-sm text-white/60">Preview</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Sparkles className="w-4 h-4 mr-2" />
          Regenerar imagem
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Custa 1 imagem do plano
        </p>

        <Button variant="outline" className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          Trocar imagem
        </Button>
      </div>

      {/* Opacity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Opacidade</Label>
          <span className="text-xs tabular-nums">{opacity[0]}%</span>
        </div>
        <Slider
          value={opacity}
          onValueChange={setOpacity}
          min={0}
          max={100}
          step={1}
        />
      </div>

      {/* Border radius */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Borda suave</Label>
          <span className="text-xs tabular-nums">{borderRadius[0]}px</span>
        </div>
        <Slider
          value={borderRadius}
          onValueChange={setBorderRadius}
          min={0}
          max={50}
          step={1}
        />
      </div>

      {/* Gradient toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm">Aplicar gradient nas bordas</Label>
        <Switch checked={applyGradient} onCheckedChange={setApplyGradient} />
      </div>

      {/* Filters section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Filtros</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Brilho</Label>
            <span className="text-xs tabular-nums">{brightness[0]}%</span>
          </div>
          <Slider
            value={brightness}
            onValueChange={setBrightness}
            min={0}
            max={200}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Contraste</Label>
            <span className="text-xs tabular-nums">{contrast[0]}%</span>
          </div>
          <Slider
            value={contrast}
            onValueChange={setContrast}
            min={0}
            max={200}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Saturacao</Label>
            <span className="text-xs tabular-nums">{saturation[0]}%</span>
          </div>
          <Slider
            value={saturation}
            onValueChange={setSaturation}
            min={0}
            max={200}
            step={1}
          />
        </div>
      </div>
    </div>
  )
}
