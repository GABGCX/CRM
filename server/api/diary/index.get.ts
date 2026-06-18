import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const { month, year, user_id } = getQuery(event) as {
    month?: string; year?: string; user_id?: string
  }

  const now = new Date()
  const y = parseInt(year || String(now.getFullYear()))
  const m = parseInt(month || String(now.getMonth() + 1))
  const monthStart = `${y}-${String(m).padStart(2,'0')}-01`
  const monthEnd   = new Date(y, m, 0).toISOString().slice(0, 10)

  // If user_id filter requested, only owner/admin may query other users
  if (user_id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throwApiError('UNAUTHENTICATED')
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user!.id).single()
    if (!profile || !['owner', 'admin'].includes(profile.role))
      throwApiError('FORBIDDEN', 'Sem permissão para visualizar diário de outro usuário')
  }

  let q = supabase
    .from('daily_diary')
    .select('*')
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .order('date', { ascending: true })

  if (user_id) q = q.eq('user_id', user_id)

  const { data, error } = await q
  if (error) throwApiError('INTERNAL', error.message)
  return data
})
