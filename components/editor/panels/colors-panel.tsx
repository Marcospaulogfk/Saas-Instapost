"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const brandColors = [
  "#F97316",
  "#DC2626",
  "#FBBF24",
  "#000000",
  "#FFFFFF",
]

const backgroundOptions = [
  { value: "#000000", label: "Preto" },
  { value: "#FFFFFF", label: "Branco" },
  { value: "#00D4FF", label: "Cyan" },
  { value: "custom", label: "Personalizado" },
]

export function ColorsPanel() {
  const [selectedBrandColor, setSelectedBrandColor] = useState("#F97316")
  const [backgroundColor, setBackgroundColor] = useState("#000000")
  const [highlightColor, setHighlightColor] = useState("#00D4FF")

  return (
    <div className="p-4 space-y-6">
      {/* Brand colors */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Cores da marca</h3>
        <p className="text-xs text-muted-foreground">Extraidas automaticamente do seu brand kit</p>
        <div className="flex gap-2">
          {brandColors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedBrandColor(color)}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                selectedBrandColor === color
                  ? "border-primary scale-110"
                  : "border-border hover:border-primary/50"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Background color */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Cor de fundo do slide</h3>
        <div
          className="w-full h-16 rounded-lg border border-border"
          style={{ backgroundColor }}
        />
        <div className="grid grid-cols-4 gap-2">
          {backgroundOptions.map((option) => (
            <Button
              key={option.value}
              variant={backgroundColor === option.value ? "secondary" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => option.value !== "custom" && setBackgroundColor(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Highlight color */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Cor da palavra destacada</h3>
        <p className="text-xs text-muted-foreground">
          Usada para destacar palavras-chave no texto
        </p>
        <div className="flex gap-2">
          {brandColors.map((color) => (
            <button
              key={color}
              onClick={() => setHighlightColor(color)}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                highlightColor === color
                  ? "border-primary scale-110"
                  : "border-border hover:border-primary/50"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            onClick={() => setHighlightColor("#00D4FF")}
            className={`w-10 h-10 rounded-lg border-2 transition-all ${
              highlightColor === "#00D4FF"
                ? "border-primary scale-110"
                : "border-border hover:border-primary/50"
            }`}
            style={{ backgroundColor: "#00D4FF" }}
          />
        </div>
      </div>

      {/* Color picker button */}
      <Button variant="outline" className="w-full">
        Abrir seletor de cores
      </Button>
    </div>
  )
}
