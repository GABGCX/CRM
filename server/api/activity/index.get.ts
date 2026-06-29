import { serverSupabaseClient } from '#supabase/server'

// Feed org-wide de atividade (lead_events). RLS de lead_events ja limita
// ao org do usuario (org_id = get_org_id()); o join de leads/profiles segue
// as mesmas policies.
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit ?? 60), 100)

  const { data, error } = await supabase
    .from('lead_events')
    .select('id, type, payload, created_at, lead_id, leads(decisor, negocio), profiles(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
