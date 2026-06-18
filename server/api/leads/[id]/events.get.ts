import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const leadId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit ?? 50), 100)

  const { data, error } = await supabase
    .from('lead_events')
    .select('id, type, payload, created_at, user_id, profiles(name, avatar_url)')
    .eq('lead_id', leadId!)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
