import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { throwApiError } from '../../utils/apiError'

const schema = z.object({
  name:    z.string().min(1).max(80),
  channel: z.enum(['WhatsApp', 'Email', 'Ligacao', 'LinkedIn', 'Outro']),
  content: z.string().min(1).max(2000),
})

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const body          = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success) throwApiError('VALIDATION', parsed.error.errors[0].message)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('org_id').eq('id', user!.id).single()
  if (!profile) throwApiError('FORBIDDEN')

  const { data, error } = await supabase
    .from('message_templates')
    .insert({ ...parsed.data!, org_id: profile!.org_id })
    .select().single()

  if (error) throwApiError('INTERNAL', error.message)
  return data
})
