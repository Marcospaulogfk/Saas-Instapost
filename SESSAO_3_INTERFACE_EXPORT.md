# 🚀 SESSÃO 3 — INTERFACE + EXPORT
## Template Editorial SyncPost — Parte 3 de 3

> **Pré-requisito:** Sessões 1 e 2 completas
> **Tempo estimado:** 6-7 horas de Claude Code
> **Entregável:** Interface de criação + sistema de export funcional

---

## ⚠️ ANTES DE COMEÇAR

Cole no Claude Code:

```
Sessões 1 e 2 do Template Editorial estão completas.

Verifica:
1. git log na branch feature/template-editorial
2. Confirma que /test-editorial-ai gera carrosséis completos
3. Lista os arquivos criados nas sessões anteriores
4. Aguarda meu próximo prompt
```

Depois cole o prompt abaixo.

---

## 📋 CONTEXTO

Você (Claude Code) vai implementar a **TERCEIRA E ÚLTIMA PARTE** do Template Editorial:
- ✅ Página de criação `/dashboard/criar/editorial`
- ✅ Editor lateral (texto, variantes, cores)
- ✅ Preview em scroll horizontal
- ✅ Sistema de export (PNG/JPG/ZIP)
- ✅ Persistência de carrosséis no Supabase
- ✅ Lista de carrosséis salvos

Esta sessão completa o Template Editorial e o deixa **pronto pra usuário final usar**.

---

## 🎯 ESCOPO DESTA SESSÃO

### Fase 5 — Interface de Criação (4-5h)
- Página principal `/dashboard/criar/editorial`
- Form de input (tema, marca, tom, público)
- Loading state durante geração IA
- Preview de slides em scroll horizontal
- Editor lateral com tabs (texto, visual, cores)
- Troca de variantes em layouts flexíveis
- Regenerar imagens individualmente

### Fase 6 — Export e Persistência (2h)
- Export PNG individual por slide
- Export JPG individual por slide
- Export ZIP com todos os slides
- Salvar carrossel no Supabase
- Listar carrosséis salvos em `/dashboard/projetos`

---

## 📦 BIBLIOTECAS ADICIONAIS

```bash
npm install jszip
npm install file-saver
npm install @types/file-saver --save-dev
```

---

## 🖥️ PÁGINA PRINCIPAL

### Arquivo: `app/dashboard/criar/editorial/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Download, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditorialCarousel } from '@/components/templates/editorial/editorial.types';
import { GenerationForm } from './components/GenerationForm';
import { CarouselPreview } from './components/CarouselPreview';
import { EditorPanel } from './components/EditorPanel';
import { ExportMenu } from './components/ExportMenu';

