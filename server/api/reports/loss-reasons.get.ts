import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('leads')
    .select('motivo_perda')
    .in('resultado', ['Recusado', 'Sem interesse'])
    .not('motivo_perda', 'is', null)

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
