import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ld:   z.number().min(0).max(9999).optional().default(0),
  ce:   z.number().min(0).max(9999),
  rm:   z.number().min(0).max(9999),
  rr:   z.number().min(0).max(9999),
  fr:   z.number().min(0).max(9999),
})

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const body          = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success)
    throw createError({ statusCode: 400, message: parsed.error.errors[0].message })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw createError({ statusCode: 401, message: 'Não autenticado' })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id, org_id').eq('id', user.id).single()
  if (!profile) throw createError({ statusCode: 403, message: 'Perfil não encontrado' })

  const { data, error } = await supabase
    .from('daily_diary')
    .upsert(
      { ...parsed.data, org_id: profile.org_id, user_id: profile.id },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
