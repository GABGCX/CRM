import { serverSupabaseClient } from '#supabase/server'

// Envelhecimento dos leads ativos: ha quantos dias sem atualizacao. Receita travada.
const TERMINAL = ['Fechado', 'Recusado', 'Sem interesse']

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('leads')
    .select('resultado, updated_at')
    .not('resultado', 'in', `(${TERMINAL.map(s => `"${s}"`).join(',')})`)

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Buckets de idade (dias desde a ultima atualizacao)
  const buckets = [
    { label: '0-7 dias',  min: 0,  max: 7,   count: 0 },
    { label: '8-15 dias', min: 8,  max: 15,  count: 0 },
    { label: '16-30 dias',min: 16, max: 30,  count: 0 },
    { label: '31+ dias',  min: 31, max: Infinity, count: 0 },
  ]
  const now = Date.now()
  for (const row of data ?? []) {
    const days = Math.floor((now - new Date(row.updated_at).getTime()) / 86_400_000)
    const b = buckets.find(b => days >= b.min && days <= b.max)
    if (b) b.count++
  }

  return buckets.map(({ label, count }) => ({ label, count }))
})
