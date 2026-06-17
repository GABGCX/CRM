import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import { throwApiError } from '../../utils/apiError'

const schema = z.object({
  name:    z.string().min(1).max(80).optional(),
  channel: z.enum(['WhatsApp', 'Email', 'Ligacao', 'LinkedIn', 'Outro']).optional(),
  content: z.string().min(1).max(2000).optional(),
})

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const id       = getRouterParam(event, 'id')
  const body     = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success) throwApiError('VALIDATION', parsed.error.errors[0].message)

  const { data, error } = await supabase
    .from('message_templates')
    .update({ ...parsed.data!, updated_at: new Date().toISOString() })
    .eq('id', id!)
    .select().single()

  if (error) throwApiError('INTERNAL', error.message)
  return data
})
