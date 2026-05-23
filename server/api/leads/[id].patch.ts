import { serverSupabaseClient } from "#supabase/server"
// server/api/leads/[id].patch.ts
import { z } from 'zod'

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
})

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success)
    throw createError({ statusCode: 400, message: parsed.error.errors[0].message })

  const { data, error } = await supabase
    .from('leads')
    .update(parsed.data)
    .eq('id', id!)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
