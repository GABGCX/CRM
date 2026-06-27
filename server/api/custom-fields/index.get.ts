import { serverSupabaseClient } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'

// Lista as definicoes de campos personalizados da org (RLS escopa por org).
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { data, error } = await supabase
    .from('custom_field_defs')
    .select('id, key, label, field_type, options, sort_order')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throwApiError('INTERNAL', error.message)
  return data ?? []
})
