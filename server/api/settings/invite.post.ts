// server/api/settings/invite.post.ts
import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { rateLimit, rateLimitRetryAfter } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  // ── Rate limit: 10 convites por org por hora ────────────────────────────
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const { email, role = 'bdr' } = await readBody(event)

  if (!email) throw createError({ statusCode: 400, message: 'E-mail obrigatório' })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw createError({ statusCode: 401, message: 'Não autenticado' })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('org_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin'].includes(profile.role))
    throw createError({ statusCode: 403, message: 'Sem permissão' })

  if (!rateLimit(`invite:${profile.org_id}`, 10, 60 * 60 * 1000)) {
    const retryAfter = Math.ceil(rateLimitRetryAfter(`invite:${profile.org_id}`) / 1000)
    setHeader(event, 'Retry-After', String(retryAfter))
    throw createError({ statusCode: 429, message: 'Muitos convites enviados. Aguarde antes de tentar novamente.' })
  }

  const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { org_id: profile.org_id, role },
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  if (invited?.user) {
    await supabaseAdmin.from('profiles').upsert({
      id: invited.user.id,
      org_id: profile.org_id,
      role,
    }, { onConflict: 'id' })
  }

  return { ok: true }
})
