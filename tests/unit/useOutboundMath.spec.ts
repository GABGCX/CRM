import { ref } from 'vue'
import { describe, it, expect } from 'vitest'
import { useOutboundMath, OUTBOUND_BENCHMARKS } from '../../composables/useOutboundMath'

describe('useOutboundMath', () => {
  const { TX_CE_RM, TX_RM_RR, TX_RR_FR, TX_LD_CE, WORKDAYS } = OUTBOUND_BENCHMARKS

  it('calcula fechamentos necessários corretamente', () => {
    const meta = ref(100_000)
    const ticket = ref(2_000)
    const { fechNec } = useOutboundMath(meta, ticket)
    expect(fechNec.value).toBe(50) // 100000 / 2000
  })

  it('calcula ligações necessárias (ldNec) com base nos benchmarks', () => {
    const meta = ref(20_000)
    const ticket = ref(2_000)
    const { fechNec, rrNec, rmNec, ceNec, ldNec } = useOutboundMath(meta, ticket)

    const expectedFech = Math.ceil(20_000 / 2_000)            // 10
    const expectedRr   = Math.ceil(expectedFech / TX_RR_FR)   // 25
    const expectedRm   = Math.ceil(expectedRr   / TX_RM_RR)   // 63
    const expectedCe   = Math.ceil(expectedRm   / TX_CE_RM)   // 2334
    const expectedLd   = Math.ceil(expectedCe   / TX_LD_CE)   // 5187

    expect(fechNec.value).toBe(expectedFech)
    expect(rrNec.value).toBe(expectedRr)
    expect(rmNec.value).toBe(expectedRm)
    expect(ceNec.value).toBe(expectedCe)
    expect(ldNec.value).toBe(expectedLd)
  })

  it('valores diários são derivados dos mensais divididos por dias úteis', () => {
    const meta = ref(44_000)
    const ticket = ref(2_000)
    const { ceNec, cePerDay } = useOutboundMath(meta, ticket)
    expect(cePerDay.value).toBe(Math.ceil(ceNec.value / WORKDAYS))
  })

  it('é reativo — atualiza quando meta muda', () => {
    const meta = ref(10_000)
    const ticket = ref(1_000)
    const { fechNec } = useOutboundMath(meta, ticket)

    expect(fechNec.value).toBe(10)
    meta.value = 50_000
    expect(fechNec.value).toBe(50)
  })

  it('trata ticket zero sem divisão por zero', () => {
    const meta = ref(100_000)
    const ticket = ref(0)
    const { fechNec } = useOutboundMath(meta, ticket)
    // Não deve lançar erro; deve retornar algum valor finito
    expect(Number.isFinite(fechNec.value)).toBe(true)
  })

  it('projections tem 7 itens', () => {
    const { projections } = useOutboundMath(ref(50_000), ref(2_000))
    expect(projections.value).toHaveLength(7)
  })

  it('mathChain tem 7 itens', () => {
    const { mathChain } = useOutboundMath(ref(50_000), ref(2_000))
    expect(mathChain.value).toHaveLength(7)
  })
})
