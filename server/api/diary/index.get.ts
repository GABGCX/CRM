import { serverSupabaseClient } from "#supabase/server"
// server/api/diary/index.get.ts
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { month, year } = getQuery(event) as { month?: string; year?: string }

  const now = new Date()
  const y = parseInt(year || String(now.getFullYear()))
  const m = parseInt(month || String(now.getMonth() + 1))
  const monthStart = `${y}-${String(m).padStart(2,'0')}-01`
  const monthEnd   = new Date(y, m, 0).toISOString().slice(0,10)

  const { data, error } = await supabase
    .from('daily_diary')
    .select('*')
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .order('date', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