export default function CriarEditorialPage() {
  const [step, setStep] = useState<'form' | 'generating' | 'editing'>('form');
  const [carousel, setCarousel] = useState<EditorialCarousel | null>(null);
  const [progress, setProgress] = useState({ step: '', current: 0, total: 100 });
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(0);
  
  const handleGenerate = async (formData: any) => {
    setStep('generating');
    setProgress({ step: 'Iniciando...', current: 0, total: 100 });
    
    try {
      // SSE pra progresso em tempo real
      const eventSource = new EventSource(`/api/editorial/generate-stream?${new URLSearchParams(formData).toString()}`);
      
      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data);
        setProgress(data);
      });
      
      eventSource.addEventListener('complete', (event) => {
        const data = JSON.parse(event.data);
        setCarousel(data.carousel);
        setStep('editing');
        eventSource.close();
      });
      
      eventSource.addEventListener('error', (event) => {
        console.error('Erro na geração:', event);
        setStep('form');
        eventSource.close();
      });
    } catch (err) {
      console.error(err);
      setStep('form');
    }
  };
  
  const handleSlideUpdate = (slideIdx: number, updates: any) => {
    if (!carousel) return;
    
    const newSlides = [...carousel.slides];
    newSlides[slideIdx] = { ...newSlides[slideIdx], ...updates };
    
    setCarousel({ ...carousel, slides: newSlides });
  };
  
  return (
    <div className="min-h-screen bg-background-primary">
      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container mx-auto py-12 max-w-3xl"
          >
            <h1 className="text-h1 font-display font-bold mb-2">
              Criar carrossel editorial
            </h1>
            <p className="text-text-secondary mb-8">
              Em 3 minutos, do conceito ao carrossel pronto pra postar.
            </p>
            <GenerationForm onGenerate={handleGenerate} />
          </motion.div>
        )}
        
        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen flex items-center justify-center"
          >
            <div className="text-center max-w-md">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-purple shadow-glow-lg flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              
              <h2 className="text-h2 font-display font-semibold mb-3">
                Criando seu carrossel
              </h2>
              <p className="text-text-secondary mb-6">
                {progress.step}
              </p>
              
              {/* Progress bar */}
              <div className="w-full h-2 bg-background-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-purple"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.current}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-text-muted mt-2">{progress.current}%</p>
            </div>
          </motion.div>
        )}
        
        {step === 'editing' && carousel && (
          <motion.div
            key="editing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-screen"
          >
            {/* Preview area */}
            <div className="flex-1 overflow-hidden">
              <CarouselPreview
                carousel={carousel}
                selectedIdx={selectedSlideIdx}
                onSelectSlide={setSelectedSlideIdx}
              />
            </div>
            
            {/* Editor panel lateral */}
            <div className="w-96 border-l border-border-subtle bg-background-secondary overflow-y-auto">
              <EditorPanel
                slide={carousel.slides[selectedSlideIdx]}
                onUpdate={(updates) => handleSlideUpdate(selectedSlideIdx, updates)}
                onRegenerate={async () => {
                  // Regenera imagens do slide selecionado
                }}
              />
              
              <div className="p-4 border-t border-border-subtle">
                <ExportMenu carousel={carousel} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 📝 FORM DE GERAÇÃO

### Arquivo: `app/dashboard/criar/editorial/components/GenerationForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';

interface GenerationFormProps {
  onGenerate: (data: any) => void;
}

const TONE_OPTIONS = [
  { id: 'profissional', label: 'Profissional' },
  { id: 'casual', label: 'Casual' },
  { id: 'direto', label: 'Direto' },
];

export function GenerationForm({ onGenerate }: GenerationFormProps) {
  const [topic, setTopic] = useState('');
  const [brandName, setBrandName] = useState('SYNCPOST');
  const [handle, setHandle] = useState('@SYNCPOST_');
  const [tone, setTone] = useState('direto');
  const [audience, setAudience] = useState('criadores de conteúdo');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (topic.length < 10) {
      alert('Digite um tema com pelo menos 10 caracteres');
      return;
    }
    
    onGenerate({
      topic,
      brandName,
      handle,
      tone,
      audience,
    });
  };
  
  return (
    <Card>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
            Tema do carrossel
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: 5 erros que iniciantes cometem ao criar carrosséis no Instagram. Foco em design e copywriting."
            className="w-full min-h-[120px] p-4 rounded-lg bg-background-tertiary border border-border-subtle text-text-primary placeholder:text-text-muted focus:border-purple-600/50 focus:shadow-glow-sm focus:outline-none resize-none"
            maxLength={500}
          />
          <p className="text-xs text-text-muted mt-2">
            {topic.length}/500 caracteres
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
              Nome da marca
            </label>
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value.toUpperCase())}
              placeholder="SYNCPOST"
            />
          </div>
          <div>
            <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
              Handle
            </label>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@SYNCPOST_"
            />
          </div>
        </div>
        
        <div>
          <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
            Tom de voz
          </label>
          <div className="flex gap-2">
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTone(opt.id)}
                className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  tone === opt.id
                    ? 'border-purple-600 bg-purple-600/10 text-purple-400'
                    : 'border-border-subtle bg-background-tertiary text-text-secondary hover:border-border-medium'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
            Público-alvo
          </label>
          <Input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Ex: criadores de conteúdo, profissionais liberais, empresas..."
          />
        </div>
        
        <Button type="submit" size="lg" className="w-full group">
          <Sparkles className="w-4 h-4 mr-2 transition-transform group-hover:rotate-12" />
          Gerar carrossel com IA
        </Button>
      </form>
    </Card>
  );
}
```

---

## 🎬 PREVIEW DOS SLIDES

### Arquivo: `app/dashboard/criar/editorial/components/CarouselPreview.tsx`

```typescript
'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { EditorialCarousel } from '@/components/templates/editorial/editorial.types';
import { Button } from '@/components/ui/button';

