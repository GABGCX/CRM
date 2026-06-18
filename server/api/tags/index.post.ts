import { z } from 'zod'
import { requireOrg } from '../../utils/auth'
import { throwApiError } from '../../utils/apiError'

const schema = z.object({
  name:  z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#64748b'),
})

export default defineEventHandler(async (event) => {
  const { supabase, orgId } = await requireOrg(event)
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throwApiError('VALIDATION', parsed.error.errors[0].message)

  const { data, error } = await supabase
    .from('tags')
    .insert({ ...parsed.data, org_id: orgId })
    .select()
    .single()
  if (error) throwApiError('INTERNAL', error.message)
  return data
})
