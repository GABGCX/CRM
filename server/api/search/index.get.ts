import { serverSupabaseClient } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const q = (getQuery(event).q as string | undefined)?.trim()

  if (!q || q.length < 2) return { leads: [] }

  const safe = q.replace(/[%_]/g, '\\$&')

  const { data, error } = await supabase
    .from('leads')
    .select('id, decisor, negocio, telefone, resultado, created_at')
    .or(`decisor.ilike.%${safe}%,negocio.ilike.%${safe}%,telefone.ilike.%${safe}%`)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throwApiError('INTERNAL', error.message)

  return { leads: data ?? [] }
})
