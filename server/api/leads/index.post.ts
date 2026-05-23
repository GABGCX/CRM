import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'

const schema = z.object({
  decisor:          z.string().min(1),
  telefone:         z.string().optional().nullable(),
  negocio:          z.string().optional().nullable(),
  instagram:        z.string().optional().nullable(),
  num_vendedores:   z.number().optional().nullable(),
  nome_ponte:       z.string().optional().nullable(),
  resultado:        z.string().default('Aguardando retorno'),
  data_retorno:     z.string().optional().nullable(),
  reuniao_agendada: z.boolean().default(false),
  turno:            z.string().optional().nullable(),
  horario:          z.string().optional().nullable(),
  info:             z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const body          = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success)
    throw createError({ statusCode: 400, message: parsed.error.errors[0].message })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw createError({ statusCode: 401, message: 'Não autenticado' })

  // Service role ignora RLS — seguro para lookup interno de perfil
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id, org_id').eq('id', user.id).single()
  if (!profile) throw createError({ statusCode: 403, message: 'Perfil não encontrado' })

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({ ...parsed.data, org_id: profile.org_id, owner_id: profile.id })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Criar 10 slots de follow-up
  await supabaseAdmin.from('followups').insert(
    Array.from({ length: 10 }, (_, i) => ({
      lead_id: lead.id,
      org_id:  profile.org_id,
      attempt_index: i,
      completed_at:  null,
    }))
  )

  return lead
})
