import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('leads')
    .select('resultado')

  if (error) throw createError({ statusCode: 500, message: error.message })

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.resultado] = (counts[row.resultado] ?? 0) + 1
  }

  return Object.entries(counts).map(([status, count]) => ({ status, count }))
})
