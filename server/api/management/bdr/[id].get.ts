import { requireRole } from '../../../utils/auth'
import { throwApiError } from '../../../utils/apiError'

// Detalhe de gestao de um BDR: serie do mes, totais, leads e settings (pro gargalo).
export default defineEventHandler(async (event) => {
  const { admin, orgId } = await requireRole(event, ['owner', 'admin'])
  const userId = getRouterParam(event, 'id')
  if (!userId) throwApiError('VALIDATION', 'BDR nao informado')

  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const monthStart = `${y}-${String(m).padStart(2, '0')}-01`
  const monthEnd   = new Date(y, m, 0).toISOString().slice(0, 10)

  const [{ data: profile }, { data: diary }, { data: leads }, { data: org }, { data: goal }, { data: members }] = await Promise.all([
    admin.from('profiles').select('id, name, role').eq('id', userId).eq('org_id', orgId).single(),
    admin.from('daily_diary').select('date, ce, rm, rr, fr').eq('org_id', orgId).eq('user_id', userId).gte('date', monthStart).lte('date', monthEnd).order('date'),
    admin.from('leads').select('id, decisor, negocio, resultado, valor_estimado, data_retorno, updated_at').eq('org_id', orgId).eq('owner_id', userId).order('updated_at', { ascending: false }),
    admin.from('organizations').select('settings').eq('id', orgId).single(),
    admin.from('bdr_goals').select('meta_mensal, ticket_medio').eq('org_id', orgId).eq('user_id', userId).maybeSingle(),
    admin.from('profiles').select('id, name').eq('org_id', orgId),
  ])

  if (!profile) throwApiError('NOT_FOUND', 'BDR nao encontrado')

  const d = diary ?? []
  const totals = d.reduce((a, e) => ({ ce: a.ce + (e.ce||0), rm: a.rm + (e.rm||0), rr: a.rr + (e.rr||0), fr: a.fr + (e.fr||0) }), { ce: 0, rm: 0, rr: 0, fr: 0 })
  const settings = (org as any)?.settings ?? {}

  return {
    profile,
    series: d,
    totals,
    leads: leads ?? [],
    meta_mensal:  Number((goal as any)?.meta_mensal)  || settings.meta_mensal  || 10000,
    ticket_medio: Number((goal as any)?.ticket_medio) || settings.ticket_medio || 2000,
    hasGoal: !!goal,
    members: (members ?? []).map(mm => ({ id: mm.id, name: mm.name || 'BDR' })),
    month: m,
    year: y,
  }
})
