import { serverSupabaseClient } from "#supabase/server"
// server/api/leads/[id]/followup.patch.ts
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
  return { ok: true }
})
