import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { insertLeadEvent } from '../../../utils/leadEvents'
import { throwApiError } from '../../../utils/apiError'

// Registro manual de atividade na timeline do lead (ligacao, whatsapp, reuniao...).
const schema = z.object({
  kind: z.enum(['ligacao', 'whatsapp', 'reuniao', 'email', 'outro']),
  note: z.string().max(500).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const admin    = serverSupabaseServiceRole(event)
  const leadId   = getRouterParam(event, 'id')
  const body     = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success) throwApiError('VALIDATION', parsed.error.errors[0].message)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: lead } = await admin.from('leads').select('org_id').eq('id', leadId!).single()
  if (!lead) throwApiError('NOT_FOUND', 'Lead nao encontrado')

  await insertLeadEvent(event, {
    lead_id: leadId!,
    org_id:  lead.org_id,
    user_id: user!.id,
    type:    'activity',
    payload: { kind: parsed.data!.kind, note: parsed.data!.note ?? null },
  })

  // Devolve o evento recem-criado pra UI prepender sem recarregar a timeline.
  const { data: ev } = await supabase
    .from('lead_events')
    .select('id, type, payload, created_at, user_id, profiles(name, avatar_url)')
    .eq('lead_id', leadId!)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return ev
})
