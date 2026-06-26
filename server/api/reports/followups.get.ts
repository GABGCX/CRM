import { serverSupabaseClient } from '#supabase/server'

// Curva de drop-off do protocolo de 10 tentativas: quantos follow-ups foram
// concluidos em cada indice de tentativa (carteira atual, RLS escopa por org).
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('followups')
    .select('attempt_index, completed_at, lead_id')

  if (error) throw createError({ statusCode: 500, message: error.message })

  const completedByAttempt = new Array(10).fill(0)
  const leads = new Set<string>()
  for (const row of data ?? []) {
    leads.add(row.lead_id)
    if (row.completed_at && row.attempt_index >= 0 && row.attempt_index < 10) {
      completedByAttempt[row.attempt_index]++
    }
  }

  return {
    totalLeads: leads.size,
    completedByAttempt, // index 0..9 = 1a..10a tentativa
  }
})
