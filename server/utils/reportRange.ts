import type { H3Event } from 'h3'
import { getQuery } from 'h3'

// Resolve o intervalo de datas de um relatorio a partir da query.
// Prioridade: from/to (YYYY-MM-DD) exatos; senao, ultimos N meses ate hoje.
export function getReportRange(event: H3Event): { from: string; to: string } {
  const q = getQuery(event)
  const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
  const today = new Date().toISOString().slice(0, 10)

  const to = isDate(q.to) ? q.to : today
  let from: string
  if (isDate(q.from)) {
    from = q.from
  } else {
    const months = Math.min(Number(q.months ?? 6), 24)
    const c = new Date()
    c.setMonth(c.getMonth() - months + 1)
    c.setDate(1)
    from = c.toISOString().slice(0, 10)
  }
  return { from, to }
}
