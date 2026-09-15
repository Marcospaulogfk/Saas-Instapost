'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PreviewSlide } from '@/components/carousel/slide-preview'
import type { CarouselV2Data } from './carousel'

// =====================================================================
// "Meus modelos": slide avulso ou carrossel inteiro salvo pelo usuário no
// editor novo (carousel-editor.tsx) pra reusar depois. Persiste em
// carousel_templates (migration 0030 — AINDA NÃO APLICADA no banco: até o
// Maestro rodar, toda ação aqui volta erro amigável via TABLE_MISSING_MSG,
// sem derrubar o editor).
// =====================================================================

const TABLE = 'carousel_templates'

/** Código do Postgres pra "relation does not exist" (ver lib/generation/usage-log.ts). */
const UNDEFINED_TABLE = '42P01'

const TABLE_MISSING_MSG =
  '"Meus modelos" ainda não foi ativado nesta conta. Tente de novo mais tarde.'

export type TemplateKind = 'slide' | 'carousel'

export interface CarouselTemplateItem {
  id: string
  name: string
  kind: TemplateKind
  /** Um PreviewSlide (kind slide) ou o CarouselV2Data inteiro (kind carousel). */
  data: PreviewSlide | CarouselV2Data
  preview_url: string | null
  created_at: string
  updated_at: string
}

type ListResult = { ok: true; items: CarouselTemplateItem[] } | { ok: false; error: string }
type SaveResult = { ok: true; id: string } | { ok: false; error: string }
type MutateResult = { ok: true } | { ok: false; error: string }

/** true quando o erro é "tabela não existe" (migration 0030 ainda não aplicada). */
function isTableMissing(error: { code?: string } | null): boolean {
  return error?.code === UNDEFINED_TABLE
}

export interface SaveCarouselTemplateInput {
  name: string
  kind: TemplateKind
  data: PreviewSlide | CarouselV2Data
  previewUrl?: string | null
}

export async function saveCarouselTemplate(
  input: SaveCarouselTemplateInput,
): Promise<SaveResult> {
  const name = input.name.trim()
  if (!name) return { ok: false, error: 'Dê um nome pro modelo.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: user.id,
      name,
      kind: input.kind,
      data: input.data,
      preview_url: input.previewUrl ?? null,
    })
    .select('id')
    .single()

  if (error) {
    if (isTableMissing(error)) return { ok: false, error: TABLE_MISSING_MSG }
    return { ok: false, error: error.message }
  }
  revalidatePath('/dashboard/templates')
  return { ok: true, id: inserted.id }
}

/** Lista os modelos da conta, mais recentes primeiro. `kind` filtra (ex.: só slide, pro "+ adicionar"). */
export async function listCarouselTemplates(kind?: TemplateKind): Promise<ListResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  let query = supabase
    .from(TABLE)
    .select('id, name, kind, data, preview_url, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
  if (kind) query = query.eq('kind', kind)

  const { data, error } = await query
  if (error) {
    if (isTableMissing(error)) return { ok: false, error: TABLE_MISSING_MSG }
    return { ok: false, error: error.message }
  }
  return { ok: true, items: (data ?? []) as CarouselTemplateItem[] }
}

type GetResult = { ok: true; item: CarouselTemplateItem } | { ok: false; error: string }

/** Um modelo por id — usado pra "usar como base" ao abrir um carrossel novo. */
export async function getCarouselTemplate(id: string): Promise<GetResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, kind, data, preview_url, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) {
    if (isTableMissing(error)) return { ok: false, error: TABLE_MISSING_MSG }
    return { ok: false, error: error.message }
  }
  if (!data) return { ok: false, error: 'Este modelo não existe mais.' }
  return { ok: true, item: data as CarouselTemplateItem }
}

export async function renameCarouselTemplate(id: string, name: string): Promise<MutateResult> {
  const trimmed = name.trim()
  if (!trimmed) return { ok: false, error: 'Dê um nome pro modelo.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { error } = await supabase
    .from(TABLE)
    .update({ name: trimmed })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) {
    if (isTableMissing(error)) return { ok: false, error: TABLE_MISSING_MSG }
    return { ok: false, error: error.message }
  }
  revalidatePath('/dashboard/templates')
  return { ok: true }
}

/** Apaga um modelo. A UI é quem confirma com o usuário antes de chamar isto. */
export async function deleteCarouselTemplate(id: string): Promise<MutateResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { error } = await supabase.from(TABLE).delete().eq('id', id).eq('user_id', user.id)
  if (error) {
    if (isTableMissing(error)) return { ok: false, error: TABLE_MISSING_MSG }
    return { ok: false, error: error.message }
  }
  revalidatePath('/dashboard/templates')
  return { ok: true }
}
