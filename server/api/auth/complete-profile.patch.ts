import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  avatar_url: z.string().url().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw createError({ statusCode: 401, message: 'Não autenticado' })

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, message: parsed.error.errors[0].message })
  }

  const { name, avatar_url } = parsed.data

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ name, avatar_url: avatar_url ?? null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
