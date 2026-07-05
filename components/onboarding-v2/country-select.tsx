"use client"

import { useState, type CSSProperties } from "react"
import { ChevronDown, Check } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const COUNTRIES = [
  { code: "BR", name: "Brasil" },
  { code: "PT", name: "Portugal" },
  { code: "US", name: "Estados Unidos" },
  { code: "ES", name: "Espanha" },
  { code: "MX", name: "México" },
  { code: "AR", name: "Argentina" },
  { code: "CO", name: "Colômbia" },
  { code: "CL", name: "Chile" },
  { code: "UK", name: "Reino Unido" },
  { code: "DE", name: "Alemanha" },
  { code: "FR", name: "França" },
  { code: "IT", name: "Itália" },
]

export function CountrySelect({
  code,
  name,
  onChange,
}: {
  code: string
  name: string
  onChange: (code: string, name: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="onb-input flex items-center justify-between"
          style={{ cursor: "pointer" }}
        >
          <span className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center rounded"
              style={{
                width: 28,
                height: 18,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.04em",
                background: "var(--onb-bg-elevated)",
                color: "var(--onb-text-primary)",
                border: "0.5px solid var(--onb-border-default)",
              }}
            >
              {code}
            </span>
            <span style={{ color: "var(--onb-text-primary)" }}>{name}</span>
          </span>
          <ChevronDown
            size={14}
            style={{ color: "var(--onb-text-tertiary)" }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[--radix-popover-trigger-width] border-0 p-1"
        style={
          {
            // O conteúdo do popover renderiza em portal FORA da árvore
            // .onb-root, então as vars --onb-* não existem nesse contexto
            // (era isso que deixava o dropdown transparente). Usa hex sólido
            // e redefine as vars usadas pelos itens da lista.
            background: "#141414",
            border: "0.5px solid #2a2a2a",
            zIndex: 100,
            "--onb-bg-elevated": "#181818",
            "--onb-border-default": "#2a2a2a",
            "--onb-text-primary": "#ffffff",
            "--onb-primary-dim": "rgba(115, 32, 230, 0.15)",
            "--onb-primary-light": "#9C5FF1",
          } as CSSProperties
        }
      >
        <div className="max-h-[280px] overflow-y-auto">
          {COUNTRIES.map((c) => {
            const selected = c.code === code
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange(c.code, c.name)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between rounded px-2 py-2 text-left transition-colors"
                style={{
                  background: selected
                    ? "var(--onb-primary-dim)"
                    : "transparent",
                  color: "var(--onb-text-primary)",
                  fontSize: 13,
                }}
                onMouseEnter={(e) => {
                  if (!selected)
                    e.currentTarget.style.background =
                      "var(--onb-bg-elevated)"
                }}
                onMouseLeave={(e) => {
                  if (!selected)
                    e.currentTarget.style.background = "transparent"
                }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center rounded"
                    style={{
                      width: 26,
                      height: 16,
                      fontSize: 9,
                      fontWeight: 600,
                      background: "var(--onb-bg-elevated)",
                      color: "var(--onb-text-primary)",
                      border: "0.5px solid var(--onb-border-default)",
                    }}
                  >
                    {c.code}
                  </span>
                  {c.name}
                </span>
                {selected && (
                  <Check size={14} color="var(--onb-primary-light)" />
                )}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
