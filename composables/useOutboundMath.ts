// composables/useOutboundMath.ts
// Centraliza TODA a matemática reversa do outbound.
// Substitui código duplicado em matematica.vue, configuracoes.vue e dashboard/index.vue.

import type { Ref, ComputedRef } from 'vue'

export const OUTBOUND_BENCHMARKS = {
  TX_CE_RM:  0.027,  // 2.7 % contatos → reunião marcada
  TX_RM_RR:  0.40,   // 40 % reunião marcada → realizada
  TX_RR_FR:  0.40,   // 40 % reunião realizada → fechamento
  TX_LD_CE:  0.45,   // 45 % ligações → contato efetivo
  WORKDAYS:  22,
} as const

export const useOutboundMath = (
  metaMensal:  Ref<number> | ComputedRef<number>,
  ticketMedio: Ref<number> | ComputedRef<number>
) => {
  const { TX_CE_RM, TX_RM_RR, TX_RR_FR, TX_LD_CE, WORKDAYS } = OUTBOUND_BENCHMARKS

  // ── Números necessários no mês ─────────────────────────────────────────
  const fechNec = computed(() => Math.ceil(unref(metaMensal) / (unref(ticketMedio) || 1)))
  const rrNec   = computed(() => Math.ceil(fechNec.value / TX_RR_FR))
  const rmNec   = computed(() => Math.ceil(rrNec.value   / TX_RM_RR))
  const ceNec   = computed(() => Math.ceil(rmNec.value   / TX_CE_RM))
  const ldNec   = computed(() => Math.ceil(ceNec.value   / TX_LD_CE))

  // ── Metas diárias ─────────────────────────────────────────────────────
  const cePerDay = computed(() => Math.ceil(ceNec.value   / WORKDAYS))
  const rmPerDay = computed(() => Math.max(1, Math.ceil(rmNec.value / WORKDAYS)))
  const rrPerDay = computed(() => Math.max(1, Math.ceil(rrNec.value / WORKDAYS)))
  const ldPerDay = computed(() => Math.ceil(ldNec.value   / WORKDAYS))

  // ── Cadeia completa para renderização (matematica.vue) ─────────────────
  const mathChain = computed(() => [
    {
      label: 'Meta de faturamento',
      value: `R$ ${unref(metaMensal).toLocaleString('pt-BR')}`,
      note: '', rate: null, perDay: null,
    },
    {
      label: 'Ticket médio',
      value: `R$ ${unref(ticketMedio).toLocaleString('pt-BR')}`,
      note: '', rate: null, perDay: null,
    },
    {
      label: 'Fechamentos',
      value: fechNec.value,
      note: 'contratos assinados',
      rate: `taxa RR→FR ${(TX_RR_FR * 100).toFixed(0)}%`,
      perDay: null,
    },
    {
      label: 'Reuniões realizadas',
      value: rrNec.value,
      note: 'sessões estratégicas',
      rate: `taxa RM→RR ${(TX_RM_RR * 100).toFixed(0)}%`,
      perDay: `${rrPerDay.value}`,
    },
    {
      label: 'Reuniões marcadas',
      value: rmNec.value,
      note: 'agendamentos confirmados',
      rate: `taxa CE→RM ${(TX_CE_RM * 100).toFixed(1)}%`,
      perDay: `${rmPerDay.value}`,
    },
    {
      label: 'Contatos efetivos',
      value: ceNec.value,
      note: 'decisores que atenderam',
      rate: `taxa LD→CE ${(TX_LD_CE * 100).toFixed(0)}%`,
      perDay: `${cePerDay.value}`,
    },
    {
      label: 'Ligações discadas',
      value: ldNec.value,
      note: 'total de tentativas no mês',
      rate: null,
      perDay: `${ldPerDay.value}`,
    },
  ])

  // ── Projeções para configuracoes.vue ───────────────────────────────────
  const projections = computed(() => [
    { label: 'Fechamentos / mês',         value: fechNec.value },
    { label: 'Reuniões realizadas / mês', value: rrNec.value },
    { label: 'Reuniões marcadas / mês',   value: rmNec.value },
    { label: 'Contatos efetivos / mês',   value: ceNec.value },
    { label: 'Ligações discadas / mês',   value: ldNec.value },
    { label: 'CE por dia útil',           value: cePerDay.value },
    { label: 'Ligações por dia útil',     value: ldPerDay.value },
  ])

  return {
    // Valores mensais
    fechNec, rrNec, rmNec, ceNec, ldNec,
    // Valores diários
    cePerDay, rmPerDay, rrPerDay, ldPerDay,
    // Dados estruturados
    mathChain, projections,
    // Constantes expostas para quem precisar
    ...OUTBOUND_BENCHMARKS,
  }
}
