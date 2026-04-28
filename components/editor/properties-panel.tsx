"use client"

import { Type, ImageIcon, Palette, Layout, Sparkles } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextPanel } from "./panels/text-panel"
import { ImagePanel } from "./panels/image-panel"
import { ColorsPanel } from "./panels/colors-panel"
import { TemplatesPanel } from "./panels/templates-panel"

interface PropertiesPanelProps {
  activeTab: "texto" | "imagem" | "cores" | "templates"
  onTabChange: (tab: "texto" | "imagem" | "cores" | "templates") => void
}

export function PropertiesPanel({ activeTab, onTabChange }: PropertiesPanelProps) {
  return (
    <aside className="w-[320px] flex-shrink-0 border-l border-border bg-background flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as typeof activeTab)}
        className="flex flex-col h-full"
      >
        <TabsList className="w-full justify-start px-2 pt-2 bg-transparent border-b border-border rounded-none h-auto">
          <TabsTrigger
            value="texto"
            className="flex items-center gap-2 data-[state=active]:bg-muted rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <Type className="w-4 h-4" />
            Texto
          </TabsTrigger>
          <TabsTrigger
            value="imagem"
            className="flex items-center gap-2 data-[state=active]:bg-muted rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <ImageIcon className="w-4 h-4" />
            Imagem
          </TabsTrigger>
          <TabsTrigger
            value="cores"
            className="flex items-center gap-2 data-[state=active]:bg-muted rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <Palette className="w-4 h-4" />
            Cores
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="flex items-center gap-2 data-[state=active]:bg-muted rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <Layout className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="texto" className="m-0 p-0">
            <TextPanel />
          </TabsContent>
          <TabsContent value="imagem" className="m-0 p-0">
            <ImagePanel />
          </TabsContent>
          <TabsContent value="cores" className="m-0 p-0">
            <ColorsPanel />
          </TabsContent>
          <TabsContent value="templates" className="m-0 p-0">
            <TemplatesPanel />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  )
}
