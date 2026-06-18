import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const query = getQuery(event)

  // Padrão: últimos 6 meses
  const months = Math.min(Number(query.months ?? 6), 12)
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months + 1)
  cutoff.setDate(1)
  const since = cutoff.toISOString().slice(0, 10)

  let q = supabase
    .from('monthly_summary')
    .select('month, total_ce, total_rm, total_rr, total_fr, user_id')
    .gte('month', since)
    .order('month', { ascending: true })

  if (query.user_id) {
    q = q.eq('user_id', query.user_id as string)
  }

  const { data, error } = await q
  if (error) throw createError({ statusCode: 500, message: error.message })

  // Agregar por mês (somando todos os usuários quando user_id não filtrado)
  const byMonth: Record<string, { month: string; ce: number; rm: number; rr: number; fr: number }> = {}
  for (const row of data ?? []) {
    if (!byMonth[row.month]) {
      byMonth[row.month] = { month: row.month, ce: 0, rm: 0, rr: 0, fr: 0 }
    }
    byMonth[row.month].ce += row.total_ce
    byMonth[row.month].rm += row.total_rm
    byMonth[row.month].rr += row.total_rr
    byMonth[row.month].fr += row.total_fr
  }

  return Object.values(byMonth)
})
