import { serverSupabaseClient } from '#supabase/server'
import { getReportRange } from '../../utils/reportRange'

// Pipeline ao longo do tempo, a partir dos snapshots diarios (tabela pipeline_snapshots).
// Acumula daqui pra frente: so tem dados a partir de quando o snapshot diario passa a rodar.
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { from, to } = getReportRange(event)

  const { data, error } = await supabase
    .from('pipeline_snapshots')
    .select('snap_date, count, total_value')
    .gte('snap_date', from)
    .lte('snap_date', to)
    .order('snap_date', { ascending: true })
  if (error) {
    // Tabela ainda nao criada (migracao nao aplicada): devolve vazio sem quebrar a pagina.
    return []
  }

  const byDate: Record<string, { date: string; count: number; value: number }> = {}
  for (const row of data ?? []) {
    byDate[row.snap_date] ??= { date: row.snap_date, count: 0, value: 0 }
    byDate[row.snap_date].count += row.count
    byDate[row.snap_date].value += Number(row.total_value)
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
})
