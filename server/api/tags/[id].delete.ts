import { requireOrg } from '../../utils/auth'
import { throwApiError } from '../../utils/apiError'

export default defineEventHandler(async (event) => {
  const { supabase } = await requireOrg(event)
  const id = getRouterParam(event, 'id')

  const { error } = await supabase.from('tags').delete().eq('id', id!)
  if (error) throwApiError('INTERNAL', error.message)
  // Ids orfaos em leads.tag_ids sao ignorados no front (mapeados contra as tags existentes).
  return { ok: true }
})
