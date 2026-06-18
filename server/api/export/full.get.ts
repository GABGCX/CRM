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
    throwApiError('FORBIDDEN', 'Apenas o proprietário pode exportar os dados da organização')

  const orgId = profile.org_id

  const [leads, followups, diary, members] = await Promise.all([
    supabaseAdmin.from('leads').select('*').eq('org_id', orgId),
    supabaseAdmin.from('followups').select('*').eq('org_id', orgId),
    supabaseAdmin.from('diary_entries').select('*').eq('org_id', orgId),
    supabaseAdmin.from('profiles').select('id, name, role, created_at').eq('org_id', orgId),
  ])

  const payload = JSON.stringify({
    exported_at: new Date().toISOString(),
    org_id: orgId,
    leads:     leads.data     ?? [],
    followups: followups.data ?? [],
    diary:     diary.data     ?? [],
    members:   members.data   ?? [],
  }, null, 2)

  setHeader(event, 'Content-Type', 'application/json')
  setHeader(event, 'Content-Disposition', `attachment; filename="crm-export-${new Date().toISOString().slice(0,10)}.json"`)

  return payload
})
