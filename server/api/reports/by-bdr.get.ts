import { serverSupabaseClient } from '#supabase/server'
import { getReportRange } from '../../utils/reportRange'

// Totais por BDR no periodo. Nomes sao resolvidos no cliente (via /api/settings/members).
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { from, to } = getReportRange(event)

  const { data, error } = await supabase
    .from('daily_diary')
    .select('user_id, ld, ce, rm, rr, fr')
    .gte('date', from)
    .lte('date', to)

  if (error) throw createError({ statusCode: 500, message: error.message })

  const byUser: Record<string, { user_id: string; ld: number; ce: number; rm: number; rr: number; fr: number }> = {}
  for (const row of data ?? []) {
    const u = row.user_id
    if (!byUser[u]) byUser[u] = { user_id: u, ld: 0, ce: 0, rm: 0, rr: 0, fr: 0 }
    byUser[u].ld += row.ld ?? 0
    byUser[u].ce += row.ce
    byUser[u].rm += row.rm
    byUser[u].rr += row.rr
    byUser[u].fr += row.fr
  }

  return Object.values(byUser).sort((a, b) => b.ce - a.ce)
})
