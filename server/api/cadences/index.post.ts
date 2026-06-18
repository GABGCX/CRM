import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const { name, description, steps } = await readBody(event)

  if (!name?.trim()) throwApiError('VALIDATION', 'Nome da cadencia e obrigatorio.')
  if (!Array.isArray(steps) || steps.length === 0)
    throwApiError('VALIDATION', 'A cadencia precisa ter ao menos um passo.')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('org_id, role').eq('id', user!.id).single()
  if (!profile) throwApiError('FORBIDDEN')
  if (!['owner', 'admin'].includes(profile.role)) throwApiError('FORBIDDEN', 'Somente owner/admin pode criar cadencias.')

  const { data: cadence, error } = await supabaseAdmin
    .from('cadences')
    .insert({ name: name.trim(), description: description?.trim() || null, org_id: profile.org_id })
    .select()
    .single()

  if (error) throwApiError('INTERNAL', error.message)

  const stepsToInsert = steps.map((s: any, i: number) => ({
    cadence_id:  cadence!.id,
    step_order:  i,
    day_offset:  Number(s.day_offset) || 0,
    channel:     s.channel || 'Ligacao',
    instruction: s.instruction?.trim() || null,
  }))

  const { error: stepsErr } = await supabaseAdmin.from('cadence_steps').insert(stepsToInsert)
  if (stepsErr) throwApiError('INTERNAL', stepsErr.message)

  return { ...cadence, cadence_steps: stepsToInsert }
})
