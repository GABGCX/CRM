// server/api/settings/theme.patch.ts
import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { invalidateTenantCache } from '../../utils/tenantCache'

const schema = z.object({
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent_color:  z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  product_name:  z.string().min(1),
  logo_url:      z.string().url().optional().nullable(),
  favicon_url:   z.string().url().optional().nullable(),
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

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .update({ theme: parsed.data })
    .eq('id', profile.org_id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // ── Invalida cache compartilhado ────────────────────────────────────────
  invalidateTenantCache(data.slug, data.custom_domain)

  return data
})
