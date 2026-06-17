import { serverSupabaseClient } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data, error } = await supabase
    .from('message_templates')
    .select('id, name, channel, content, created_at, updated_at')
    .order('channel').order('name')

  if (error) throwApiError('INTERNAL', error.message)
  return data ?? []
})
