import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'

const schema = z.object({
  name:          z.string().min(2).optional(),
  meta_mensal:   z.number().min(0).optional(),
  ticket_medio:  z.number().min(0).optional(),
  timezone:      z.string().optional(),
  custom_domain: z.string().nullable().optional(),
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
    .from('profiles').select('org_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin'].includes(profile.role))
    throw createError({ statusCode: 403, message: 'Sem permissão' })

  const { name, custom_domain, ...settingsFields } = parsed.data
  const update: Record<string, any> = {}
  if (name)                          update.name = name
  if (custom_domain !== undefined)   update.custom_domain = custom_domain
  if (Object.keys(settingsFields).length) update.settings = settingsFields

  const { data, error } = await supabaseAdmin
    .from('organizations').update(update).eq('id', profile.org_id).select().single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
