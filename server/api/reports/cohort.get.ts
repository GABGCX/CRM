import { serverSupabaseClient } from '#supabase/server'
import { getReportRange } from '../../utils/reportRange'

// Coorte por mes de criacao: dos leads criados em cada mes, quantos chegaram (pela
// posicao ATUAL no funil) a reuniao+, proposta+ e fechamento. Snapshot, nao fluxo.
const RANK: Record<string, number> = {
  'Novo': 0, 'Prospecção': 1, 'Qualificação': 2,
  'Aguardando retorno': 3, 'Follow-up': 3, 'De molho': 3, 'Não atende': 3,
  'Reunião agendada': 4, 'Enviar proposta': 5, 'Proposta enviada': 6, 'Fechado': 7,
  'Recusado': -1, 'Sem interesse': -1,
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { from, to } = getReportRange(event)

  const { data, error } = await supabase
    .from('leads')
    .select('created_at, resultado, reuniao_agendada')
    .gte('created_at', from)
    .lte('created_at', `${to}T23:59:59`)
  if (error) throw createError({ statusCode: 500, message: error.message })

  const byMonth: Record<string, { month: string; total: number; reuniao: number; proposta: number; won: number }> = {}
  for (const l of data ?? []) {
    const month = `${l.created_at.slice(0, 7)}-01`
    byMonth[month] ??= { month, total: 0, reuniao: 0, proposta: 0, won: 0 }
    const rank = RANK[l.resultado] ?? 0
    byMonth[month].total++
    if (rank >= 4 || l.reuniao_agendada) byMonth[month].reuniao++
    if (rank >= 5) byMonth[month].proposta++
    if (l.resultado === 'Fechado') byMonth[month].won++
  }

  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
})
