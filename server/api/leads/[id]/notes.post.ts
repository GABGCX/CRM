import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { throwApiError } from '../../../utils/apiError'

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const leadId        = getRouterParam(event, 'id')
  const { content }   = await readBody(event)

  if (!content || typeof content !== 'string' || !content.trim()) {
    throwApiError('VALIDATION', 'Conteudo da nota e obrigatorio.')
  }
  if (content.length > 2000) {
    throwApiError('VALIDATION', 'Nota muito longa (max 2000 caracteres).')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('org_id').eq('id', user!.id).single()
  if (!profile) throwApiError('FORBIDDEN')

  const { data, error } = await supabase
    .from('lead_notes')
    .insert({
      lead_id:  leadId,
      org_id:   profile.org_id,
      user_id:  user!.id,
      content:  content.trim(),
    })
    .select('id, content, created_at, user_id, profiles(name)')
    .single()

  if (error) throwApiError('INTERNAL', error.message)

  return data
})
