"use client"

import { buildPalette } from "@/lib/single-posts/palette"
import type { PostBrand, PostContent } from "@/lib/single-posts/types"
import { playfair, inter, anton, allura, bebas, montserrat, archivo, grotesk } from "./fonts"

import { ProfissionalRetratoTituloBottom } from "./templates/profissional/01-RetratoTituloBottom"
import { ProfissionalRetratoCardCta } from "./templates/profissional/02-RetratoCardCta"
import { ProfissionalPerguntaProvocativa } from "./templates/profissional/03-PerguntaProvocativa"
import { ProfissionalFraseEducativaMoldura } from "./templates/profissional/04-FraseEducativaMoldura"

import { BeautyCloseupSerifEditorial } from "./templates/beauty/01-CloseupSerifEditorial"
import { BeautyInstagramUiMockup } from "./templates/beauty/03-InstagramUiMockup"
import { BeautyProdutoComElemento } from "./templates/beauty/04-ProdutoComElemento"
import { BeautyFraseConceitualCentered } from "./templates/beauty/05-FraseConceitualCentered"

import { ComercialSplitColorProduct } from "./templates/comercial/01-SplitColorProduct"
import { ComercialProdutoIsoladoClean } from "./templates/comercial/02-ProdutoIsoladoClean"
import { ComercialEquipeCardLateral } from "./templates/comercial/03-EquipeCardLateral"
import { ComercialNumeroGrandeRetrato } from "./templates/comercial/04-NumeroGrandeRetrato"

import { EmpresaCtaSetaGrande } from "./templates/empresa/03-CtaSetaGrande"

import { FitnessResultadosGrid } from "./templates/fitness/01-ResultadosGrid"
import { FitnessPromocionalRetrato } from "./templates/fitness/02-PromocionalRetrato"
import { FitnessDesafioComSelo } from "./templates/fitness/03-DesafioComSelo"
import { FitnessInstitucionalFotosEspaco } from "./templates/fitness/04-InstitucionalFotosEspaco"

import { InformativoAlertaCardButtons } from "./templates/informativo/01-AlertaCardButtons"
import { InformativoCaseStorytelling } from "./templates/informativo/02-CaseStorytelling"
import { InformativoVagasRequisitos } from "./templates/informativo/03-VagasRequisitos"

interface Props {
  templateId: string
  brand: PostBrand
  content: PostContent
  className?: string
  /** "post" = 4:5 (1080×1350) · "story" = 9:16 (1080×1920) */
  format?: "post" | "story"
  /** "editorial" (default) · "modern-sans" · "bold-impact" · "classic-serif" */
  fontPreset?: string
}

// Mapping de fonte original → fonte alvo por preset.
// Aplicado via <style> scoped sobrescrevendo as classes do next/font.
type FontKeyName = "playfair" | "anton" | "inter" | "allura"

function globalFont(target: string): Partial<Record<FontKeyName, string>> {
  return {
    playfair: target,
    anton: target,
    inter: target,
    allura: target,
  }
}

const PRESET_FONT_MAP: Record<string, Partial<Record<FontKeyName, string>>> = {
  inter: globalFont("var(--font-inter), system-ui, sans-serif"),
  "inter-bold": globalFont("var(--font-inter), system-ui, sans-serif"),
  playfair: globalFont("var(--font-playfair), 'Playfair Display', serif"),
  anton: globalFont("var(--font-anton), 'Anton', sans-serif"),
  bebas: globalFont("var(--font-bebas), 'Bebas Neue', sans-serif"),
  montserrat: globalFont("var(--font-montserrat), 'Montserrat', system-ui, sans-serif"),
  archivo: globalFont("var(--font-archivo), 'Archivo Black', sans-serif"),
  grotesk: globalFont("var(--font-grotesk), 'Space Grotesk', system-ui, sans-serif"),
}

export function PostPreview({
  templateId,
  brand,
  content,
  className,
  format = "post",
  fontPreset = "editorial",
}: Props) {
  const palette = buildPalette(brand)
  const props = { brand, content, palette }
  const aspectClass = format === "story" ? "aspect-[9/16]" : "aspect-[4/5]"
  const presetMap = PRESET_FONT_MAP[fontPreset]
  const presetCss = presetMap
    ? Object.entries(presetMap)
        .map(([key, value]) => {
          const cls =
            key === "playfair"
              ? playfair.className
              : key === "anton"
                ? anton.className
                : key === "allura"
                  ? allura.className
                  : inter.className
          return `.font-preset-scope.${cls.replace(/\s+/g, ".")} { font-family: ${value} !important; } .font-preset-scope .${cls.replace(/\s+/g, ".")} { font-family: ${value} !important; }`
        })
        .join("\n")
    : ""

  // Garante que as CSS vars do next/font estão disponíveis dentro do scope
  const fontVars = `${playfair.variable} ${inter.variable} ${anton.variable} ${allura.variable} ${bebas.variable} ${montserrat.variable} ${archivo.variable} ${grotesk.variable}`

  return (
    <div
      className={`font-preset-scope ${fontVars} relative ${aspectClass} w-full overflow-hidden rounded-xl ${className ?? ""}`}
      style={{ containerType: "inline-size" }}
    >
      {presetCss && <style dangerouslySetInnerHTML={{ __html: presetCss }} />}
      {(() => {
        switch (templateId) {
          case "profissional-01-retrato-titulo-bottom":
            return <ProfissionalRetratoTituloBottom {...props} />
          case "profissional-02-retrato-card-cta":
            return <ProfissionalRetratoCardCta {...props} />
          case "profissional-03-pergunta-provocativa":
            return <ProfissionalPerguntaProvocativa {...props} />
          case "profissional-04-frase-educativa-moldura":
            return <ProfissionalFraseEducativaMoldura {...props} />

          case "beauty-01-closeup-serif-editorial":
            return <BeautyCloseupSerifEditorial {...props} />
          case "beauty-03-instagram-ui-mockup":
            return <BeautyInstagramUiMockup {...props} />
          case "beauty-04-produto-com-elemento":
            return <BeautyProdutoComElemento {...props} />
          case "beauty-05-frase-conceitual-centered":
            return <BeautyFraseConceitualCentered {...props} />

          case "comercial-01-split-color-product":
            return <ComercialSplitColorProduct {...props} />
          case "comercial-02-produto-isolado-clean":
            return <ComercialProdutoIsoladoClean {...props} />
          case "comercial-03-equipe-card-lateral":
            return <ComercialEquipeCardLateral {...props} />
          case "comercial-04-numero-grande-retrato":
            return <ComercialNumeroGrandeRetrato {...props} />

          case "empresa-03-cta-seta-grande":
            return <EmpresaCtaSetaGrande {...props} />

          case "fitness-01-resultados-grid":
            return <FitnessResultadosGrid {...props} />
          case "fitness-02-promocional-retrato":
            return <FitnessPromocionalRetrato {...props} />
          case "fitness-03-desafio-com-selo":
            return <FitnessDesafioComSelo {...props} />
          case "fitness-04-institucional-fotos-espaco":
            return <FitnessInstitucionalFotosEspaco {...props} />

          case "informativo-01-alerta-card-buttons":
            return <InformativoAlertaCardButtons {...props} />
          case "informativo-02-case-storytelling":
            return <InformativoCaseStorytelling {...props} />
          case "informativo-03-vagas-requisitos":
            return <InformativoVagasRequisitos {...props} />

          default:
            return (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-400 text-sm">
                Template {templateId} não implementado ainda
              </div>
            )
        }
      })()}
    </div>
  )
}
