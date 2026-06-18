import { z } from 'zod'
import { requireRole } from '../../utils/auth'
import { throwApiError } from '../../utils/apiError'

const schema = z.object({
  user_id:      z.string().uuid(),
  meta_mensal:  z.number().min(0),
  ticket_medio: z.number().min(0),
})

export default defineEventHandler(async (event) => {
  const { admin, orgId } = await requireRole(event, ['owner', 'admin'])
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throwApiError('VALIDATION', parsed.error.errors[0].message)

  const { data, error } = await admin
    .from('bdr_goals')
    .upsert(
      { org_id: orgId, ...parsed.data, updated_at: new Date().toISOString() },
      { onConflict: 'org_id,user_id' }
    )
    .select()
    .single()
  if (error) throwApiError('INTERNAL', error.message)
  return data
})
