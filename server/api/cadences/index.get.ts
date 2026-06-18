import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('org_id').eq('id', user!.id).single()
  if (!profile) throwApiError('FORBIDDEN')

  const { data, error } = await supabaseAdmin
    .from('cadences')
    .select('*, cadence_steps(*)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: true })
    .order('step_order', { referencedTable: 'cadence_steps', ascending: true })

  if (error) throwApiError('INTERNAL', error.message)

  return data ?? []
})
