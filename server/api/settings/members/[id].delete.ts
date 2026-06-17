import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { throwApiError } from '../../../utils/apiError'
import { logAudit } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const targetId = getRouterParam(event, 'id')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: actorProfile } = await supabaseAdmin
    .from('profiles').select('org_id, role').eq('id', user!.id).single()
  if (!actorProfile || actorProfile.role !== 'owner')
    throwApiError('FORBIDDEN', 'Apenas o proprietário pode remover membros')

  if (targetId === user!.id)
    throwApiError('FORBIDDEN', 'Não é possível remover sua própria conta')

  const { data: targetProfile } = await supabaseAdmin
    .from('profiles').select('org_id, role').eq('id', targetId!).single()
  if (!targetProfile || targetProfile.org_id !== actorProfile.org_id)
    throwApiError('NOT_FOUND', 'Membro não encontrado')

  if (targetProfile.role === 'owner')
    throwApiError('FORBIDDEN', 'Não é possível remover o proprietário')

  const { error: profileErr } = await supabaseAdmin
    .from('profiles').delete().eq('id', targetId!)
  if (profileErr) throwApiError('INTERNAL', profileErr.message)

  const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(targetId!)
  if (authErr) throwApiError('INTERNAL', authErr.message)

  const ip = getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    ?? getHeader(event, 'x-real-ip') ?? undefined
  await logAudit(supabaseAdmin, {
    org_id:        actorProfile.org_id,
    user_id:       user!.id,
    action:        'member.removed',
    resource_type: 'member',
    resource_id:   targetId!,
    ip,
  })

  return { ok: true }
})
