<template>
  <div class="dash">
    <header class="dash-head">
      <div>
        <h1 class="dash-greet">{{ greeting }}, <span class="text-gradient">{{ firstName }}</span></h1>
        <p class="dash-date">{{ todayLabel }} · semana {{ currentWeek }} de 4</p>
      </div>
      <div class="dash-head-right">
        <select v-if="canFilterUsers && orgMembers?.length" v-model="selectedUserId" class="dash-select">
          <option :value="null">Toda equipe</option>
          <option v-for="m in orgMembers" :key="m.id" :value="m.id">{{ m.name || m.id.slice(0,8) }}</option>
        </select>
        <div class="dash-days">
          <span class="dash-days-n"><UiCountUp :value="workdaysLeft" /></span>
          <span class="dash-days-l">dias úteis restantes</span>
        </div>
      </div>
    </header>

    <div class="grid">
      <!-- Foco agora -->
      <section class="tile t-focus" v-tilt="4">
        <div class="tile-head">
          <svg class="tile-ic" viewBox="0 0 24 24" v-html="ICON.target" />
          <span>Foco agora</span>
          <span class="pill" :class="`is-${focusTone}`" style="margin-left:auto">{{ focusToneLabel }}</span>
        </div>
        <h2 class="focus-title">{{ focusAction.title }}</h2>
        <p class="focus-desc">{{ focusAction.sub }}</p>
        <NuxtLink :to="focusAction.to" class="btn btn-primary focus-cta">
          {{ focusAction.cta }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </NuxtLink>
      </section>

      <!-- Gauge: meta de CE -->
      <section class="tile t-gauge" v-tilt="6">
        <div class="tile-head"><svg class="tile-ic" viewBox="0 0 24 24" v-html="ICON.gauge" /><span>Meta de CE</span></div>
        <div class="gauge-wrap">
          <svg viewBox="0 0 120 120" class="gauge-svg">
            <circle cx="60" cy="60" r="50" fill="none" style="stroke:var(--bg-subtle)" stroke-width="10" />
            <circle cx="60" cy="60" r="50" fill="none" stroke-width="10" stroke-linecap="round"
              :stroke-dasharray="GAUGE_C" :stroke-dashoffset="gaugeOffset" transform="rotate(-90 60 60)"
              :style="{ stroke: paceColor, transition:'stroke-dashoffset .5s' }" />
            <text x="60" y="58" text-anchor="middle" class="gauge-pct">{{ gaugePct }}%</text>
            <text x="60" y="76" text-anchor="middle" class="gauge-cap">da meta</text>
          </svg>
        </div>
        <div class="gauge-foot">
          <span class="tabular">{{ monthTotals.ce }}</span> de <span class="tabular">{{ ceNec }}</span> CE ·
          <span :style="{ color: paceColor }">{{ ceDelta >= 0 ? '+'+ceDelta : ceDelta }} vs ritmo</span>
        </div>
      </section>

      <!-- Funil do mês -->
      <section class="tile t-funnel">
        <div class="tile-head"><svg class="tile-ic" viewBox="0 0 24 24" v-html="ICON.funnel" /><span>Funil do mês</span><span class="tile-cap">{{ MONTH_NAMES[currentMonth-1] }}</span></div>
        <div v-if="!monthTotals.ld && !monthTotals.ce" class="empty-mini">Sem atividade registrada no mês.</div>
        <div v-else class="fn-bars">
          <template v-for="(row, i) in funnelRows" :key="row.key">
            <div v-if="i > 0" class="fn-gap">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="fn-chevron"><polyline points="6 9 12 15 18 9"/></svg>
              <span v-if="row.rate !== null" class="fn-rate tabular">{{ row.rate.toFixed(row.rate < 10 ? 1 : 0) }}%</span>
            </div>
            <div class="fn-row">
              <span class="fn-lbl">{{ row.label }}</span>
              <div class="fn-track">
                <div class="fn-fill" :style="{ width: row.pct + '%' }" />
              </div>
              <span class="fn-val tabular">{{ row.v.toLocaleString('pt-BR') }}</span>
            </div>
          </template>
        </div>
      </section>

      <!-- Lead quente -->
      <component :is="hottestLead ? 'NuxtLink' : 'section'"
        :to="hottestLead ? `/dashboard/pipeline?highlight=${hottestLead.id}` : undefined" class="tile t-hot" v-tilt="6">
        <div class="tile-head"><svg class="tile-ic" viewBox="0 0 24 24" v-html="ICON.flame" /><span>Lead mais quente</span></div>
        <template v-if="hottestLead">
          <div class="hot-name">{{ hottestLead.decisor }}</div>
          <div class="hot-company">{{ hottestLead.negocio || 'Sem empresa' }}</div>
          <div class="hot-spacer" />
          <div class="hot-value tabular">R$ <UiCountUp :value="hottestLead.valor_estimado || 0" /></div>
          <div class="hot-status"><span class="dot" /> {{ hottestLead.resultado }}</div>
        </template>
        <div v-else class="empty-mini" style="text-align:left">Nenhuma oportunidade aberta com valor.</div>
      </component>

      <!-- KPIs do mês com sparkline -->
      <section class="tile t-kpis">
        <div class="kpi-row">
          <div v-for="k in kpiStrip" :key="k.key" class="kpi">
            <div class="kpi-top">
              <svg class="kpi-ic" viewBox="0 0 24 24" v-html="k.icon" />
              <span class="kpi-name">{{ k.metric }}</span>
            </div>
            <div class="kpi-num tabular" :class="k.cls"><UiCountUp :value="k.value" /></div>
            <svg v-if="k.spark" class="kpi-spark" viewBox="0 0 64 20" preserveAspectRatio="none">
              <path :d="k.spark" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div v-else class="kpi-spark-empty" />
            <div class="kpi-sub">{{ k.label }}</div>
          </div>
        </div>
      </section>

      <!-- Registrar hoje -->
      <section class="tile t-reg">
        <div class="tile-head">
          <svg class="tile-ic" viewBox="0 0 24 24" v-html="ICON.edit" /><span>Registrar hoje</span>
          <div class="reg-actions">
            <span v-if="alreadySaved && !saving" class="saved-flag">salvo</span>
            <button class="btn btn-primary" :disabled="saving" @click="saveQuick">{{ saving ? 'Salvando...' : 'Salvar dia' }}</button>
          </div>
        </div>
        <div class="reg-grid">
          <label v-for="f in quickFields" :key="f.key" class="reg-cell">
            <span class="reg-cell-label">{{ f.label }}</span>
            <input type="number" min="0" v-model.number="quickForm[f.key]" class="reg-input tabular" />
            <span class="reg-cell-meta">meta {{ f.meta }}</span>
          </label>
        </div>
        <div class="reg-foot">CE&rarr;RM hoje <strong>{{ todayCERMRate }}%</strong> · mês <strong>{{ monthCERMRate }}%</strong> · <span class="hint">Ctrl+S salva</span></div>
      </section>

      <!-- Follow-ups hoje -->
      <section class="tile t-follow">
        <div class="tile-head"><svg class="tile-ic" viewBox="0 0 24 24" v-html="ICON.bell" /><span>Follow-ups hoje</span></div>
        <div v-if="!todayTasks.length" class="empty-mini" style="text-align:left">Nenhum retorno urgente.</div>
        <NuxtLink v-for="t in todayTasks" :key="t.id" to="/dashboard/followup" class="follow-row">
          <span class="follow-dot" :class="t.cls" />
          <span class="follow-name">{{ t.decisor }}</span>
          <span class="follow-sub">{{ t.sub }}</span>
        </NuxtLink>
        <NuxtLink to="/dashboard/followup" class="follow-all">Ver fila completa &rarr;</NuxtLink>
      </section>

      <!-- Ritmo -->
      <section class="tile t-ritmo">
        <div class="tile-head"><svg class="tile-ic" viewBox="0 0 24 24" v-html="ICON.activity" /><span>Ritmo do mês</span></div>
        <div v-for="r in paceRows" :key="r.label" class="pace-row">
          <div class="pace-row-head">
            <span>{{ r.label }}</span>
            <span class="tabular">{{ r.current }} / {{ r.target }}</span>
          </div>
          <div class="track"><div class="track-fill" :style="{ width: r.pct + '%', background: r.color }" /></div>
        </div>
      </section>

      <!-- Evolucao CE -->
      <section class="tile t-spark">
        <div class="tile-head"><svg class="tile-ic" viewBox="0 0 24 24" v-html="ICON.trend" /><span>Evolução CE no mês</span><span class="tile-cap">acumulado vs meta {{ ceNec }}</span></div>
        <div v-if="diaryPending" class="skel" style="height:100px" />
        <svg v-else viewBox="0 0 240 90" preserveAspectRatio="none" class="ce-chart">
          <defs>
            <linearGradient id="ceArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0f62fe" stop-opacity="0.16"/>
              <stop offset="100%" stop-color="#0f62fe" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <line :x1="0" :y1="ceGoalY" :x2="240" :y2="ceGoalY" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="3 3" />
          <path :d="sparkAreaPath" fill="url(#ceArea)" />
          <path :d="sparkLinePath" fill="none" stroke="#0f62fe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <circle v-if="sparkPoints.length" :cx="sparkPoints[sparkPoints.length-1].x" :cy="sparkPoints[sparkPoints.length-1].y" r="3" fill="#0f62fe" />
        </svg>
        <div class="spark-foot"><span class="tabular">{{ monthTotals.ce }}</span> CE acumulados · meta <span class="tabular">{{ ceNec }}</span></div>
      </section>
    </div>

    <Transition name="toast"><div v-if="toast" class="toast">{{ toast }}</div></Transition>
  </div>
</template>

<script setup lang="ts">
import type { DiaryEntry, Profile, MetricKey } from '~/types'
import { isHot, localDateISO, daysUntil } from '~/utils/leadDomain'
definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const { profile, org } = useProfile()

const metaMensal  = computed(() => org.value?.settings?.meta_mensal  || 10000)
const ticketMedio = computed(() => org.value?.settings?.ticket_medio || 2000)

const { fechNec, rrNec, rmNec, ceNec, cePerDay, rmPerDay } = useOutboundMath(metaMensal, ticketMedio)
const { leads, overdueLeads } = useLeads()

const hottestLead = computed(() => {
  const pool = (leads.value || []).filter(l => isHot(l) && l.valor_estimado && l.valor_estimado > 0)
  if (!pool.length) return null
  return [...pool].sort((a, b) => (b.valor_estimado || 0) - (a.valor_estimado || 0))[0]
})

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const now          = new Date()
const currentMonth = now.getMonth() + 1
const currentYear  = now.getFullYear()
const todayStr     = localDateISO(now)
const toast        = ref<string|null>(null)
const saving       = ref(false)
const alreadySaved = ref(false)

const showToast  = (m: string) => { toast.value = m; setTimeout(() => toast.value = null, 2500) }
const hour       = now.getHours()
const greeting   = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
const firstName  = computed(() => (profile.value?.name || '').split(' ')[0] || 'BDR')
const todayLabel = now.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })
const currentWeek = Math.ceil(now.getDate() / 7)

