import { serverSupabaseClient } from '#supabase/server'
import { getReportRange } from '../../utils/reportRange'

// Movimentacao do pipeline no periodo (a partir de lead_events): quantos entraram,
// avancaram de estagio, ganharam e perderam.
const RANK: Record<string, number> = {
  'Novo': 0, 'Prospecção': 1, 'Qualificação': 2,
  'Aguardando retorno': 3, 'Follow-up': 3, 'De molho': 3, 'Não atende': 3,
  'Reunião agendada': 4, 'Enviar proposta': 5, 'Proposta enviada': 6, 'Fechado': 7,
}
const LOST = new Set(['Recusado', 'Sem interesse'])

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { from, to } = getReportRange(event)

  const { data, error } = await supabase
    .from('lead_events')
    .select('type, payload, created_at')
    .in('type', ['created', 'status_change'])
    .gte('created_at', from)
    .lte('created_at', `${to}T23:59:59`)
    .limit(10000)
  if (error) throw createError({ statusCode: 500, message: error.message })

  let created = 0, advanced = 0, won = 0, lost = 0
  for (const e of data ?? []) {
    if (e.type === 'created') { created++; continue }
    const p = (e.payload ?? {}) as any
    if (p.to === 'Fechado') won++
    else if (LOST.has(p.to)) lost++
    else if ((RANK[p.to] ?? 0) > (RANK[p.from] ?? 0)) advanced++
  }

  return { created, advanced, won, lost }
})
