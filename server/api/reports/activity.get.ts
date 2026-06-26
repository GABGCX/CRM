import { serverSupabaseClient } from '#supabase/server'
import { getReportRange } from '../../utils/reportRange'

// Serie diaria de atividade (somada na org, ou por usuario). Base para tendencias,
// ritmo de meta, ligacoes/dia, taxa CE/LD e heatmap.
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const query = getQuery(event)
  const { from, to } = getReportRange(event)

  let q = supabase
    .from('daily_diary')
    .select('date, ld, ce, rm, rr, fr, user_id')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })

  if (query.user_id) q = q.eq('user_id', query.user_id as string)

  const { data, error } = await q
  if (error) throw createError({ statusCode: 500, message: error.message })

  const byDate: Record<string, { date: string; ld: number; ce: number; rm: number; rr: number; fr: number }> = {}
  for (const row of data ?? []) {
    const d = row.date
    if (!byDate[d]) byDate[d] = { date: d, ld: 0, ce: 0, rm: 0, rr: 0, fr: 0 }
    byDate[d].ld += row.ld ?? 0
    byDate[d].ce += row.ce
    byDate[d].rm += row.rm
    byDate[d].rr += row.rr
    byDate[d].fr += row.fr
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
})
