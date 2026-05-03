import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'editorial-uploads'
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export const maxDuration = 60

/**
 * Upload de imagem própria pro carrossel editorial.
 *
 * Body: multipart/form-data com campo "file" (File).
 * Resposta: { success: true, url: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado.' },
        { status: 401 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Campo "file" obrigatório (multipart/form-data).' },
        { status: 400 },
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: `Arquivo > ${MAX_BYTES / 1024 / 1024}MB.` },
        { status: 413 },
      )
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Tipo não suportado: ${file.type}` },
        { status: 415 },
      )
    }

    // Garantir que o bucket existe (best-effort via admin client).
    try {
      const admin = createAdminClient()
      const { data: buckets } = await admin.storage.listBuckets()
      const exists = buckets?.some((b) => b.id === BUCKET)
      if (!exists) {
        await admin.storage.createBucket(BUCKET, { public: true })
      }
    } catch {
      // Se SUPABASE_SERVICE_ROLE_KEY não estiver configurado, segue.
      // O upload abaixo vai falhar com erro claro caso o bucket realmente não exista.
    }

    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
    const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      const hint = uploadError.message.toLowerCase().includes('not found')
        ? ' (Aplique a migration 0007 ou crie o bucket "editorial-uploads" público no Supabase Dashboard.)'
        : ''
      return NextResponse.json(
        { success: false, error: uploadError.message + hint },
        { status: 500 },
      )
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(filename)
    return NextResponse.json({ success: true, url: publicData.publicUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
