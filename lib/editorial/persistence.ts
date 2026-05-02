import { createClient } from '@/lib/supabase/server'
import type { EditorialCarousel } from '@/components/templates/editorial/editorial.types'

export async function saveCarousel(carousel: EditorialCarousel, userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('editorial_carousels')
    .insert({
      user_id: userId,
      topic: carousel.topic,
      brand_name: carousel.brandName,
      handle: carousel.handle,
      carousel_data: carousel,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function loadCarousel(
  carouselId: string,
  userId: string,
): Promise<EditorialCarousel> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('editorial_carousels')
    .select('*')
    .eq('id', carouselId)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data.carousel_data as EditorialCarousel
}

export async function listCarousels(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('editorial_carousels')
    .select('id, topic, brand_name, handle, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
