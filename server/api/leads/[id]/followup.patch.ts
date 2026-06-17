import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { insertLeadEvent } from '../../../utils/leadEvents'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const leadId = getRouterParam(event, 'id')
  const { attempt_index, completed } = await readBody(event)

  const { error } = await supabase
    .from('followups')
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq('lead_id', leadId!)
    .eq('attempt_index', attempt_index)

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Evento de follow-up (não-bloqueante)
  const { data: { user } } = await supabase.auth.getUser()
  const { data: lead } = await supabase
    .from('leads').select('org_id').eq('id', leadId!).single()

  if (user && lead) {
    await insertLeadEvent(event, {
      lead_id: leadId!,
      org_id:  lead.org_id,
      user_id: user.id,
      type:    'followup',
      payload: { attempt_index, completed },
    })
  }

  return { ok: true }
})
