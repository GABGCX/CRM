import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { throwApiError } from '../../utils/apiError'

const VALID_FONTES  = ['cold_call', 'linkedin', 'indicacao', 'evento', 'outro']
const VALID_PORTES  = ['micro', 'pequena', 'media', 'grande']
const VALID_RESULTS = [
  'Aguardando retorno', 'Follow-up', 'De molho', 'Reunião agendada',
  'Enviar proposta', 'Proposta enviada', 'Fechado', 'Recusado',
  'Sem interesse', 'Não atende',
]

export default defineEventHandler(async (event) => {
  const supabase      = await serverSupabaseClient(event)
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const { rows }      = await readBody(event)

  if (!Array.isArray(rows) || rows.length === 0)
    throwApiError('VALIDATION', 'Nenhuma linha recebida.')
  if (rows.length > 500)
    throwApiError('VALIDATION', 'Maximo de 500 leads por importacao.')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id, org_id').eq('id', user!.id).single()
  if (!profile) throwApiError('FORBIDDEN')

  const toInsert = rows.map((r: Record<string, string>) => ({
    org_id:        profile.org_id,
    owner_id:      profile.id,
    decisor:       String(r.decisor || '').trim(),
    telefone:      r.telefone ? String(r.telefone).trim() : null,
    negocio:       r.negocio  ? String(r.negocio).trim()  : null,
    instagram:     r.instagram ? String(r.instagram).trim() : null,
    nome_ponte:    r.nome_ponte ? String(r.nome_ponte).trim() : null,
    segmento:      r.segmento  ? String(r.segmento).trim()  : null,
    cidade:        r.cidade    ? String(r.cidade).trim()    : null,
    estado:        r.estado    ? String(r.estado).slice(0, 2).trim() : null,
    num_vendedores: r.num_vendedores ? Number(r.num_vendedores) || null : null,
    fonte:     VALID_FONTES.includes(r.fonte)  ? r.fonte  : null,
    porte:     VALID_PORTES.includes(r.porte)  ? r.porte  : null,
    resultado: VALID_RESULTS.includes(r.resultado) ? r.resultado : 'Aguardando retorno',
    reuniao_agendada: false,
  })).filter(r => r.decisor.length > 0)

  if (!toInsert.length)
    throwApiError('VALIDATION', 'Nenhuma linha valida (coluna "decisor" obrigatoria).')

  // Batch insert, ignorar duplicatas de telefone (constraint unica por org+telefone)
  const { data: inserted, error } = await supabaseAdmin
    .from('leads')
    .insert(toInsert)
    .select('id, org_id')

  if (error && error.code !== '23505') throwApiError('INTERNAL', error.message)

  const created = inserted?.length ?? 0
  const skipped = toInsert.length - created

  // Criar followups para os leads inseridos
  if (inserted && inserted.length > 0) {
    const followups = inserted.flatMap(lead =>
      Array.from({ length: 10 }, (_, i) => ({
        lead_id: lead.id,
        org_id:  lead.org_id,
        attempt_index: i,
        completed_at: null,
      }))
    )
    await supabaseAdmin.from('followups').insert(followups)
  }

  return { created, skipped, total: toInsert.length }
})