function countWorkdays(y: number, m: number, from = 1, to?: number) {
  const last = to || new Date(y, m, 0).getDate()
  let n = 0
  for (let i = from; i <= last; i++) { const d = new Date(y, m-1, i).getDay(); if (d > 0 && d < 6) n++ }
  return n
}
const totalWorkdays = countWorkdays(currentYear, currentMonth)
const daysGone      = countWorkdays(currentYear, currentMonth, 1, now.getDate())
const workdaysLeft  = totalWorkdays - daysGone

const selectedUserId = ref<string | null>(null)
const canFilterUsers = computed(() => ['owner', 'admin'].includes(profile.value?.role || ''))

const { data: orgMembers } = await useAsyncData('cockpit-members', async () => {
  if (!canFilterUsers.value) return []
  try { return await $fetch<Profile[]>('/api/settings/members') } catch { return [] }
}, { watch: [canFilterUsers] })

const { data: diaryRows, refresh: refreshDiary, pending: diaryPending } = await useAsyncData('cockpit-diary', async () => {
  const params: Record<string, string> = { month: String(currentMonth), year: String(currentYear) }
  if (selectedUserId.value) params.user_id = selectedUserId.value
  return await $fetch<DiaryEntry[]>('/api/diary', { query: params }).catch(() => [])
}, { watch: [selectedUserId] })

