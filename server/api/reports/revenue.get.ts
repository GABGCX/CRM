import { serverSupabaseClient } from '#supabase/server'
import { getReportRange } from '../../utils/reportRange'

// Receita: fechado no periodo, pipeline ativo e previsao ponderada por estagio.
const STAGE_PROB: Record<string, number> = {
  'Novo': 0.02, 'Prospecção': 0.05, 'Qualificação': 0.08,
  'Aguardando retorno': 0.10, 'Follow-up': 0.15, 'De molho': 0.05, 'Não atende': 0.05,
  'Reunião agendada': 0.40, 'Enviar proposta': 0.55, 'Proposta enviada': 0.70,
}
const TERMINAL = new Set(['Fechado', 'Recusado', 'Sem interesse'])

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { from, to } = getReportRange(event)
  const toEnd = `${to}T23:59:59`

  const { data, error } = await supabase
    .from('leads')
    .select('resultado, valor_estimado, updated_at')

  if (error) throw createError({ statusCode: 500, message: error.message })

  let closedValue = 0, closedCount = 0, pipelineValue = 0, weightedForecast = 0, activeWithValue = 0

  for (const row of data ?? []) {
    const v = row.valor_estimado ?? 0
    if (row.resultado === 'Fechado') {
      if (row.updated_at >= from && row.updated_at <= toEnd) { closedValue += v; closedCount++ }
    } else if (!TERMINAL.has(row.resultado)) {
      if (v > 0) { pipelineValue += v; activeWithValue++ }
      weightedForecast += v * (STAGE_PROB[row.resultado] ?? 0)
    }
  }

  return { closedValue, closedCount, pipelineValue, weightedForecast, activeWithValue }
})
