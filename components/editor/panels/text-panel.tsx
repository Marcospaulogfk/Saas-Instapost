"use client"

import { useState } from "react"
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const fonts = [
  { value: "inter", label: "Inter" },
  { value: "druk", label: "Druk" },
  { value: "playfair", label: "Playfair" },
  { value: "montserrat", label: "Montserrat" },
  { value: "bebas", label: "Bebas Neue" },
]

const weights = [
  { value: "regular", label: "Regular" },
  { value: "medium", label: "Medium" },
  { value: "bold", label: "Bold" },
]

const presetColors = [
  "#FFFFFF",
  "#000000",
  "#00D4FF",
  "#EF4444",
  "#F59E0B",
  "#22C55E",
  "#8B5CF6",
  "#EC4899",
]

export function TextPanel() {
  const [text, setText] = useState("10 dicas de churrasco que voce precisa saber")
  const [font, setFont] = useState("inter")
  const [weight, setWeight] = useState("bold")
  const [fontSize, setFontSize] = useState([48])
  const [lineHeight, setLineHeight] = useState([1.2])
  const [alignment, setAlignment] = useState("center")
  const [selectedColor, setSelectedColor] = useState("#FFFFFF")
  const [posX, setPosX] = useState("270")
  const [posY, setPosY] = useState("337")
  const [width, setWidth] = useState("480")
  const [height, setHeight] = useState("auto")
  const [rotation, setRotation] = useState([0])

  return (
    <div className="p-4 space-y-6">
      {/* Element label */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Titulo principal</p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[80px] bg-surface resize-none"
        />
      </div>

      {/* Typography section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Tipografia</h3>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Fonte</Label>
          <Select value={font} onValueChange={setFont}>
            <SelectTrigger className="bg-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Peso</Label>
          <div className="flex gap-1">
            {weights.map((w) => (
              <Button
                key={w.value}
                variant={weight === w.value ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setWeight(w.value)}
              >
                {w.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Tamanho</Label>
            <span className="text-xs tabular-nums">{fontSize[0]}px</span>
          </div>
          <Slider
            value={fontSize}
            onValueChange={setFontSize}
            min={12}
            max={120}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Altura da linha</Label>
            <span className="text-xs tabular-nums">{lineHeight[0].toFixed(1)}</span>
          </div>
          <Slider
            value={lineHeight}
            onValueChange={setLineHeight}
            min={0.8}
            max={2}
            step={0.1}
          />
        </div>
      </div>

      {/* Color section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Cor</h3>
        <div
          className="w-full h-12 rounded-lg border border-border"
          style={{ backgroundColor: selectedColor }}
        />
        <div className="grid grid-cols-8 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-full aspect-square rounded-lg border-2 transition-all ${
                selectedColor === color ? "border-primary scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full">
          Cor personalizada
        </Button>
      </div>

      {/* Alignment section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Alinhamento</h3>
        <div className="flex gap-1">
          {[
            { value: "left", icon: AlignLeft },
            { value: "center", icon: AlignCenter },
            { value: "right", icon: AlignRight },
            { value: "justify", icon: AlignJustify },
          ].map((a) => (
            <Button
              key={a.value}
              variant={alignment === a.value ? "secondary" : "ghost"}
              size="icon"
              className="flex-1"
              onClick={() => setAlignment(a.value)}
            >
              <a.icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Position section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Posicao</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">X</Label>
            <Input
              value={posX}
              onChange={(e) => setPosX(e.target.value)}
              className="bg-surface tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Y</Label>
            <Input
              value={posY}
              onChange={(e) => setPosY(e.target.value)}
              className="bg-surface tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Largura</Label>
            <Input
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="bg-surface tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Altura</Label>
            <Input
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="bg-surface tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Rotacao</Label>
            <span className="text-xs tabular-nums">{rotation[0]}deg</span>
          </div>
          <Slider
            value={rotation}
            onValueChange={setRotation}
            min={-180}
            max={180}
            step={1}
          />
        </div>
      </div>
    </div>
  )
}
