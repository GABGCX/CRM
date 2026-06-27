import { serverSupabaseClient } from '#supabase/server'
import { getReportRange } from '../../utils/reportRange'

// Status atual dos leads criados no periodo (snapshot por data de criacao).
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { from, to } = getReportRange(event)

  const { data, error } = await supabase
    .from('leads')
    .select('resultado')
    .gte('created_at', from)
    .lte('created_at', `${to}T23:59:59`)

  if (error) throw createError({ statusCode: 500, message: error.message })

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.resultado] = (counts[row.resultado] ?? 0) + 1
  }

  return Object.entries(counts).map(([status, count]) => ({ status, count }))
})
