import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw createError({ statusCode: 401, message: 'Não autenticado' })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) throw createError({ statusCode: 403, message: 'Perfil não encontrado' })

  // Buscar profiles da org com dados de auth (email) via service role
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, name, role, avatar_url, created_at')
    .eq('org_id', profile.org_id)
    .order('created_at')

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Enriquecer com emails do auth.users
  const userIds = (profiles ?? []).map(p => p.id)
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
  const emailMap = Object.fromEntries(
    (authUsers?.users ?? [])
      .filter(u => userIds.includes(u.id))
      .map(u => [u.id, u.email ?? ''])
  )

  return (profiles ?? []).map(p => ({ ...p, email: emailMap[p.id] ?? '' }))
})
