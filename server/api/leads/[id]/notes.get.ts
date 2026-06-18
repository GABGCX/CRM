import { serverSupabaseClient } from '#supabase/server'
import { throwApiError } from '../../../utils/apiError'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const leadId   = getRouterParam(event, 'id')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data, error } = await supabase
    .from('lead_notes')
    .select('id, content, created_at, user_id, profiles(name)')
    .eq('lead_id', leadId!)
    .order('created_at', { ascending: false })

  if (error) throwApiError('INTERNAL', error.message)

  return data ?? []
})
