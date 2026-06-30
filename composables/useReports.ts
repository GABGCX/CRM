// composables/useReports.ts
// Camada de DADOS dos Relatorios: estado de periodo, resolucao de range e os
// fetches dos ~14 endpoints de /api/reports. Cada relatorio tem seu proprio ref
// (renderizacao progressiva: cada secao preenche sozinha). A pagina mantem só os
// computeds de apresentacao (que consomem estes refs) e o template/charts.

import type { Profile } from '~/types'

export interface FunnelRow { month: string; ld: number; ce: number; rm: number; rr: number; fr: number }
export interface DayRow { date: string; ld: number; ce: number; rm: number; rr: number; fr: number }

export const useReports = () => {
  const { profile, org } = useProfile()

  // ── Periodo ─────────────────────────────────────────────────────────────
  const months        = ref(6)
  const mode          = ref<'preset' | 'custom'>('preset')
  const _now          = new Date()
  const todayStr      = localDateISO(_now)
  const monthStartStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-01`
  const customFrom    = ref(monthStartStr)
  const customTo      = ref(todayStr)
  const selectedUser  = ref('')
  const granularity   = ref<'auto' | 'day' | 'week' | 'month'>('auto')

  function setPreset(v: number) { months.value = v; mode.value = 'preset' }

  const fmtDay = (s: string) => s
    ? new Date(s + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : ''
  const periodLabel = computed(() =>
    mode.value === 'custom' && customFrom.value && customTo.value
      ? `${fmtDay(customFrom.value)} a ${fmtDay(customTo.value)}`
      : months.value === 12 ? '1 ano' : `${months.value} meses`
  )

  function resolveRange(): { from: string; to: string } {
    if (mode.value === 'custom' && customFrom.value && customTo.value) {
      return { from: customFrom.value, to: customTo.value }
    }
    const c = new Date(); c.setMonth(c.getMonth() - months.value + 1); c.setDate(1)
    return { from: localDateISO(c), to: todayStr }
  }
  function prevRange(r: { from: string; to: string }) {
    const fromD = new Date(r.from + 'T00:00:00'); const toD = new Date(r.to + 'T00:00:00')
    const lenDays = Math.round((toD.getTime() - fromD.getTime()) / 86_400_000) + 1
    const prevTo = new Date(fromD); prevTo.setDate(prevTo.getDate() - 1)
    const prevFrom = new Date(prevTo); prevFrom.setDate(prevFrom.getDate() - (lenDays - 1))
    return { from: localDateISO(prevFrom), to: localDateISO(prevTo) }
  }
  function paramsFor(r: { from: string; to: string }) {
    const p = new URLSearchParams({ from: r.from, to: r.to })
    if (selectedUser.value) p.set('user_id', selectedUser.value)
    return p
  }

  // ── Dados (um ref por secao) ────────────────────────────────────────────
  const funnelData   = ref<FunnelRow[]>([])
  const funnelPrev   = ref<FunnelRow[]>([])
  const activityData = ref<DayRow[]>([])
  const statusData   = ref<{ status: string; count: number }[]>([])
  const lossData     = ref<{ reason: string; count: number }[]>([])
  const sourceData   = ref<{ fonte: string; total: number; advanced: number; won: number }[]>([])
  const bdrData      = ref<{ user_id: string; ld: number; ce: number; rm: number; rr: number; fr: number }[]>([])
  const revenue      = ref({ closedValue: 0, closedCount: 0, pipelineValue: 0, weightedForecast: 0, activeWithValue: 0 })
  const fuDrop       = ref<{ totalLeads: number; completedByAttempt: number[] }>({ totalLeads: 0, completedByAttempt: [] })
  const agingData    = ref<{ label: string; count: number }[]>([])
  const velocity     = ref<{ cycleDays: number; cycleCount: number; transitions: number; stages: { stage: string; avgDays: number; count: number }[] }>({ cycleDays: 0, cycleCount: 0, transitions: 0, stages: [] })
  const cohortData   = ref<{ month: string; total: number; reuniao: number; proposta: number; won: number }[]>([])
  const waterfall    = ref({ created: 0, advanced: 0, won: 0, lost: 0 })
  const pipeHistory  = ref<{ date: string; count: number; value: number }[]>([])
  const loading      = ref(false)
  const membersList  = ref<(Profile & { email: string })[]>([])

  // Range-dependentes: refazem ao trocar periodo/usuario.
  async function loadAll() {
    loading.value = true
    const r = resolveRange()
    const p = paramsFor(r); const pp = paramsFor(prevRange(r))
    try {
      const tasks: Promise<any>[] = [
        $fetch<FunnelRow[]>(`/api/reports/funnel?${p}`).then(d => funnelData.value = d),
        $fetch<FunnelRow[]>(`/api/reports/funnel?${pp}`).then(d => funnelPrev.value = d),
        $fetch<DayRow[]>(`/api/reports/activity?${p}`).then(d => activityData.value = d),
        $fetch<any[]>(`/api/reports/leads-by-status?${p}`).then(d => statusData.value = d.sort((a, b) => b.count - a.count)),
        $fetch<any[]>(`/api/reports/loss-reasons?${p}`).then(d => lossData.value = d),
        $fetch<any[]>(`/api/reports/by-source?${p}`).then(d => sourceData.value = d),
        $fetch<any>(`/api/reports/revenue?${p}`).then(d => revenue.value = d),
        $fetch<any>(`/api/reports/velocity?${p}`).then(d => velocity.value = d),
        $fetch<any[]>(`/api/reports/cohort?${p}`).then(d => cohortData.value = d),
        $fetch<any>(`/api/reports/waterfall?${p}`).then(d => waterfall.value = d),
        $fetch<any[]>(`/api/reports/pipeline-history?${p}`).then(d => pipeHistory.value = d),
      ]
      if (profile.value?.role !== 'bdr' && !selectedUser.value) {
        tasks.push($fetch<any[]>(`/api/reports/by-bdr?${p}`).then(d => bdrData.value = d))
      } else { bdrData.value = [] }
      await Promise.all(tasks)
    } catch { /* silencioso */ }
    finally { loading.value = false }
  }

  // Independentes do range (carregam uma vez no mount).
  onMounted(async () => {
    if (profile.value?.role !== 'bdr') {
      try { membersList.value = await $fetch<(Profile & { email: string })[]>('/api/settings/members') } catch {}
    }
    const url = (s: string) => s // evita a inferencia de rota tipada (excessive stack depth)
    try { fuDrop.value = await $fetch<{ totalLeads: number; completedByAttempt: number[] }>(url('/api/reports/followups')) } catch {}
    try { agingData.value = await $fetch<{ label: string; count: number }[]>(url('/api/reports/aging')) } catch {}
  })

  watch([months, selectedUser, mode, customFrom, customTo], () => loadAll(), { immediate: true })

  return {
    org, profile,
    months, mode, todayStr, monthStartStr, customFrom, customTo, selectedUser, granularity,
    setPreset, fmtDay, periodLabel, resolveRange, prevRange, paramsFor, loadAll,
    funnelData, funnelPrev, activityData, statusData, lossData, sourceData, bdrData,
    revenue, fuDrop, agingData, velocity, cohortData, waterfall, pipeHistory, loading, membersList,
  }
}