const monthTotals = computed(() => (diaryRows.value||[]).reduce(
  (a, e) => ({ ld:a.ld+(e.ld||0), ce:a.ce+e.ce, rm:a.rm+e.rm, rr:a.rr+e.rr, fr:a.fr+e.fr }),
  { ld:0, ce:0, rm:0, rr:0, fr:0 }
))

const todayEntry = computed(() => (diaryRows.value||[]).find(e => e.date === todayStr))
const quickForm  = reactive<Record<string,number>>({ ld:0, ce:0, rm:0, rr:0, fr:0 })
watch(todayEntry, e => {
  if (e) { quickForm.ld=e.ld||0; quickForm.ce=e.ce; quickForm.rm=e.rm; quickForm.rr=e.rr; quickForm.fr=e.fr; alreadySaved.value=true }
}, { immediate: true })

const quickFields = computed(() => [
  { key:'ld', label:'LD', meta: 'N/A' },
  { key:'ce', label:'CE', meta: String(cePerDay.value) },
  { key:'rm', label:'RM', meta: String(rmPerDay.value) },
  { key:'rr', label:'RR', meta: 'N/A' },
  { key:'fr', label:'FR', meta: String(fechNec.value) },
])

const todayCERMRate = computed(() => quickForm.ce > 0 ? ((quickForm.rm / quickForm.ce) * 100).toFixed(1) : '0.0')
const monthCERMRate = computed(() => monthTotals.value.ce > 0 ? ((monthTotals.value.rm / monthTotals.value.ce) * 100).toFixed(1) : '0.0')

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (!saving.value) saveQuick() }
}
async function saveQuick() {
  saving.value = true
  try {
    await $fetch('/api/diary', { method:'POST', body:{ date:todayStr, ...quickForm } })
    alreadySaved.value = true; await refreshDiary(); showToast('Dia registrado!')
  } finally { saving.value = false }
}

