import { requireRole } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const { admin, orgId } = await requireRole(event, ['owner', 'admin'])
  const bdrId = getRouterParam(event, 'id')
  // Resiliente: se a migration nao rodou, retorna vazio.
  const { data } = await admin
    .from('management_notes')
    .select('id, content, created_at, author_id, profiles:author_id(name)')
    .eq('org_id', orgId)
    .eq('bdr_id', bdrId!)
    .order('created_at', { ascending: false })
  return data ?? []
})
