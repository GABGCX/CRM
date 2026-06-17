import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { throwApiError } from '../../../utils/apiError'

const schema = z.object({
  role: z.enum(['admin', 'bdr']),
})

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const targetId = getRouterParam(event, 'id')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: actorProfile } = await supabaseAdmin
    .from('profiles').select('org_id, role').eq('id', user!.id).single()
  if (!actorProfile || !['owner', 'admin'].includes(actorProfile.role))
    throwApiError('FORBIDDEN', 'Sem permissão')

  const { data: targetProfile } = await supabaseAdmin
    .from('profiles').select('org_id, role').eq('id', targetId!).single()
  if (!targetProfile || targetProfile.org_id !== actorProfile!.org_id)
    throwApiError('NOT_FOUND', 'Membro não encontrado')

  if (targetProfile!.role === 'owner')
    throwApiError('FORBIDDEN', 'Não é possível alterar o papel do proprietário')

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    throwApiError('VALIDATION', parsed.error.errors[0].message)

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role: parsed.data!.role })
    .eq('id', targetId!)

  if (error) throwApiError('INTERNAL', error.message)
  return { ok: true }
})
