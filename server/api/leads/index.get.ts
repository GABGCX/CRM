import { serverSupabaseClient } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'

const DEFAULT_LIMIT = 50

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const query = getQuery(event)

  const limit  = query.limit ? Math.min(Number(query.limit), 200) : DEFAULT_LIMIT
  const cursor = query.cursor as string | undefined // ISO date string (created_at of last seen lead)

  let q = supabase
    .from('leads')
    .select('*, followups(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) {
    q = q.lt('created_at', cursor)
  }

  if (query.status && query.status !== 'Todos') {
    q = q.eq('resultado', query.status as string)
  }

  if (query.q) {
    q = q.or(`decisor.ilike.%${query.q}%,negocio.ilike.%${query.q}%,telefone.ilike.%${query.q}%`)
  }

  const { data, error, count } = await q
  if (error) throwApiError('INTERNAL', error.message)

  const leads = data ?? []
  const nextCursor = leads.length === limit
    ? leads[leads.length - 1]?.created_at ?? null
    : null

  return { leads, nextCursor, total: count ?? 0 }
})
