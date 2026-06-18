import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { insertLeadEvent } from '../../utils/leadEvents'
import { throwApiError } from '../../utils/apiError'

const schema = z.object({
  decisor:          z.string().min(1).optional(),
  telefone:         z.string().optional().nullable(),
  negocio:          z.string().optional().nullable(),
  instagram:        z.string().optional().nullable(),
  num_vendedores:   z.number().optional().nullable(),
  nome_ponte:       z.string().optional().nullable(),
  resultado:        z.string().optional(),
  data_retorno:     z.string().optional().nullable(),
  reuniao_agendada: z.boolean().optional(),
  turno:            z.string().optional().nullable(),
  horario:          z.string().optional().nullable(),
  info:             z.string().optional().nullable(),
  fonte:            z.enum(['cold_call','linkedin','indicacao','evento','outro']).optional().nullable(),
  segmento:         z.string().optional().nullable(),
  cidade:           z.string().optional().nullable(),
  estado:           z.string().max(2).optional().nullable(),
  porte:            z.enum(['micro','pequena','media','grande']).optional().nullable(),
  proposta_url:       z.string().url().optional().nullable(),
  cadence_id:         z.string().uuid().optional().nullable(),
  cadence_started_at: z.string().optional().nullable(),
  motivo_perda:       z.string().optional().nullable(),
  valor_estimado:     z.number().optional().nullable(),
  tag_ids:            z.array(z.string().uuid()).optional(),
})

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const id   = getRouterParam(event, 'id')
  const body = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success)
    throwApiError('VALIDATION', parsed.error.errors[0].message)

  const { data: before } = await supabase
    .from('leads').select('resultado, org_id').eq('id', id!).single()

  const { data, error } = await supabase
    .from('leads')
    .update(parsed.data!)
    .eq('id', id!)
    .select()
    .single()

  if (error) throwApiError('INTERNAL', error.message)

  const { data: { user } } = await supabase.auth.getUser()
  if (before && user) {
    const isStatusChange = parsed.data!.resultado && parsed.data!.resultado !== before.resultado
    await insertLeadEvent(event, {
      lead_id: id!,
      org_id:  before.org_id,
      user_id: user.id,
      type:    isStatusChange ? 'status_change' : 'field_update',
      payload: isStatusChange
        ? { from: before.resultado, to: parsed.data!.resultado }
        : { fields: Object.keys(parsed.data!) },
    })
  }

  return data
})
