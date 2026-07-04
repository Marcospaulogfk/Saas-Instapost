'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PreviewSlide, EditorialStyle } from '@/components/carousel/slide-preview'

// =====================================================================
// Server actions do EDITOR NOVO de carrossel (carousel-editor.tsx).
// Persiste o estado inteiro em editorial_carousels.carousel_data (JSONB).
// Marcador _kind distingue do editor editorial antigo (EditorialCarousel).
// =====================================================================

const KIND = 'carousel-v2' as const

/** Estado completo do editor novo — o que é preciso pra reconstruir o carrossel. */
export interface CarouselV2Data {
  _kind: typeof KIND
  slides: PreviewSlide[]
  title: string
  caption: string
  brandName: string
  handle: string
  colors: string[]
  template: 'editorial' | 'cinematic' | 'hybrid'
  editorialStyle: EditorialStyle
  format: 'feed' | 'stories'
}

export interface SaveCarouselInput {
  /** Se presente, atualiza o registro existente; senão cria um novo. */
  id?: string
  data: CarouselV2Data
}

type SaveResult = { ok: true; id: string } | { ok: false; error: string }
type DeleteResult = { ok: true } | { ok: false; error: string }

export async function saveCarouselV2(input: SaveCarouselInput): Promise<SaveResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const data: CarouselV2Data = { ...input.data, _kind: KIND }
  const row = {
    topic: data.title?.trim() || 'Carrossel',
    brand_name: data.brandName || null,
    handle: data.handle || null,
    carousel_data: data,
  }

  if (input.id) {
    const { error } = await supabase
      .from('editorial_carousels')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', input.id)
      .eq('user_id', user.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/dashboard/projetos')
    return { ok: true, id: input.id }
  }

  const { data: inserted, error } = await supabase
    .from('editorial_carousels')
    .insert({ user_id: user.id, ...row })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/projetos')
  return { ok: true, id: inserted.id }
}

export async function loadCarouselV2(
  id: string,
): Promise<{ ok: true; data: CarouselV2Data } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { data, error } = await supabase
    .from('editorial_carousels')
    .select('carousel_data')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (error || !data) return { ok: false, error: error?.message || 'Não encontrado.' }
  return { ok: true, data: data.carousel_data as CarouselV2Data }
}

export interface CarouselListItem {
  id: string
  title: string
  brand_name: string | null
  cover_url: string | null
  slide_count: number
  updated_at: string
}

/** Lista os carrosséis do editor novo pra Biblioteca (com capa e contagem). */
export async function listCarouselsV2(): Promise<CarouselListItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('editorial_carousels')
    .select('id, topic, brand_name, carousel_data, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
  if (error || !data) return []

  return data
    .filter((r) => (r.carousel_data as CarouselV2Data)?._kind === KIND)
    .map((r) => {
      const cd = r.carousel_data as CarouselV2Data
      const slides = Array.isArray(cd.slides) ? cd.slides : []
      const cover = slides.find((s) => s.image?.url)?.image.url ?? null
      return {
        id: r.id as string,
        title: (r.topic as string) || 'Carrossel',
        brand_name: (r.brand_name as string) || null,
        cover_url: cover,
        slide_count: slides.length,
        updated_at: r.updated_at as string,
      }
    })
}

export async function deleteCarouselV2(id: string): Promise<DeleteResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { error } = await supabase
    .from('editorial_carousels')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/projetos')
  return { ok: true }
}
