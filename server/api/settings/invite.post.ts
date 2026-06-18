import { requireRole, clientIp } from '../../utils/auth'
import { checkRateLimit } from '../../utils/rateLimit'
import { throwApiError } from '../../utils/apiError'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { admin, orgId, userId } = await requireRole(event, ['owner', 'admin'])
  const { email, role = 'bdr' } = await readBody(event)

  if (!email) throwApiError('VALIDATION', 'E-mail obrigatório')

  const { allowed, retryAfterSecs } = await checkRateLimit(admin, `invite:${orgId}`, 10, 3600)
  if (!allowed) {
    setHeader(event, 'Retry-After', retryAfterSecs)
    throwApiError('RATE_LIMITED', 'Muitos convites enviados. Aguarde antes de tentar novamente.')
  }

  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { org_id: orgId, role },
  })

  if (error) throwApiError('INTERNAL', error.message)

  if (invited?.user) {
    await admin.from('profiles').upsert({
      id: invited.user.id,
      org_id: orgId,
      role,
    }, { onConflict: 'id' })
  }

  await logAudit(admin, {
    org_id:        orgId,
    user_id:       userId,
    action:        'member.invited',
    resource_type: 'member',
    payload:       { email, role },
    ip:            clientIp(event),
  })

  return { ok: true }
})