// Lazy loading dos layouts
const layoutComponents: Record<string, any> = {
  capa: dynamic(() => import('@/components/templates/editorial/layouts/01-CapaLayout').then(m => m.CapaLayout), { ssr: false }),
  problema: dynamic(() => import('@/components/templates/editorial/layouts/02-ProblemaLayout').then(m => m.ProblemaLayout), { ssr: false }),
  demo: dynamic(() => import('@/components/templates/editorial/layouts/03-DemoLayout').then(m => m.DemoLayout), { ssr: false }),
  novidade: dynamic(() => import('@/components/templates/editorial/layouts/04-NovidadeLayout').then(m => m.NovidadeLayout), { ssr: false }),
  prova: dynamic(() => import('@/components/templates/editorial/layouts/05-ProvaLayout').then(m => m.ProvaLayout), { ssr: false }),
  'texto-foto': dynamic(() => import('@/components/templates/editorial/layouts/06-TextoFotoLayout').then(m => m.TextoFotoLayout), { ssr: false }),
  sepia: dynamic(() => import('@/components/templates/editorial/layouts/07-SepiaLayout').then(m => m.SepiaLayout), { ssr: false }),
  serif: dynamic(() => import('@/components/templates/editorial/layouts/08-SerifLayout').then(m => m.SerifLayout), { ssr: false }),
  cta: dynamic(() => import('@/components/templates/editorial/layouts/09-CtaLayout').then(m => m.CtaLayout), { ssr: false }),
};

interface CarouselPreviewProps {
  carousel: EditorialCarousel;
  selectedIdx: number;
  onSelectSlide: (idx: number) => void;
}

