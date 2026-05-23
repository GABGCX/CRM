import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'

const schema = z.object({
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent_color:  z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  product_name:  z.string().min(1),
  logo_url:      z.string().url().optional().nullable(),
  favicon_url:   z.string().url().optional().nullable(),
})

// Cache local do servidor (mesmo que server/middleware/tenant.ts)
// Invalida após salvar para que o próximo request busque o tema atualizado
const tenantCache = new Map<string, any>()

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

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .update({ theme: parsed.data })
    .eq('id', profile.org_id)
    .select().single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Invalidar cache do tenant para o próximo request pegar o tema novo
  const { data: org } = await supabaseAdmin
    .from('organizations').select('slug, custom_domain').eq('id', profile.org_id).single()
  if (org) {
    tenantCache.delete(`slug:${org.slug}`)
    if (org.custom_domain) tenantCache.delete(`domain:${org.custom_domain}`)
  }

  return data
})
