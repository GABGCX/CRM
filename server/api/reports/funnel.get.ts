import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const query = getQuery(event)

  // Consulta a daily_diary direto (1 linha por dia) pra permitir intervalo livre
  // por data. O agrupamento por mes e so para o grafico; os totais sao exatos.
  const isDate = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v)
  const today  = new Date().toISOString().slice(0, 10)

  // Range: from/to (datas exatas) tem prioridade; senao, ultimos N meses ate hoje.
  let from: string
  const to = isDate(query.to as string) ? (query.to as string) : today
  if (isDate(query.from as string)) {
    from = query.from as string
  } else {
    const months = Math.min(Number(query.months ?? 6), 24)
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - months + 1)
    cutoff.setDate(1)
    from = cutoff.toISOString().slice(0, 10)
  }

  let q = supabase
    .from('daily_diary')
    .select('date, ce, rm, rr, fr, user_id')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })

  if (query.user_id) q = q.eq('user_id', query.user_id as string)

  const { data, error } = await q
  if (error) throw createError({ statusCode: 500, message: error.message })

  // Agrega por mes (somando todos os usuarios quando user_id nao filtrado)
  const byMonth: Record<string, { month: string; ce: number; rm: number; rr: number; fr: number }> = {}
  for (const row of data ?? []) {
    const month = `${row.date.slice(0, 7)}-01` // YYYY-MM-01
    if (!byMonth[month]) byMonth[month] = { month, ce: 0, rm: 0, rr: 0, fr: 0 }
    byMonth[month].ce += row.ce
    byMonth[month].rm += row.rm
    byMonth[month].rr += row.rr
    byMonth[month].fr += row.fr
  }

  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
})
