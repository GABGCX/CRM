import type { Lead } from '~/types'

export function calcLeadScore(lead: Lead): number {
  let score = 0

  // Porte da empresa (0-30)
  if (lead.porte === 'grande')   score += 30
  else if (lead.porte === 'media')   score += 20
  else if (lead.porte === 'pequena') score += 10

  // Fonte / canal de entrada (0-25)
  if (lead.fonte === 'indicacao')  score += 25
  else if (lead.fonte === 'linkedin') score += 15
  else if (lead.fonte === 'evento')   score += 15
  else if (lead.fonte === 'cold_call') score += 5

  // Número de vendedores (tamanho do time comercial) (0-20)
  const nv = lead.num_vendedores ?? 0
  if (nv > 10)      score += 20
  else if (nv >= 5) score += 10
  else if (nv >= 1) score += 5

  // Dados de contato / qualificacao preenchidos
  if (lead.segmento)  score += 10
  if (lead.telefone)  score += 10

  // Engajamento (reuniao agendada e bonus)
  if (lead.reuniao_agendada) score += 5

  return Math.min(score, 100)
}

export function leadScoreLabel(score: number): string {
  if (score >= 70) return 'alto'
  if (score >= 40) return 'medio'
  return 'baixo'
}

export function leadScoreColor(score: number): string {
  if (score >= 70) return '#16a34a'
  if (score >= 40) return '#d97706'
  return '#dc2626'
}

export function leadScoreBg(score: number): string {
  if (score >= 70) return '#f0fdf4'
  if (score >= 40) return '#fffbeb'
  return '#fef2f2'
}
