'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { EditorialCarousel } from '@/components/templates/editorial/editorial.types'

type SaveResult = { ok: true; id: string } | { ok: false; error: string }
type DeleteResult = { ok: true } | { ok: false; error: string }

export async function saveCarouselAction(
  carousel: EditorialCarousel,
): Promise<SaveResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { data, error } = await supabase
    .from('editorial_carousels')
    .insert({
      user_id: user.id,
      topic: carousel.topic,
      brand_name: carousel.brandName,
      handle: carousel.handle,
      carousel_data: carousel,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/editorial')
  return { ok: true, id: data.id }
}

export async function updateCarouselAction(
  carouselId: string,
  carousel: EditorialCarousel,
): Promise<SaveResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { error } = await supabase
    .from('editorial_carousels')
    .update({
      topic: carousel.topic,
      brand_name: carousel.brandName,
      handle: carousel.handle,
      carousel_data: carousel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', carouselId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/editorial')
  revalidatePath(`/dashboard/criar/editorial`)
  return { ok: true, id: carouselId }
}

export async function deleteCarouselAction(carouselId: string): Promise<DeleteResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { error } = await supabase
    .from('editorial_carousels')
    .delete()
    .eq('id', carouselId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/editorial')
  return { ok: true }
}

export interface EditorialListItem {
  id: string
  topic: string
  brand_name: string | null
  handle: string | null
  created_at: string
  updated_at: string
}

export async function listCarouselsAction(): Promise<EditorialListItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('editorial_carousels')
    .select('id, topic, brand_name, handle, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as EditorialListItem[]
}

export async function loadCarouselAction(
  carouselId: string,
): Promise<{ ok: true; carousel: EditorialCarousel } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { data, error } = await supabase
    .from('editorial_carousels')
    .select('carousel_data')
    .eq('id', carouselId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return { ok: false, error: error?.message || 'Não encontrado.' }
  return { ok: true, carousel: data.carousel_data as EditorialCarousel }
}
