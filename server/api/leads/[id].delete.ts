import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const id = getRouterParam(event, 'id')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('org_id, role').eq('id', user!.id).single()

  // Fetch lead name for audit before deleting
  const { data: lead } = await supabase
    .from('leads').select('decisor, org_id').eq('id', id!).single()

  const { error } = await supabase.from('leads').delete().eq('id', id!)
  if (error) throwApiError('INTERNAL', error.message)

  if (profile && lead) {
    const ip = getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
      ?? getHeader(event, 'x-real-ip') ?? undefined
    await logAudit(supabaseAdmin, {
      org_id:        profile.org_id,
      user_id:       user!.id,
      action:        'lead.deleted',
      resource_type: 'lead',
      resource_id:   id!,
      payload:       { decisor: lead.decisor },
      ip,
    })
  }

  return { ok: true }
})
