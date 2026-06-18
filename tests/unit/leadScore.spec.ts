import { describe, it, expect } from 'vitest'
import { calcLeadScore, leadScoreLabel, leadScoreColor } from '../../utils/leadScore'
import type { Lead } from '../../types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'test',
    org_id: 'org',
    owner_id: 'user',
    decisor: 'Joao',
    telefone: null,
    negocio: null,
    instagram: null,
    num_vendedores: null,
    nome_ponte: null,
    resultado: 'Aguardando retorno',
    data_retorno: null,
    reuniao_agendada: false,
    turno: null,
    horario: null,
    info: null,
    fonte: null,
    segmento: null,
    cidade: null,
    estado: null,
    porte: null,
    proposta_url: null,
    cadence_id: null,
    cadence_started_at: null,
    motivo_perda: null,
    valor_estimado: null,
    tag_ids: [],
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  }
}

describe('calcLeadScore', () => {
  it('retorna 0 para lead sem dados de qualificacao', () => {
    expect(calcLeadScore(makeLead())).toBe(0)
  })

  it('soma porte grande corretamente', () => {
    expect(calcLeadScore(makeLead({ porte: 'grande' }))).toBe(30)
  })

  it('soma fonte indicacao corretamente', () => {
    expect(calcLeadScore(makeLead({ fonte: 'indicacao' }))).toBe(25)
  })

  it('score maximo e 100', () => {
    const lead = makeLead({
      porte: 'grande',
      fonte: 'indicacao',
      num_vendedores: 15,
      segmento: 'SaaS',
      telefone: '11999999999',
      reuniao_agendada: true,
    })
    expect(calcLeadScore(lead)).toBe(100)
  })

  it('lead de alto valor tem score >= 70', () => {
    const lead = makeLead({
      porte: 'grande',
      fonte: 'indicacao',
      num_vendedores: 8,
      telefone: '11999999999',
    })
    expect(calcLeadScore(lead)).toBeGreaterThanOrEqual(70)
  })

  it('cold_call sem dados ICP tem score baixo', () => {
    const lead = makeLead({ fonte: 'cold_call' })
    expect(calcLeadScore(lead)).toBeLessThan(40)
  })

  it('leadScoreLabel retorna alto para score >= 70', () => {
    expect(leadScoreLabel(75)).toBe('alto')
    expect(leadScoreLabel(40)).toBe('medio')
    expect(leadScoreLabel(10)).toBe('baixo')
  })

  it('leadScoreColor retorna verde para score alto', () => {
    expect(leadScoreColor(80)).toBe('#16a34a')
    expect(leadScoreColor(50)).toBe('#d97706')
    expect(leadScoreColor(20)).toBe('#dc2626')
  })
})
