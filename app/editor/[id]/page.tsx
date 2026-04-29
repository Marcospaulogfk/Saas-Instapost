"use client"

import { useState } from "react"
import { EditorTopBar } from "@/components/editor/top-bar"
import { SlidesPanel } from "@/components/editor/slides-panel"
import { EditorCanvas } from "@/components/editor/canvas"
import { PropertiesPanel } from "@/components/editor/properties-panel"

export default function EditorByIdPage() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [activeTab, setActiveTab] = useState<"texto" | "imagem" | "cores" | "templates">("texto")

  return (
    <div className="flex flex-col h-screen bg-background">
      <EditorTopBar />
      <div className="flex flex-1 overflow-hidden">
        <SlidesPanel activeSlide={activeSlide} onSlideSelect={setActiveSlide} />
        <EditorCanvas />
        <PropertiesPanel activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  )
}
