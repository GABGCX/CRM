import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { throwApiError } from '../../utils/apiError'

const schema = z.object({
  label:      z.string().min(1).max(40),
  field_type: z.enum(['text', 'number', 'date', 'select']).default('text'),
  options:    z.array(z.string().min(1).max(40)).max(20).optional().nullable(),
})

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'campo'
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const admin    = serverSupabaseServiceRole(event)
  const body     = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success) throwApiError('VALIDATION', parsed.error.errors[0].message)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: profile } = await admin
    .from('profiles').select('org_id').eq('id', user!.id).single()
  if (!profile) throwApiError('FORBIDDEN', 'Perfil nao encontrado')

  // chave estavel e unica (slug + sufixo curto)
  const key = `${slugify(parsed.data!.label)}_${Math.random().toString(36).slice(2, 6)}`

  const { data, error } = await supabase
    .from('custom_field_defs')
    .insert({
      org_id:     profile.org_id,
      key,
      label:      parsed.data!.label,
      field_type: parsed.data!.field_type,
      options:    parsed.data!.field_type === 'select' ? (parsed.data!.options ?? []) : null,
    })
    .select('id, key, label, field_type, options, sort_order')
    .single()

  if (error) throwApiError('INTERNAL', error.message)
  return data
})
