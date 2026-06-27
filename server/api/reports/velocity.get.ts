import { serverSupabaseClient } from '#supabase/server'
import { getReportRange } from '../../utils/reportRange'

// Velocidade do funil: tempo medio ate fechar (ciclo) e tempo medio por etapa
// (a partir das transicoes de status registradas em lead_events).
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { from, to } = getReportRange(event)
  const toEnd = `${to}T23:59:59`

  // Ciclo: leads fechados no periodo, dias entre criacao e fechamento (proxy updated_at).
  const { data: closed, error: e1 } = await supabase
    .from('leads')
    .select('created_at, updated_at')
    .eq('resultado', 'Fechado')
    .gte('updated_at', from)
    .lte('updated_at', toEnd)
  if (e1) throw createError({ statusCode: 500, message: e1.message })

  let cycleSum = 0
  for (const l of closed ?? []) {
    cycleSum += (new Date(l.updated_at).getTime() - new Date(l.created_at).getTime()) / 86_400_000
  }
  const cycleDays = closed?.length ? Math.round(cycleSum / closed.length * 10) / 10 : 0

  // Tempo por etapa: deltas entre transicoes consecutivas do mesmo lead no periodo.
  const { data: evts, error: e2 } = await supabase
    .from('lead_events')
    .select('lead_id, payload, created_at')
    .eq('type', 'status_change')
    .gte('created_at', from)
    .lte('created_at', toEnd)
    .order('created_at', { ascending: true })
    .limit(8000)
  if (e2) throw createError({ statusCode: 500, message: e2.message })

  const byLead = new Map<string, { t: number; from: string }[]>()
  for (const e of evts ?? []) {
    const arr = byLead.get(e.lead_id) ?? []
    arr.push({ t: new Date(e.created_at).getTime(), from: (e.payload as any)?.from ?? '' })
    byLead.set(e.lead_id, arr)
  }

  const acc: Record<string, { sum: number; count: number }> = {}
  for (const arr of byLead.values()) {
    for (let i = 1; i < arr.length; i++) {
      const days = (arr[i].t - arr[i - 1].t) / 86_400_000
      const stage = arr[i].from
      if (stage && days >= 0 && days < 365) {
        acc[stage] ??= { sum: 0, count: 0 }
        acc[stage].sum += days
        acc[stage].count++
      }
    }
  }
  const stages = Object.entries(acc)
    .map(([stage, v]) => ({ stage, avgDays: Math.round(v.sum / v.count * 10) / 10, count: v.count }))
    .sort((a, b) => b.avgDays - a.avgDays)

  return { cycleDays, cycleCount: closed?.length ?? 0, transitions: evts?.length ?? 0, stages }
})
