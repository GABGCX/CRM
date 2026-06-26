import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { insertLeadEvent } from '../../utils/leadEvents'
import { throwApiError } from '../../utils/apiError'
import { numericOptional } from '../../utils/zodHelpers'

const schema = z.object({
  decisor:          z.string().min(1),
  telefone:         z.string().optional().nullable(),
  negocio:          z.string().optional().nullable(),
  instagram:        z.string().optional().nullable(),
  num_vendedores:   numericOptional,
  nome_ponte:       z.string().optional().nullable(),
  resultado:        z.string().default('Aguardando retorno'),
  data_retorno:     z.string().optional().nullable(),
  reuniao_agendada: z.boolean().default(false),
  turno:            z.string().optional().nullable(),
  horario:          z.string().optional().nullable(),
  info:             z.string().optional().nullable(),
  fonte:            z.enum(['cold_call','linkedin','indicacao','evento','outro']).optional().nullable(),
  segmento:         z.string().optional().nullable(),
  cidade:           z.string().optional().nullable(),
  estado:           z.string().max(2).optional().nullable(),
  porte:              z.enum(['micro','pequena','media','grande']).optional().nullable(),
  cadence_id:         z.string().uuid().optional().nullable(),
  cadence_started_at: z.string().optional().nullable(),
  motivo_perda:       z.string().optional().nullable(),
  valor_estimado:     numericOptional,
  tag_ids:            z.array(z.string().uuid()).optional(),
})

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const body          = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success)
    throwApiError('VALIDATION', parsed.error.errors[0].message)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id, org_id').eq('id', user!.id).single()
  if (!profile) throwApiError('FORBIDDEN', 'Perfil não encontrado')

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({ ...parsed.data!, org_id: profile!.org_id, owner_id: profile!.id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await supabaseAdmin
        .from('leads')
        .select('id, decisor')
        .eq('org_id', profile!.org_id)
        .eq('telefone', parsed.data!.telefone!)
        .single()
      throwApiError('DUPLICATE_PHONE', 'Já existe um lead com este telefone.', {
        existingId: existing?.id,
        existingName: existing?.decisor,
      })
    }
    throwApiError('INTERNAL', error.message)
  }

  await supabaseAdmin.from('followups').insert(
    Array.from({ length: 10 }, (_, i) => ({
      lead_id: lead!.id,
      org_id:  profile!.org_id,
      attempt_index: i,
      completed_at:  null,
    }))
  )

  await insertLeadEvent(event, {
    lead_id: lead!.id,
    org_id:  profile!.org_id,
    user_id: profile!.id,
    type:    'created',
    payload: { decisor: lead!.decisor },
  })

  return lead
})
