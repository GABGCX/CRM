import { serverSupabaseClient } from "#supabase/server"
// server/api/leads/[id].delete.ts
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')

  const { error } = await supabase.from('leads').delete().eq('id', id!)
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