// ── Icones SVG ──────────────────────────────────────────────────────────
const ICON = {
  target:  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  gauge:   '<path d="M12 14l4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  funnel:  '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  flame:   '<path d="M12 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-2.5-1-4 2 1 3 3 3 5a6 6 0 0 1-12 0c0-5 6-6 6-10z"/>',
  edit:    '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  bell:    '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  activity:'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  trend:   '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  phone:   '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  msg:     '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  cal:     '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  users:   '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
  trophy:  '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
}

// ── Sparkline CE ────────────────────────────────────────────────────────
const CHART_W = 240, CHART_H = 80, CHART_PAD = 5
const sparkPoints = computed(() => {
  const rows = diaryRows.value || []
  if (!rows.length) return []
  const max  = Math.max(ceNec.value, ...rows.map(r => r.ce), 1)
  const step = rows.length > 1 ? (CHART_W - CHART_PAD * 2) / (rows.length - 1) : CHART_W / 2
  return rows.map((r, i) => ({ x: CHART_PAD + i * step, y: CHART_H - CHART_PAD - ((r.ce / max) * (CHART_H - CHART_PAD * 2)) }))
})
const ceGoalY = computed(() => {
  const rows = diaryRows.value || []
  const max  = Math.max(ceNec.value, ...rows.map(r => r.ce), 1)
  return CHART_H - CHART_PAD - ((ceNec.value / max) * (CHART_H - CHART_PAD * 2))
})
const sparkLinePath = computed(() => sparkPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))
const sparkAreaPath = computed(() => {
  const pts = sparkPoints.value
  if (!pts.length) return ''
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return `${line} L${pts[pts.length-1].x.toFixed(1)},${(CHART_H-CHART_PAD).toFixed(1)} L${pts[0].x.toFixed(1)},${(CHART_H-CHART_PAD).toFixed(1)} Z`
})

