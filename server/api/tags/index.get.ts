import { requireOrg } from '../../utils/auth'
import { throwApiError } from '../../utils/apiError'

export default defineEventHandler(async (event) => {
  const { supabase } = await requireOrg(event)
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })
  if (error) throwApiError('INTERNAL', error.message)
  return data ?? []
})
