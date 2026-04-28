"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, Check, Loader2, AlertCircle, Pencil, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

type SaveStatus = "saved" | "saving" | "error"

export function EditorTopBar() {
  const [projectTitle, setProjectTitle] = useState("Carrossel sobre churrasco")
  const [isEditing, setIsEditing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved")

  const handleTitleSubmit = () => {
    setIsEditing(false)
  }

  return (
    <header className="h-14 border-b border-border bg-background px-4 flex items-center justify-between">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="w-px h-6 bg-border" />

        {/* Project title */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
              className="h-8 w-64 bg-surface"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="group flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              {projectTitle}
              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
      </div>

      {/* Center section - save status */}
      <div className="flex items-center gap-2 text-sm">
        {saveStatus === "saved" && (
          <>
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">Salvo automaticamente</span>
          </>
        )}
        {saveStatus === "saving" && (
          <>
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-primary">Salvando...</span>
          </>
        )}
        {saveStatus === "error" && (
          <>
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-destructive">Erro ao salvar</span>
          </>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-surface text-muted-foreground">
          47 imagens
        </Badge>

        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4 mr-2" />
          Visualizar
        </Button>

        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>
    </header>
  )
}
