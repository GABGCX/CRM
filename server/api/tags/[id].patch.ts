import { z } from 'zod'
import { requireOrg } from '../../utils/auth'
import { throwApiError } from '../../utils/apiError'

const schema = z.object({
  name:  z.string().min(1).max(40).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export default defineEventHandler(async (event) => {
  const { supabase } = await requireOrg(event)
  const id = getRouterParam(event, 'id')
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throwApiError('VALIDATION', parsed.error.errors[0].message)

  const { data, error } = await supabase
    .from('tags')
    .update(parsed.data)
    .eq('id', id!)
    .select()
    .single()
  if (error) throwApiError('INTERNAL', error.message)
  return data
})
