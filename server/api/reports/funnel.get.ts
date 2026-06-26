import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const query = getQuery(event)

  // Normaliza 'YYYY-MM' ou 'YYYY-MM-DD' para o primeiro dia do mes.
  const monthStart = (v?: string) => v && /^\d{4}-\d{2}/.test(v) ? `${v.slice(0, 7)}-01` : null

  // Periodo: range personalizado (from/to) tem prioridade; senao, ultimos N meses.
  const from = monthStart(query.from as string | undefined)
  const to   = monthStart(query.to as string | undefined)

  let since: string
  if (from) {
    since = from
  } else {
    const months = Math.min(Number(query.months ?? 6), 24)
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - months + 1)
    cutoff.setDate(1)
    since = cutoff.toISOString().slice(0, 10)
  }

  let q = supabase
    .from('monthly_summary')
    .select('month, total_ce, total_rm, total_rr, total_fr, user_id')
    .gte('month', since)
    .order('month', { ascending: true })

  if (to) q = q.lte('month', to)
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
