import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const id            = getRouterParam(event, 'id')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('org_id, role').eq('id', user!.id).single()
  if (!profile) throwApiError('FORBIDDEN')
  if (!['owner', 'admin'].includes(profile.role)) throwApiError('FORBIDDEN')

  const { error } = await supabaseAdmin
    .from('cadences').delete().eq('id', id!).eq('org_id', profile.org_id)
  if (error) throwApiError('INTERNAL', error.message)

  return { ok: true }
})