// ── Mini sparkline por KPI ──────────────────────────────────────────────
function kpiSpark(key: 'ld'|'ce'|'rm'|'rr'|'fr') {
  const rows = diaryRows.value || []
  if (rows.length < 2) return ''
  const vals = rows.map(r => (r as any)[key] ?? 0)
  const max = Math.max(...vals, 1), W = 64, H = 20, step = W / (vals.length - 1)
  return vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i*step).toFixed(1)},${(H - (v/max)*(H-2) - 1).toFixed(1)}`).join(' ')
}

// ── Pace ────────────────────────────────────────────────────────────────
const ceNeededByToday = computed(() => cePerDay.value * daysGone)
const ceDelta         = computed(() => monthTotals.value.ce - ceNeededByToday.value)
const focusTone       = computed(() => focusAction.value.tone)
const focusToneLabel  = computed(() => ({ urgent:'urgente', today:'hoje', pace:'ritmo', hot:'oportunidade', clear:'em dia' }[focusAction.value.tone] || ''))

// ── Gauge ───────────────────────────────────────────────────────────────
const GAUGE_C = 2 * Math.PI * 50
const gaugePct = computed(() => Math.min(100, Math.round(monthTotals.value.ce / Math.max(ceNec.value, 1) * 100)))
const gaugeOffset = computed(() => GAUGE_C * (1 - gaugePct.value / 100))
const paceColor = computed(() => ceDelta.value >= 5 ? 'var(--ok)' : ceDelta.value >= 0 ? 'var(--warn)' : 'var(--bad)')

// ── Funil ────────────────────────────────────────────────────────────────
const funnelRows = computed(() => {
  const t = monthTotals.value
  const stages = [
    { key:'LD', label:'Ligações',        v: t.ld },
    { key:'CE', label:'Contato efetivo', v: t.ce },
    { key:'RM', label:'Reunião marcada', v: t.rm },
    { key:'RR', label:'Reunião realiz.', v: t.rr },
    { key:'FR', label:'Fechamento',      v: t.fr },
  ]
  const maxV = Math.max(...stages.map(s => s.v), 1)
  return stages.map((s, i) => ({
    ...s,
    pct: s.v > 0 ? Math.max(3, Math.round((s.v / maxV) * 100)) : 0,
    rate: i > 0 && stages[i-1].v > 0 ? (s.v / stages[i-1].v * 100) : null,
  }))
})

// ── Foco agora ──────────────────────────────────────────────────────────
const focusAction = computed(() => {
  const ov = overdueLeads.value.length
  if (ov > 0) return { tone:'urgent', title:`${ov} retorno${ov>1?'s':''} vencido${ov>1?'s':''} para ligar agora`, sub:'Lead parado perde temperatura a cada dia. Comece pelos mais antigos.', cta:'Trabalhar fila de vencidos', to:'/dashboard/followup' }
  const dt = (urgentLeadsData.value || []).filter(l => l.data_retorno === todayStr).length
  if (dt > 0) return { tone:'today', title:`${dt} retorno${dt>1?'s':''} agendado${dt>1?'s':''} para hoje`, sub:'Mantenha a cadência em dia para não acumular amanhã.', cta:'Ver retornos de hoje', to:'/dashboard/followup' }
  if (ceDelta.value < 0) return { tone:'pace', title:`Faltam ${Math.abs(ceDelta.value)} contatos para o ritmo de hoje`, sub:`Você fez ${monthTotals.value.ce} CE no mês. O ritmo pede ${ceNeededByToday.value} até agora.`, cta:'Registrar contatos', to:'/dashboard/diario' }
  if (hottestLead.value) return { tone:'hot', title:`Avance ${hottestLead.value.decisor} no funil`, sub:`Maior oportunidade aberta: R$ ${(hottestLead.value.valor_estimado || 0).toLocaleString('pt-BR')} em ${hottestLead.value.resultado}.`, cta:'Abrir no pipeline', to:`/dashboard/pipeline?highlight=${hottestLead.value.id}` }
  return { tone:'clear', title:'Tudo em dia. Hora de prospectar.', sub:'Sem pendências urgentes. Gere novos contatos para alimentar o funil.', cta:'Adicionar leads', to:'/dashboard/pipeline' }
})

// ── KPIs ────────────────────────────────────────────────────────────────
const kpiStrip = computed(() => {
  const t = monthTotals.value
  const need = Math.floor(ceNec.value * daysGone / totalWorkdays)
  const rmNeed = Math.floor(rmNec.value * daysGone / totalWorkdays)
  return [
    { key:'ld', metric:'LD', label:'Ligações',        value:t.ld, icon:ICON.phone,  cls:'', spark:kpiSpark('ld') },
    { key:'ce', metric:'CE', label:'Contato efetivo', value:t.ce, icon:ICON.msg,    cls: t.ce>=need ? 'is-ok' : 'is-bad', spark:kpiSpark('ce') },
    { key:'rm', metric:'RM', label:'Reunião marcada', value:t.rm, icon:ICON.cal,    cls: t.rm>=rmNeed ? 'is-ok' : 'is-warn', spark:kpiSpark('rm') },
    { key:'rr', metric:'RR', label:'Reunião realiz.', value:t.rr, icon:ICON.users,  cls:'', spark:kpiSpark('rr') },
    { key:'fr', metric:'FR', label:'Fechamento',      value:t.fr, icon:ICON.trophy, cls: t.fr>0 ? 'is-ok' : '', spark:kpiSpark('fr') },
  ]
})

const paceRows = computed(() => {
  const t = monthTotals.value
  const color = (v: number, n: number) => v>=n ? 'var(--ok)' : v>=n*.8 ? 'var(--warn)' : 'var(--bad)'
  const pct   = (v: number, n: number) => Math.min(100, n>0 ? Math.round((v/n)*100) : 0)
  const ceN = Math.floor(ceNec.value * daysGone / totalWorkdays)
  const rmN = Math.floor(rmNec.value * daysGone / totalWorkdays)
  return [
    { label:'Contatos efetivos', current:t.ce, target:ceNec.value,  pct:pct(t.ce,ceNec.value),  color:color(t.ce,ceN) },
    { label:'Reuniões marcadas', current:t.rm, target:rmNec.value,  pct:pct(t.rm,rmNec.value),  color:color(t.rm,rmN) },
    { label:'Fechamentos',       current:t.fr, target:fechNec.value, pct:pct(t.fr,fechNec.value), color:t.fr>=fechNec.value?'var(--ok)':'var(--bad)' },
  ]
})

const { data: urgentLeadsData } = await useAsyncData('urgent-leads', async () => {
  const { data } = await supabase.from('leads').select('id,decisor,data_retorno,resultado')
    .not('resultado', 'in', '("Fechado","Recusado","Sem interesse")')
    .not('data_retorno', 'is', null)
    .lte('data_retorno', localDateISO(new Date(Date.now() + 2*86400000)))
    .order('data_retorno').limit(5)
  return data || []
})
const todayTasks = computed(() => (urgentLeadsData.value||[]).map(l => {
  const diff = daysUntil(l.data_retorno) ?? 0
  return { ...l, sub: diff < 0 ? `atrasado ${Math.abs(diff)}d` : diff === 0 ? 'hoje' : 'amanhã', cls: diff < 0 ? 'is-bad' : diff === 0 ? 'is-warn' : 'is-info' }
}))
</script>

<style scoped>
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
.skel { background:var(--bg-subtle); animation:pulse 1.5s infinite; }
.dash { max-width: 1200px; }

.dash-head { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin-bottom:20px; }
.dash-greet { font-size:28px; font-weight:700; letter-spacing:-.03em; color:var(--text-1); line-height:1.05; }
.dash-date { font-size:13px; color:var(--text-3); margin-top:6px; text-transform:capitalize; }
.dash-head-right { display:flex; align-items:center; gap:18px; flex-shrink:0; }
.dash-select { font-size:13px; padding:7px 11px; max-width:170px; width:auto; }
.dash-days { display:flex; flex-direction:column; align-items:flex-end; line-height:1.1; }
.dash-days-n { font-size:var(--num-md); font-weight:600; color:var(--text-2); }
.dash-days-l { font-size:11px; color:var(--text-3); margin-top:2px; }

/* ── Grid 12 col ─────────────────────────────────────────── */
.grid { display:grid; grid-template-columns:repeat(12,1fr); gap:12px; }
.t-focus  { grid-column:span 8; }
.t-gauge  { grid-column:span 4; }
.t-funnel { grid-column:span 8; }
.t-hot    { grid-column:span 4; }
.t-kpis   { grid-column:span 12; }
.t-reg    { grid-column:span 8; }
.t-follow { grid-column:span 4; }
.t-ritmo  { grid-column:span 6; }
.t-spark  { grid-column:span 6; }

.tile { background:var(--glass-bg); -webkit-backdrop-filter:var(--glass-blur); backdrop-filter:var(--glass-blur); border:1px solid var(--glass-brd); border-radius:var(--radius-lg); padding:20px 22px; display:flex; flex-direction:column; box-shadow:var(--shadow-sm); }
.tile-head { display:flex; align-items:center; gap:8px; margin-bottom:16px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; color:var(--text-2); }
.tile-ic { width:15px; height:15px; flex-shrink:0; fill:none; stroke:var(--accent); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.tile-cap { margin-left:auto; font-weight:400; text-transform:none; letter-spacing:0; color:var(--text-3); }
.pill { font-size:10px; font-weight:600; padding:2px 8px; border-radius:999px; background:var(--bg-subtle); color:var(--text-2); text-transform:uppercase; letter-spacing:.04em; }
.pill.is-urgent, .pill.is-bad { color:var(--bad); background:var(--bad-bg); }
.pill.is-today, .pill.is-pace, .pill.is-warn { color:var(--warn); background:var(--warn-bg); }
.pill.is-clear, .pill.is-ok { color:var(--ok); background:var(--ok-bg); }
.pill.is-hot { color:var(--accent); background:var(--accent-soft); }

/* ── Foco ────────────────────────────────────────────────── */
.focus-title { font-size:18px; font-weight:600; letter-spacing:-.01em; line-height:1.3; color:var(--text-1); max-width:580px; }
.focus-desc { font-size:13px; color:var(--text-2); margin-top:10px; line-height:1.6; max-width:540px; }
.focus-cta { align-self:flex-start; margin-top:20px; }

/* ── Gauge ───────────────────────────────────────────────── */
.t-gauge { align-items:center; }
.gauge-wrap { display:flex; justify-content:center; padding:4px 0; }
.gauge-svg { width:120px; height:120px; }
.gauge-pct { font-family:var(--font-mono); font-size:var(--num-hero); font-weight:600; fill:var(--text-1); }
.gauge-cap { font-size:9px; fill:var(--text-3); text-transform:uppercase; letter-spacing:.08em; }
.gauge-foot { font-size:12px; color:var(--text-2); margin-top:10px; text-align:center; }

/* ── Funil ───────────────────────────────────────────────── */
.fn-bars { display:flex; flex-direction:column; flex:1; justify-content:center; padding:4px 0; }
.fn-row { display:flex; align-items:center; gap:10px; }
.fn-lbl { font-size:11px; color:var(--text-2); width:114px; flex-shrink:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.fn-track { flex:1; height:12px; background:var(--bg-subtle); border-radius:999px; overflow:hidden; }
.fn-fill { height:100%; background:var(--grad-brand); border-radius:999px; opacity:.95; transition:width .5s var(--ease-out); }
.fn-val { font-size:12px; font-weight:600; color:var(--text-1); width:42px; text-align:right; flex-shrink:0; }
.fn-gap { display:flex; align-items:center; gap:5px; padding:3px 0 3px 124px; }
.fn-chevron { color:var(--text-3); flex-shrink:0; }
.fn-rate { font-size:10px; font-weight:500; color:var(--text-3); }
.empty-mini { font-size:12px; color:var(--text-3); padding:24px 0; text-align:center; flex:1; display:flex; align-items:center; justify-content:center; }

/* ── Lead quente ─────────────────────────────────────────── */
.t-hot { text-decoration:none; transition:border-color .12s; }
.t-hot:hover { border-color:var(--accent); }
.hot-name { font-size:15px; font-weight:600; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.hot-company { font-size:12px; color:var(--text-2); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.hot-spacer { flex:1; min-height:14px; }
.hot-value { font-size:var(--num-lg); font-weight:600; color:var(--accent); letter-spacing:-.01em; }
.hot-status { font-size:11px; color:var(--text-3); margin-top:5px; display:flex; align-items:center; gap:6px; }
.hot-status .dot { width:6px; height:6px; border-radius:50%; background:var(--accent); }

/* ── KPIs ────────────────────────────────────────────────── */
.kpi-row { display:grid; grid-template-columns:repeat(5,1fr); gap:0; }
.kpi { padding:0 18px; border-left:1px solid var(--border-soft); display:flex; flex-direction:column; }
.kpi:first-child { padding-left:0; border-left:none; }
.kpi-top { display:flex; align-items:center; gap:6px; color:var(--text-2); }
.kpi-ic { width:14px; height:14px; fill:none; stroke:var(--text-3); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.kpi-name { font-size:11px; font-weight:600; letter-spacing:.04em; color:var(--text-2); }
.kpi-num { font-size:var(--num-hero); font-weight:600; color:var(--text-1); letter-spacing:-.02em; line-height:1; margin-top:10px; }
.kpi-num.is-ok { color:var(--ok); } .kpi-num.is-warn { color:var(--warn); } .kpi-num.is-bad { color:var(--bad); }
.kpi-spark { width:100%; height:20px; margin-top:8px; color:var(--accent); opacity:.85; filter:drop-shadow(0 1px 4px rgba(15,98,254,.35)); }
.kpi-spark-empty { height:20px; margin-top:8px; }
.kpi-sub { font-size:11px; color:var(--text-3); margin-top:7px; }

/* ── Registrar ───────────────────────────────────────────── */
.reg-actions { margin-left:auto; display:flex; align-items:center; gap:10px; text-transform:none; letter-spacing:0; }
.saved-flag { font-size:11px; color:var(--ok); }
.reg-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; }
.reg-cell { display:flex; flex-direction:column; align-items:center; gap:6px; }
.reg-cell-label { font-size:10px; text-transform:uppercase; letter-spacing:.07em; color:var(--text-3); }
input.reg-input { text-align:center; font-size:var(--num-md); font-weight:600; padding:9px 4px; }
.reg-cell-meta { font-size:10px; color:var(--text-3); }
.reg-foot { font-size:12px; color:var(--text-2); margin-top:14px; }
.reg-foot strong { color:var(--text-1); font-weight:600; }
.hint { font-size:11px; color:var(--text-3); }

/* ── Follow-ups ──────────────────────────────────────────── */
.follow-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--border-soft); text-decoration:none; }
.follow-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.follow-dot.is-bad { background:var(--bad); } .follow-dot.is-warn { background:var(--warn); } .follow-dot.is-info { background:var(--info); }
.follow-name { font-size:13px; font-weight:500; color:var(--text-1); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.follow-sub { font-size:12px; color:var(--text-3); flex-shrink:0; }
.follow-all { font-size:13px; font-weight:500; color:var(--accent); text-decoration:none; margin-top:14px; }

/* ── Ritmo ───────────────────────────────────────────────── */
.pace-row { margin-bottom:16px; }
.pace-row:last-child { margin-bottom:0; }
.pace-row-head { display:flex; justify-content:space-between; font-size:13px; color:var(--text-2); margin-bottom:7px; }
.pace-row-head span:last-child { color:var(--text-1); font-weight:600; }
.track { height:6px; background:var(--bg-subtle); overflow:hidden; }
.track-fill { height:100%; transition:width .4s; }

/* ── Spark ───────────────────────────────────────────────── */
.ce-chart { width:100%; height:100px; filter:drop-shadow(0 2px 6px rgba(15,98,254,.26)); }
.spark-foot { font-size:12px; color:var(--text-2); margin-top:10px; }

@media (max-width: 1000px) {
  .grid { grid-template-columns:repeat(6,1fr); }
  .t-focus, .t-funnel, .t-reg { grid-column:span 6; }
  .t-gauge, .t-hot { grid-column:span 3; }
  .t-kpis { grid-column:span 6; }
  .t-follow, .t-ritmo, .t-spark { grid-column:span 6; }
}
@media (max-width: 600px) {
  .grid { grid-template-columns:1fr; gap:10px; }
  .grid > section, .grid > a { grid-column:span 1 !important; }
  .kpi-row { grid-template-columns:repeat(2,1fr); gap:14px 0; }
  .kpi:nth-child(odd) { padding-left:0; border-left:none; }
  .kpi:nth-child(even) { padding-left:14px; }
  .dash-head { flex-wrap:wrap; gap:12px; }
  .dash-head-right { width:100%; justify-content:space-between; }
}
</style>
