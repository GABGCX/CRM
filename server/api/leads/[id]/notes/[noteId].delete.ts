import { serverSupabaseClient } from '#supabase/server'
import { throwApiError } from '../../../../utils/apiError'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const noteId   = getRouterParam(event, 'noteId')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { error } = await supabase
    .from('lead_notes')
    .delete()
    .eq('id', noteId!)

  if (error) throwApiError('INTERNAL', error.message)

  return { ok: true }
})
