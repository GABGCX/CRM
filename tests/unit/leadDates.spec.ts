import { describe, it, expect } from 'vitest'
import { localDateISO, daysUntil } from '../../utils/leadDomain'

// Regressao: datas eram derivadas de toISOString() (UTC), o que dava o dia
// seguinte a noite em fusos negativos (BRT = UTC-3), e daysUntil comparava
// meia-noite local contra new Date("YYYY-MM-DD") (parse UTC), gerando
// off-by-one (retorno de hoje virava "vencido", amanha virava "hoje").

describe('localDateISO', () => {
  it('formata a data LOCAL (Y-M-D), nunca UTC', () => {
    // 27/06 23:30 local -> toISOString() daria 2026-06-28 num fuso negativo
    expect(localDateISO(new Date(2026, 5, 27, 23, 30, 0))).toBe('2026-06-27')
  })

  it('faz zero-pad em mes e dia', () => {
    expect(localDateISO(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('daysUntil (calendario local, sem off-by-one de fuso)', () => {
  // Gera a string de data local com N dias de offset a partir de hoje.
  const iso = (offsetDays: number) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + offsetDays)
    return localDateISO(d)
  }

  it('hoje => 0 (nao -1)', () => expect(daysUntil(iso(0))).toBe(0))
  it('amanha => 1 (nao 0)', () => expect(daysUntil(iso(1))).toBe(1))
  it('ontem => -1', () => expect(daysUntil(iso(-1))).toBe(-1))
  it('daqui a 3 dias => 3', () => expect(daysUntil(iso(3))).toBe(3))
  it('null => null', () => expect(daysUntil(null)).toBeNull())
})
