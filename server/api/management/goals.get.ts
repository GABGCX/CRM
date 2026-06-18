import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { admin, orgId } = await requireRole(event, ['owner', 'admin'])
  // Se a tabela ainda nao existir (migration nao rodada), retorna vazio.
  const { data } = await admin.from('bdr_goals').select('user_id, meta_mensal, ticket_medio').eq('org_id', orgId)
  return data ?? []
})
