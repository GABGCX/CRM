import { serverSupabaseClient } from '#supabase/server'
import { getReportRange } from '../../utils/reportRange'

// Motivos de perda dos leads criados no periodo (snapshot por data de criacao).
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { from, to } = getReportRange(event)

  const { data, error } = await supabase
    .from('leads')
    .select('motivo_perda')
    .in('resultado', ['Recusado', 'Sem interesse'])
    .not('motivo_perda', 'is', null)
    .gte('created_at', from)
    .lte('created_at', `${to}T23:59:59`)

  if (error) throw createError({ statusCode: 500, message: error.message })

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    if (!row.motivo_perda) continue
    counts[row.motivo_perda] = (counts[row.motivo_perda] ?? 0) + 1
  }

  return Object.entries(counts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
})
