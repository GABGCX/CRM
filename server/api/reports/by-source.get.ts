import { serverSupabaseClient } from '#supabase/server'
import { getReportRange } from '../../utils/reportRange'

// Avanco por fonte (snapshot): dos leads criados no periodo por canal, quantos
// avancaram para reuniao+ e quantos fecharam. Mede qualidade do canal.
const ADVANCED = new Set(['Reunião agendada', 'Enviar proposta', 'Proposta enviada', 'Fechado'])
const FONTE_LABEL: Record<string, string> = {
  cold_call: 'Cold Call', linkedin: 'LinkedIn', indicacao: 'Indicação', evento: 'Evento', outro: 'Outro',
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { from, to } = getReportRange(event)

  const { data, error } = await supabase
    .from('leads')
    .select('fonte, resultado, reuniao_agendada, created_at')
    .gte('created_at', from)
    .lte('created_at', `${to}T23:59:59`)

  if (error) throw createError({ statusCode: 500, message: error.message })

  const byFonte: Record<string, { fonte: string; total: number; advanced: number; won: number }> = {}
  for (const row of data ?? []) {
    const key = row.fonte ? (FONTE_LABEL[row.fonte] ?? row.fonte) : 'Não informado'
    if (!byFonte[key]) byFonte[key] = { fonte: key, total: 0, advanced: 0, won: 0 }
    byFonte[key].total++
    if (ADVANCED.has(row.resultado) || row.reuniao_agendada) byFonte[key].advanced++
    if (row.resultado === 'Fechado') byFonte[key].won++
  }

  return Object.values(byFonte).sort((a, b) => b.total - a.total)
})
