import { serverSupabaseClient } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const id       = getRouterParam(event, 'id')

  const { error } = await supabase
    .from('message_templates')
    .delete()
    .eq('id', id!)

  if (error) throwApiError('INTERNAL', error.message)
  return { ok: true }
})
