import { serverSupabaseClient } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'

// Remove uma definicao de campo personalizado (RLS escopa por org).
// Os valores ja gravados em leads.custom_fields ficam orfaos e simplesmente
// deixam de ser exibidos (nao quebram nada).
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')

  const { error } = await supabase.from('custom_field_defs').delete().eq('id', id!)
  if (error) throwApiError('INTERNAL', error.message)

  return { ok: true }
})
