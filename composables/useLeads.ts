// composables/useLeads.ts
// Estado global de leads compartilhado entre pipeline, follow-up e cockpit.
//
// PADRÃO DE USO CORRETO:
//
//   ✅ Em PÁGINAS — garante dados antes da primeira renderização:
//      const { data: leads, pending } = await useAsyncData<LeadWithFU[]>(
//        'leads-global', () => $fetch('/api/leads'), { default: () => [] }
//      )
//      const { toggleFU, patchStatus, ... } = useLeads()  // só os métodos
//
//   ✅ Em COMPONENTES FILHOS / outros composables:
//      const { leads, toggleFU, ... } = useLeads()         // lê o cache
//
//   ❌ NUNCA faça isso numa página:
//      const { leads } = useLeads()   // sem await = `leads` começa vazio

import type { Lead, Followup, LeadStatus } from '~/types'

export type LeadWithFU = Lead & { followups: Followup[] }

export const useLeads = () => {
  // useAsyncData com a mesma chave reutiliza o ref já populado pelo
  // await na página — sem disparar nova requisição.
  const { data: leads, refresh, pending } = useAsyncData<LeadWithFU[]>(
    'leads-global',
    () => $fetch('/api/leads'),
    { default: () => [] as LeadWithFU[] }
  )

  // ── Helpers ────────────────────────────────────────────────────────
  function findLead(id: string) {
    return leads.value?.find(l => l.id === id) ?? null
  }

  // ── Toggle follow-up (optimistic + rollback) ───────────────────────
  async function toggleFU(leadId: string, attemptIndex: number) {
    const lead = findLead(leadId)
    const fu   = lead?.followups.find(f => f.attempt_index === attemptIndex)
    if (!fu) return

    const wasCompleted = !!fu.completed_at
    fu.completed_at = wasCompleted ? null : new Date().toISOString()

    try {
      await $fetch(`/api/leads/${leadId}/followup`, {
        method: 'PATCH',
        body: { attempt_index: attemptIndex, completed: !wasCompleted },
      })
    } catch (err) {
      fu.completed_at = wasCompleted ? fu.completed_at : null
      throw err
    }
  }

  // ── Patch status (optimistic + rollback) ───────────────────────────
  async function patchStatus(leadId: string, resultado: LeadStatus) {
    const lead = findLead(leadId)
    const prev = lead?.resultado
    if (lead) lead.resultado = resultado
    try {
      await $fetch(`/api/leads/${leadId}`, { method: 'PATCH', body: { resultado } })
    } catch (err) {
      if (lead && prev) lead.resultado = prev
      throw err
    }
  }

  // ── Patch genérico (detail panel) ──────────────────────────────────
  async function patchLead(leadId: string, payload: Partial<Lead>) {
    const updated = await $fetch<Lead>(`/api/leads/${leadId}`, {
      method: 'PATCH',
      body: payload,
    })
    const idx = leads.value?.findIndex(l => l.id === leadId) ?? -1
    if (idx >= 0 && leads.value) {
      leads.value[idx] = { ...leads.value[idx], ...updated }
    }
    return updated
  }

  // ── Criar lead ─────────────────────────────────────────────────────
  async function createLead(payload: Partial<Lead>) {
    const data = await $fetch<LeadWithFU>('/api/leads', { method: 'POST', body: payload })
    leads.value = [data, ...(leads.value ?? [])]
    return data
  }

  // ── Remover lead ───────────────────────────────────────────────────
  async function deleteLead(id: string) {
    await $fetch(`/api/leads/${id}`, { method: 'DELETE' })
    leads.value = leads.value?.filter(l => l.id !== id) ?? []
  }

  // ── Exportar CSV ───────────────────────────────────────────────────
  function exportCSV() {
    if (!leads.value?.length) return
    const headers = [
      'Decisor', 'Empresa', 'Telefone', 'Instagram', 'Status',
      'Data Retorno', 'Reunião', 'FU Feitos', 'Num. Vendedores',
      'Ponte', 'Informações', 'Cadastrado em',
    ]
    const rows = leads.value.map(l => [
      l.decisor,
      l.negocio          ?? '',
      l.telefone         ?? '',
      l.instagram        ?? '',
      l.resultado,
      l.data_retorno     ?? '',
      l.reuniao_agendada  ? 'Sim' : 'Não',
      (l.followups ?? []).filter(f => f.completed_at).length,
      l.num_vendedores   ?? '',
      l.nome_ponte       ?? '',
      l.info             ?? '',
      new Date(l.created_at).toLocaleDateString('pt-BR'),
    ])
    const escape = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
    const csv    = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
    const blob   = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url    = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), {
      href: url,
      download: `leads_${new Date().toISOString().slice(0, 10)}.csv`,
    }).click()
    URL.revokeObjectURL(url)
  }

  // ── Computeds ──────────────────────────────────────────────────────
  const activeLeads = computed(() =>
    (leads.value ?? []).filter(l =>
      !['Fechado', 'Recusado', 'Sem interesse'].includes(l.resultado)
    )
  )

  const overdueLeads = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return activeLeads.value.filter(l => {
      if (!l.data_retorno) return false
      return new Date(l.data_retorno).getTime() < today.getTime()
    })
  })

  return {
    leads,
    pending,
    refresh,
    activeLeads,
    overdueLeads,
    toggleFU,
    patchStatus,
    patchLead,
    createLead,
    deleteLead,
    exportCSV,
  }
}