export function CarouselPreview({ carousel, selectedIdx, onSelectSlide }: CarouselPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const handlePrev = () => {
    if (selectedIdx > 0) onSelectSlide(selectedIdx - 1);
  };
  
  const handleNext = () => {
    if (selectedIdx < carousel.slides.length - 1) onSelectSlide(selectedIdx + 1);
  };
  
  return (
    <div className="h-full flex flex-col bg-background-tertiary">
      {/* Header com info */}
      <div className="p-4 border-b border-border-subtle flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">{carousel.topic}</h2>
          <p className="text-sm text-text-secondary">
            {carousel.slides.length} slides • Editorial Template
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            disabled={selectedIdx === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm text-text-secondary px-2">
            {selectedIdx + 1} / {carousel.slides.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={selectedIdx === carousel.slides.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Slide atual */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <motion.div
          key={selectedIdx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {(() => {
            const slide = carousel.slides[selectedIdx];
            const Layout = layoutComponents[slide.layoutType];
            if (!Layout) return null;
            return <Layout slide={slide} scale={0.5} />;
          })()}
        </motion.div>
      </div>
      
      {/* Thumbnails dos slides */}
      <div className="p-4 border-t border-border-subtle">
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2">
          {carousel.slides.map((slide, idx) => {
            const Layout = layoutComponents[slide.layoutType];
            if (!Layout) return null;
            
            return (
              <button
                key={idx}
                onClick={() => onSelectSlide(idx)}
                className={`flex-shrink-0 transition-all ${
                  idx === selectedIdx 
                    ? 'ring-2 ring-purple-600 ring-offset-2 ring-offset-background-tertiary' 
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{ width: 108, height: 135 }}
              >
                <Layout slide={slide} scale={0.1} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

---

## ✏️ PAINEL DE EDIÇÃO LATERAL

### Arquivo: `app/dashboard/criar/editorial/components/EditorPanel.tsx`

```typescript
'use client';

import { useState } from 'react';
import { EditorialSlide } from '@/components/templates/editorial/editorial.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Type, Image as ImageIcon, Palette, RefreshCw } from 'lucide-react';

interface EditorPanelProps {
  slide: EditorialSlide;
  onUpdate: (updates: Partial<EditorialSlide>) => void;
  onRegenerate: () => Promise<void>;
}

const TABS = [
  { id: 'text', label: 'Texto', icon: Type },
  { id: 'visual', label: 'Visual', icon: ImageIcon },
  { id: 'colors', label: 'Cores', icon: Palette },
];

const VARIANT_OPTIONS: Record<string, string[]> = {
  demo: ['single', 'comparison', 'process'],
  novidade: ['text-only', 'single-large', 'pair', 'grid-three'],
  prova: ['numeric', 'single-print', 'multiple-prints', 'logo-cloud'],
  'texto-foto': ['text-only', 'image-bottom', 'image-middle', 'image-bg'],
  cta: ['text-only', 'product-mockup', 'human-photo', 'composition'],
};

export function EditorPanel({ slide, onUpdate, onRegenerate }: EditorPanelProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [regenerating, setRegenerating] = useState(false);
  
  const isFlexible = !!VARIANT_OPTIONS[slide.layoutType];
  
  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setRegenerating(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <p className="text-tiny uppercase tracking-wider text-text-secondary mb-1">
          Editando slide {slide.pageNumber}
        </p>
        <p className="text-sm font-medium">
          Layout {slide.layoutType}
          {slide.variant && <span className="text-text-secondary"> · {slide.variant}</span>}
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-border-subtle">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'text-purple-400 border-b-2 border-purple-600'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* TAB: TEXTO */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            {slide.tag !== undefined && (
              <div>
                <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
                  Tag
                </label>
                <Input
                  value={slide.tag || ''}
                  onChange={(e) => onUpdate({ tag: e.target.value })}
                  placeholder="O PROBLEMA"
                />
              </div>
            )}
            
            <div>
              <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
                Título (uma linha por linha)
              </label>
              {slide.title.map((line, idx) => (
                <Input
                  key={idx}
                  value={line}
                  onChange={(e) => {
                    const newTitle = [...slide.title];
                    newTitle[idx] = e.target.value;
                    onUpdate({ title: newTitle });
                  }}
                  placeholder={`Linha ${idx + 1}`}
                  className="mb-2"
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ title: [...slide.title, ''] })}
                className="w-full"
              >
                + Adicionar linha
              </Button>
            </div>
            
            <div>
              <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
                Palavras destacadas (separadas por vírgula)
              </label>
              <Input
                value={slide.highlightWords.join(', ')}
                onChange={(e) => onUpdate({ 
                  highlightWords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                })}
                placeholder="MATAM, CARROSSEL"
              />
            </div>
            
            {slide.body !== undefined && (
              <div>
                <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
                  Body text
                </label>
                <textarea
                  value={slide.body || ''}
                  onChange={(e) => onUpdate({ body: e.target.value })}
                  className="w-full min-h-[100px] p-3 rounded-lg bg-background-tertiary border border-border-subtle text-text-primary text-sm resize-none focus:border-purple-600/50 focus:outline-none"
                />
              </div>
            )}
            
            {slide.subtitle !== undefined && (
              <div>
                <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
                  Subtítulo (capa)
                </label>
                <Input
                  value={slide.subtitle || ''}
                  onChange={(e) => onUpdate({ subtitle: e.target.value })}
                  placeholder="→ E como evitar todos eles"
                />
              </div>
            )}
            
            {slide.callout !== undefined && (
              <div>
                <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
                  Callout (caixa preta)
                </label>
                <Input
                  value={slide.callout || ''}
                  onChange={(e) => onUpdate({ callout: e.target.value })}
                  placeholder="Esse foi feito no SyncPost."
                />
              </div>
            )}
          </div>
        )}
        
        {/* TAB: VISUAL */}
        {activeTab === 'visual' && (
          <div className="space-y-4">
            {isFlexible && (
              <div>
                <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
                  Variante do layout
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VARIANT_OPTIONS[slide.layoutType].map((variant) => (
                    <button
                      key={variant}
                      onClick={() => onUpdate({ variant })}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        slide.variant === variant
                          ? 'border-purple-600 bg-purple-600/10 text-purple-400'
                          : 'border-border-subtle bg-background-tertiary text-text-secondary'
                      }`}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {slide.imagePrompts && slide.imagePrompts.length > 0 && (
              <div>
                <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
                  Prompts das imagens
                </label>
                {slide.imagePrompts.map((prompt, idx) => (
                  <textarea
                    key={idx}
                    value={prompt}
                    onChange={(e) => {
                      const newPrompts = [...(slide.imagePrompts || [])];
                      newPrompts[idx] = e.target.value;
                      onUpdate({ imagePrompts: newPrompts });
                    }}
                    className="w-full min-h-[60px] p-2 rounded bg-background-tertiary border border-border-subtle text-text-primary text-xs resize-none mb-2 focus:border-purple-600/50 focus:outline-none"
                  />
                ))}
                
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="w-full mt-2"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                  Regenerar imagens
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* TAB: CORES */}
        {activeTab === 'colors' && (
          <div className="space-y-4">
            <div>
              <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
                Cor de marca (highlight)
              </label>
              <input
                type="color"
                value={slide.brandInfo.brandColor || '#7C3AED'}
                onChange={(e) => onUpdate({ 
                  brandInfo: { ...slide.brandInfo, brandColor: e.target.value }
                })}
                className="w-full h-12 rounded cursor-pointer"
              />
              <Input
                value={slide.brandInfo.brandColor || '#7C3AED'}
                onChange={(e) => onUpdate({ 
                  brandInfo: { ...slide.brandInfo, brandColor: e.target.value }
                })}
                className="mt-2"
              />
            </div>
            
            <div>
              <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
                Background
              </label>
              <select
                value={slide.background || 'cream'}
                onChange={(e) => onUpdate({ background: e.target.value as any })}
                className="w-full p-3 rounded-lg bg-background-tertiary border border-border-subtle text-text-primary text-sm focus:border-purple-600/50 focus:outline-none"
              >
                <option value="dark">Escuro (preto)</option>
                <option value="cream">Bege (claro)</option>
                <option value="white">Branco</option>
                <option value="navy">Navy (serif)</option>
                <option value="sepia">Sépia</option>
                <option value="photo">Foto fullscreen</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 📤 SISTEMA DE EXPORT

### Arquivo: `app/dashboard/criar/editorial/components/ExportMenu.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Save, Loader2 } from 'lucide-react';
import { EditorialCarousel } from '@/components/templates/editorial/editorial.types';
import { exportSlideAsImage, exportCarouselAsZip } from '@/lib/editorial/exporter';
import { saveCarousel } from '@/lib/editorial/persistence';

interface ExportMenuProps {
  carousel: EditorialCarousel;
}

export function ExportMenu({ carousel }: ExportMenuProps) {
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const handleExportZip = async (format: 'png' | 'jpg') => {
    setExporting(true);
    try {
      await exportCarouselAsZip(carousel, format);
    } catch (err) {
      console.error('Erro no export:', err);
      alert('Erro ao exportar. Tenta de novo.');
    } finally {
      setExporting(false);
    }
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCarousel(carousel);
      alert('Carrossel salvo!');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-2">
      <Button
        onClick={() => handleExportZip('png')}
        disabled={exporting}
        className="w-full"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Baixar ZIP (PNG)
      </Button>
      
      <Button
        onClick={() => handleExportZip('jpg')}
        disabled={exporting}
        variant="outline"
        className="w-full"
      >
        <Download className="w-4 h-4 mr-2" />
        Baixar ZIP (JPG)
      </Button>
      
      <Button
        onClick={handleSave}
        disabled={saving}
        variant="ghost"
        className="w-full"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Salvar carrossel
      </Button>
    </div>
  );
}
```

### Arquivo: `lib/editorial/exporter.ts`

```typescript
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { EditorialCarousel } from '@/components/templates/editorial/editorial.types';

/**
 * Exporta um Konva Stage como imagem.
 * IMPORTANTE: o Stage deve estar montado no DOM (não é renderização headless).
 */
export function exportStageAsDataURL(
  stage: any,
  format: 'png' | 'jpg' = 'png'
): string {
  return stage.toDataURL({
    mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
    quality: 0.95,
    pixelRatio: 2, // Export em 2x pra alta qualidade
  });
}

/**
 * Converte data URL pra Blob.
 */
function dataURLtoBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  
  return new Blob([array], { type: mime });
}

/**
 * Exporta um único slide.
 */
export async function exportSlideAsImage(
  stage: any,
  format: 'png' | 'jpg',
  filename: string
) {
  const dataURL = exportStageAsDataURL(stage, format);
  const blob = dataURLtoBlob(dataURL);
  saveAs(blob, filename);
}

/**
 * Exporta carrossel inteiro como ZIP.
 * NOTA: Esta versão precisa que os Stages estejam todos renderizados no DOM.
 * Estratégia: criar uma rota oculta /export-render que renderiza todos os slides
 * e envia uma referência de cada um, ou usar canvas em background.
 */
export async function exportCarouselAsZip(
  carousel: EditorialCarousel,
  format: 'png' | 'jpg'
) {
  // Estratégia simplificada: navega pelos slides, captura cada um
  const stages = document.querySelectorAll('canvas');
  
  if (stages.length === 0) {
    throw new Error('Nenhum slide encontrado no DOM');
  }
  
  const zip = new JSZip();
  
  for (let i = 0; i < stages.length; i++) {
    const canvas = stages[i] as HTMLCanvasElement;
    const dataURL = canvas.toDataURL(
      format === 'png' ? 'image/png' : 'image/jpeg',
      0.95
    );
    const blob = dataURLtoBlob(dataURL);
    zip.file(`slide-${i + 1}.${format}`, blob);
  }
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `${carousel.topic.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}.zip`;
  saveAs(zipBlob, filename);
}
```

**IMPORTANTE — Limitação técnica:**

Capturar todos os Konva Stages de uma vez requer que estejam todos renderizados no DOM. Estratégia recomendada:

1. Renderizar todos os slides em um container hidden (`opacity: 0; position: absolute`)
2. Capturar cada Stage por sua referência
3. Gerar ZIP

Implementação completa:

```typescript
// lib/editorial/render-all-slides.ts

import { Stage } from 'konva';

/**
 * Renderiza todos os slides off-screen e retorna data URLs.
 * Cria um div hidden, monta cada layout, captura a imagem.
 */
export async function renderAllSlidesOffscreen(
  carousel: EditorialCarousel,
  format: 'png' | 'jpg' = 'png'
): Promise<{ filename: string; dataURL: string }[]> {
  const results: { filename: string; dataURL: string }[] = [];
  
  for (let i = 0; i < carousel.slides.length; i++) {
    const slide = carousel.slides[i];
    
    // Cria container hidden
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);
    
    // Cria Konva Stage diretamente
    const stage = new Stage({
      container,
      width: 1080,
      height: 1350,
    });
    
    // TODO: Renderizar layout específico aqui
    // Esta parte depende da implementação dos layouts
    
    // Aguarda render completo
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const dataURL = stage.toDataURL({
      mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
      quality: 0.95,
      pixelRatio: 2,
    });
    
    results.push({
      filename: `slide-${i + 1}.${format}`,
      dataURL,
    });
    
    // Limpa
    stage.destroy();
    container.remove();
  }
  
  return results;
}
```

**Solução pragmática:** Use o método mais simples por ora — capture os canvases que estão renderizados nas thumbnails:

```typescript
export async function exportCarouselAsZip(carousel: EditorialCarousel, format: 'png' | 'jpg') {
  const zip = new JSZip();
  
  // Pega todas as canvases (slides em thumbnail são pequenos demais para boa qualidade)
  // SOLUÇÃO: Cria uma página /export-helper que renderiza todos em fullsize
  
  // Por agora, iterar pela view atual e capturar
  const canvases = document.querySelectorAll('.slide-canvas-fullsize canvas');
  
  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i] as HTMLCanvasElement;
    const dataURL = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, 0.95);
    const blob = dataURLtoBlob(dataURL);
    zip.file(`slide-${String(i + 1).padStart(2, '0')}.${format}`, blob);
  }
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = sanitizeFilename(carousel.topic) + '.zip';
  saveAs(zipBlob, filename);
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}
```

---

## 💾 PERSISTÊNCIA

### Arquivo: `lib/editorial/persistence.ts`

```typescript
import { createClient } from '@/lib/supabase/client';
import { EditorialCarousel } from '@/components/templates/editorial/editorial.types';

export async function saveCarousel(carousel: EditorialCarousel) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');
  
  const { data, error } = await supabase
    .from('editorial_carousels')
    .insert({
      user_id: user.id,
      topic: carousel.topic,
      brand_name: carousel.brandName,
      handle: carousel.handle,
      carousel_data: carousel,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function listCarousels() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('editorial_carousels')
    .select('id, topic, brand_name, created_at')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function loadCarousel(carouselId: string): Promise<EditorialCarousel> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('editorial_carousels')
    .select('*')
    .eq('id', carouselId)
    .single();
  
  if (error) throw error;
  return data.carousel_data as EditorialCarousel;
}

export async function deleteCarousel(carouselId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('editorial_carousels')
    .delete()
    .eq('id', carouselId);
  
  if (error) throw error;
}
```

---

## 📋 LISTA DE PROJETOS

### Atualizar `app/dashboard/projetos/page.tsx`:

Adicione listagem dos carrosséis editoriais salvos:

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Plus } from 'lucide-react';
import { listCarousels, deleteCarousel } from '@/lib/editorial/persistence';

export default function ProjetosPage() {
  const [carousels, setCarousels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadCarousels();
  }, []);
  
  async function loadCarousels() {
    try {
      const data = await listCarousels();
      setCarousels(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleDelete(id: string) {
    if (!confirm('Deletar esse carrossel?')) return;
    await deleteCarousel(id);
    setCarousels(carousels.filter(c => c.id !== id));
  }
  
  return (
    <div className="ml-64 min-h-screen bg-background p-8">
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-h1 font-display font-bold">Meus Projetos</h1>
          <Link href="/dashboard/criar/editorial">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo carrossel
            </Button>
          </Link>
        </div>
        
        {loading && <p>Carregando...</p>}
        
        {!loading && carousels.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-text-secondary mb-4">
              Você ainda não criou nenhum carrossel.
            </p>
            <Link href="/dashboard/criar/editorial">
              <Button>Criar meu primeiro carrossel</Button>
            </Link>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carousels.map((carousel) => (
            <Card key={carousel.id} className="p-6">
              <h3 className="font-medium mb-2 line-clamp-2">{carousel.topic}</h3>
              <p className="text-sm text-text-secondary mb-4">
                {carousel.brand_name} · {new Date(carousel.created_at).toLocaleDateString('pt-BR')}
              </p>
              
              <div className="flex gap-2">
                <Link href={`/dashboard/criar/editorial?id=${carousel.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Abrir
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(carousel.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🌐 ROTA DA API COM SSE (PROGRESSO EM TEMPO REAL)

### Arquivo: `app/api/editorial/generate-stream/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { generateCompleteCarousel } from '@/lib/editorial/generator';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const topic = searchParams.get('topic') || '';
  const brandName = searchParams.get('brandName') || 'SYNCPOST';
  const handle = searchParams.get('handle') || '@SYNCPOST_';
  const tone = (searchParams.get('tone') || 'direto') as any;
  const audience = searchParams.get('audience') || 'criadores de conteúdo';
  
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      
      try {
        const carousel = await generateCompleteCarousel({
          topic,
          brandInfo: { name: brandName, handle },
          tone,
          targetAudience: audience,
          onProgress: (step, current, total) => {
            sendEvent('progress', { step, current, total });
          },
        });
        
        sendEvent('complete', { carousel });
        controller.close();
      } catch (error: any) {
        sendEvent('error', { message: error.message });
        controller.close();
      }
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## ✅ VALIDAÇÃO FINAL DA SESSÃO 3

Após implementar tudo:

1. **Fluxo end-to-end:**
   - Acessa `/dashboard/criar/editorial`
   - Preenche tema, marca, tom, público
   - Clica "Gerar"
   - Vê progress bar atualizando
   - Após geração, vê preview do carrossel
   - Pode trocar slides no carrossel
   - Pode editar texto no painel lateral
   - Pode trocar variantes (em layouts flexíveis)
   - Pode mudar cor de marca
   - Pode salvar
   - Pode exportar ZIP

2. **Validações específicas:**
   - [ ] Form valida campos obrigatórios
   - [ ] Loading state aparece durante geração
   - [ ] Progress bar atualiza em tempo real
   - [ ] Preview de slides carrega corretamente
   - [ ] Thumbnails clicáveis funcionam
   - [ ] Editor lateral atualiza preview em tempo real
   - [ ] Troca de variante regenera preview
   - [ ] Cor de marca aplica em destaques
   - [ ] Save funciona e aparece em /projetos
   - [ ] Export ZIP baixa arquivo
   - [ ] Imagens do ZIP em alta qualidade (1080x1350)

3. **Performance:**
   - [ ] Sem lag ao trocar slides
   - [ ] Sem memory leaks (verifica DevTools)

4. **Tira screenshots de:**
   - Form
   - Loading state
   - Editor com slide selecionado
   - Painel lateral aberto
   - ZIP exportado descompactado mostrando os slides

---

## 🚨 PROBLEMAS COMUNS

### Export ZIP captura thumbnails em vez de fullsize
**Causa:** Querying canvases errados
**Solução:** Adiciona class específica nos slides fullsize, captura por essa class

### Save no Supabase falha por permissões
**Causa:** RLS não foi aplicado ou usuário não autenticado
**Solução:** Verifica que migration 0006 foi rodada e que `auth.uid()` retorna o usuário

### SSE não funciona em produção (Vercel)
**Causa:** Vercel free plan tem timeout de 10s pra functions
**Solução:** Usa polling em vez de SSE, ou upgrade pro plano Pro (60s timeout)

### Imagens do Konva não aparecem no export
**Causa:** Imagens cross-origin não permitem exportar
**Solução:** No carregamento das imagens, sempre `crossOrigin = 'anonymous'`

### TypeError em "data.carousel_data"
**Causa:** Supabase retornou null
**Solução:** Sempre verifica `if (!data) throw...` antes de acessar

---

## 🎯 COMMIT FINAL DA SESSÃO 3

```bash
git add .
git commit -m "feat(editorial): interface de criação + sistema de export"
git push origin feature/template-editorial
```

---

## 🎉 MERGE NA MAIN

Quando tudo estiver validado:

```bash
git checkout main
git merge feature/template-editorial
git push origin main
```

---

## ✅ CHECKLIST FINAL DO TEMPLATE EDITORIAL

Após as 3 sessões completas:

### Funcional
- [ ] 9 layouts renderizam corretamente
- [ ] 4 layouts rígidos com estrutura fixa
- [ ] 5 layouts flexíveis com variantes
- [ ] IA gera roteiro completo via Anthropic
- [ ] Imagens geradas via Fal.ai
- [ ] Editor lateral funciona
- [ ] Troca de variantes em tempo real
- [ ] Save no Supabase
- [ ] Export ZIP
- [ ] Lista de projetos

### Visual
- [ ] Cores corretas (preto em fundos claros, branco em escuros)
- [ ] Highlight em roxo nas palavras certas
- [ ] Sem badge duplicado na capa
- [ ] Header consistente em todos os slides
- [ ] Footer com paginação X/Y
- [ ] Tipografia Bebas Neue / Space Grotesk / Playfair carregando

### Técnico
- [ ] Sem erros no console
- [ ] Performance fluida
- [ ] Responsive (testar em mobile)
- [ ] RLS no Supabase ativo
- [ ] Variáveis de ambiente configuradas

---

**Quando terminar, volta aqui e me reporta:**
1. Screenshot do fluxo completo (form → preview → edição → export)
2. Algum bug que sobrou
3. Tempo total das 3 sessões
4. Custo total em Fal.ai (geração de imagens)
5. Próximo passo planejado

Daí avaliamos juntos se o produto tá pronto pra:
- Beta privado (50 pessoas)
- Lançamento de ads
- Negociação com cliente da agência
- Implementação dos templates Cinematic e Hybrid

**Parabéns por chegar até aqui!** 🎉
