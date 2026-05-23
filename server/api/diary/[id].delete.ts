import { serverSupabaseClient } from "#supabase/server"
// server/api/diary/[id].delete.ts
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')

  const { error } = await supabase.from('daily_diary').delete().eq('id', id!)
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
