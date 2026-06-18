import { z } from 'zod'
import { requireRole } from '../../../../utils/auth'
import { throwApiError } from '../../../../utils/apiError'

const schema = z.object({ content: z.string().min(1).max(4000) })

export default defineEventHandler(async (event) => {
  const { admin, orgId, userId } = await requireRole(event, ['owner', 'admin'])
  const bdrId = getRouterParam(event, 'id')
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throwApiError('VALIDATION', parsed.error.errors[0].message)

  const { data, error } = await admin
    .from('management_notes')
    .insert({ org_id: orgId, bdr_id: bdrId!, author_id: userId, content: parsed.data.content })
    .select('id, content, created_at, author_id, profiles:author_id(name)')
    .single()
  if (error) throwApiError('INTERNAL', error.message)
  return data
})
