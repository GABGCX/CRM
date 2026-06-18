import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('org_id, role').eq('id', user!.id).single()
  if (!profile || profile.role !== 'owner')
    throwApiError('FORBIDDEN', 'Apenas o proprietário pode visualizar o log de auditoria')

  const { data, error } = await supabaseAdmin
    .from('audit_log')
    .select('id, action, resource_type, resource_id, payload, ip, created_at, profiles(name)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throwApiError('INTERNAL', error.message)

  return data ?? []
})
