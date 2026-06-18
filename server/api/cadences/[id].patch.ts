import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const id            = getRouterParam(event, 'id')
  const { name, description, steps } = await readBody(event)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('org_id, role').eq('id', user!.id).single()
  if (!profile) throwApiError('FORBIDDEN')
  if (!['owner', 'admin'].includes(profile.role)) throwApiError('FORBIDDEN')

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (name !== undefined)        updates.name        = name.trim()
  if (description !== undefined) updates.description = description?.trim() || null

  const { error } = await supabaseAdmin
    .from('cadences').update(updates).eq('id', id!).eq('org_id', profile.org_id)
  if (error) throwApiError('INTERNAL', error.message)

  if (Array.isArray(steps)) {
    await supabaseAdmin.from('cadence_steps').delete().eq('cadence_id', id!)
    if (steps.length > 0) {
      await supabaseAdmin.from('cadence_steps').insert(
        steps.map((s: any, i: number) => ({
          cadence_id:  id,
          step_order:  i,
          day_offset:  Number(s.day_offset) || 0,
          channel:     s.channel || 'Ligacao',
          instruction: s.instruction?.trim() || null,
        }))
      )
    }
  }

  return { ok: true }
})
