import { z } from 'zod'
import { requireRole } from '../../utils/auth'
import { throwApiError } from '../../utils/apiError'
import { insertLeadEvent } from '../../utils/leadEvents'

const schema = z.object({
  lead_id:  z.string().uuid(),
  owner_id: z.string().uuid(),
})

// Reatribui um lead a outro BDR (owner/admin).
export default defineEventHandler(async (event) => {
  const { admin, orgId, userId } = await requireRole(event, ['owner', 'admin'])
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throwApiError('VALIDATION', parsed.error.errors[0].message)

  // Garante que o novo dono pertence a mesma org
  const { data: target } = await admin
    .from('profiles').select('id').eq('id', parsed.data.owner_id).eq('org_id', orgId).single()
  if (!target) throwApiError('VALIDATION', 'BDR de destino invalido')

  const { data, error } = await admin
    .from('leads')
    .update({ owner_id: parsed.data.owner_id })
    .eq('id', parsed.data.lead_id)
    .eq('org_id', orgId)
    .select()
    .single()
  if (error) throwApiError('INTERNAL', error.message)

  await insertLeadEvent(event, {
    lead_id: parsed.data.lead_id,
    org_id:  orgId,
    user_id: userId,
    type:    'field_update',
    payload: { fields: ['owner_id'], reassigned_to: parsed.data.owner_id },
  })

  return data
})
