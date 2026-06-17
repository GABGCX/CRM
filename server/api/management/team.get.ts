import { requireRole } from '../../utils/auth'
import { throwApiError } from '../../utils/apiError'

// Painel de gestao: agrega metricas por BDR da organizacao (mes corrente).
// Usa service role para ver todos os BDRs (RLS nao se aplica ao admin client).
export default defineEventHandler(async (event) => {
  const { admin, orgId } = await requireRole(event, ['owner', 'admin'])

  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const monthStart = `${y}-${String(m).padStart(2, '0')}-01`
  const monthEnd   = new Date(y, m, 0).toISOString().slice(0, 10)
  const monthStartIso = `${monthStart}T00:00:00.000Z`

  const [{ data: members }, { data: diary }, { data: leads }, { data: org }, { data: goals }] = await Promise.all([
    admin.from('profiles').select('id, name, role').eq('org_id', orgId),
    admin.from('daily_diary').select('user_id, ce, rm, rr, fr').eq('org_id', orgId).gte('date', monthStart).lte('date', monthEnd),
    admin.from('leads').select('owner_id, resultado, valor_estimado, updated_at').eq('org_id', orgId),
    admin.from('organizations').select('settings').eq('id', orgId).single(),
    // Metas por BDR (se a migration nao rodou, vem vazio)
    admin.from('bdr_goals').select('user_id, meta_mensal, ticket_medio').eq('org_id', orgId),
  ])

  const TERMINAL = ['Fechado', 'Recusado', 'Sem interesse']
  // Probabilidade de fechamento por estagio (forecast ponderado)
  const STAGE_PROB: Record<string, number> = {
    'Aguardando retorno': 0.10, 'Follow-up': 0.15, 'De molho': 0.05, 'Não atende': 0.05,
    'Reunião agendada': 0.40, 'Enviar proposta': 0.55, 'Proposta enviada': 0.70,
  }
  const settings0 = (org as any)?.settings ?? {}
  const goalOf = (uid: string) => (goals ?? []).find(g => g.user_id === uid)

  const rows = (members ?? []).map(member => {
    const d = (diary ?? []).filter(e => e.user_id === member.id)
    const ce = d.reduce((s, e) => s + (e.ce || 0), 0)
    const rm = d.reduce((s, e) => s + (e.rm || 0), 0)
    const rr = d.reduce((s, e) => s + (e.rr || 0), 0)
    const fr = d.reduce((s, e) => s + (e.fr || 0), 0)

    const myLeads = (leads ?? []).filter(l => l.owner_id === member.id)
    const active  = myLeads.filter(l => !TERMINAL.includes(l.resultado))
    const pipelineValue = active.reduce((s, l) => s + (l.valor_estimado || 0), 0)
    const weightedForecast = Math.round(
      active.reduce((s, l) => s + (l.valor_estimado || 0) * (STAGE_PROB[l.resultado] ?? 0), 0)
    )
    const closedThisMonth = myLeads.filter(l => l.resultado === 'Fechado' && l.updated_at >= monthStartIso).length

    const g = goalOf(member.id)
    return {
      id: member.id,
      name: member.name || 'BDR',
      role: member.role,
      ce, rm, rr, fr,
      daysLogged: d.length,
      activeLeads: active.length,
      pipelineValue,
      weightedForecast,
      closedThisMonth,
      metaMensal:  Number(g?.meta_mensal)  || settings0.meta_mensal  || 10000,
      ticketMedio: Number(g?.ticket_medio) || settings0.ticket_medio || 2000,
      hasGoal: !!g,
    }
  })

  return {
    members: rows,
    meta_mensal:  settings0.meta_mensal  ?? 10000,
    ticket_medio: settings0.ticket_medio ?? 2000,
    month: m,
    year: y,
  }
})
