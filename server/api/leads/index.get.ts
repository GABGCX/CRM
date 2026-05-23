import { serverSupabaseClient } from "#supabase/server"
// server/api/leads/index.get.ts
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const query = getQuery(event)

  let q = supabase
    .from('leads')
    .select('*, followups(*)')
    .order('created_at', { ascending: false })

  if (query.status && query.status !== 'Todos')
    q = q.eq('resultado', query.status as string)

  if (query.q)
    q = q.or(`decisor.ilike.%${query.q}%,negocio.ilike.%${query.q}%,telefone.ilike.%${query.q}%`)

  const { data, error } = await q
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
