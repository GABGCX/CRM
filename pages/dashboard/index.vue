<template>
  <div>
    <!-- Page header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px">
      <div>
        <div class="page-title">Bom {{ greeting }}, {{ firstName }}</div>
        <div class="page-sub">{{ todayLabel }} · semana {{ currentWeek }} de 4</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <select
          v-if="canFilterUsers && orgMembers?.length"
          v-model="selectedUserId"
          style="font-size:13px;padding:6px 10px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#475569;cursor:pointer;max-width:160px">
          <option :value="null">Toda equipe</option>
          <option v-for="m in orgMembers" :key="m.id" :value="m.id">{{ m.name || m.id.slice(0,8) }}</option>
        </select>
        <div style="font-size:12px;color:#94a3b8;text-align:right;line-height:1.5">
          <div>{{ workdaysLeft }} dias úteis restantes</div>
          <div>{{ totalWorkdays }} dias úteis no mês</div>
        </div>
      </div>
    </div>

    <!-- Foco agora: proxima acao concreta -->
    <div class="focus-hero" :class="`focus-hero--${focusAction.tone}`">
      <div class="focus-main">
        <div class="focus-eyebrow">
          <span class="focus-dot"></span>
          Foco agora
        </div>
        <div class="focus-title">{{ focusAction.title }}</div>
        <div class="focus-sub">{{ focusAction.sub }}</div>
        <NuxtLink :to="focusAction.to" class="focus-cta">
          {{ focusAction.cta }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </NuxtLink>
      </div>
      <NuxtLink v-if="hottestLead" :to="`/dashboard/pipeline?highlight=${hottestLead.id}`" class="focus-hot">
        <div class="focus-hot-label">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="margin-right:3px">
            <path d="M12 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-2.5-1-4 2 1 3 3 3 5a6 6 0 0 1-12 0c0-5 6-6 6-10z"/>
          </svg>
          Lead mais quente
        </div>
        <div class="focus-hot-name">{{ hottestLead.decisor }}</div>
        <div class="focus-hot-company">{{ hottestLead.negocio || 'Sem empresa' }}</div>
        <div class="focus-hot-footer">
          <span class="focus-hot-value">R$ {{ (hottestLead.valor_estimado || 0).toLocaleString('pt-BR') }}</span>
          <span class="focus-hot-status">{{ hottestLead.resultado }}</span>
        </div>
      </NuxtLink>
    </div>

    <!-- ── HOJE ─────────────────────────────────────────── -->
    <div class="ck-label">Hoje · {{ todayFormatted }}</div>
    <div class="cockpit-charts" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">
      <!-- Registrar hoje (acao diaria, prioritaria) -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div class="card-label" style="margin-bottom:0">Registrar dia</div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:var(--text-3);background:var(--bg-subtle);padding:2px 7px;border-radius:4px">Ctrl+S</span>
            <span v-if="alreadySaved" style="font-size:12px;color:#16a34a;font-weight:500">Salvo</span>
          </div>
        </div>
        <div class="cockpit-quick-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">
          <div v-for="f in quickFields" :key="f.key" style="text-align:center">
            <div style="font-size:10px;color:var(--text-3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;display:flex;align-items:center;justify-content:center">
              <UiMetricTooltip v-if="['CE','RM','RR','FR'].includes(f.label)" :metric="(f.label as MetricKey)" />
              <span v-else>{{ f.label }}</span>
            </div>
            <input type="number" v-model.number="quickForm[f.key]" min="0"
              style="text-align:center;font-size:20px;font-weight:600;padding:8px 4px;color:var(--text-1)" />
            <div style="font-size:11px;color:var(--text-3);margin-top:2px">meta: {{ f.meta }}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:12px;color:var(--text-2)">
            CE→RM hoje: <strong>{{ todayCERMRate }}%</strong> &nbsp;·&nbsp; mês: <strong>{{ monthCERMRate }}%</strong>
          </div>
          <button class="btn btn-primary" :disabled="saving" @click="saveQuick">
            {{ saving ? 'Salvando...' : 'Salvar dia' }}
          </button>
        </div>
      </div>

      <!-- Follow-ups hoje -->
      <div class="card">
        <div class="card-label">Follow-ups hoje</div>
        <div v-if="!todayTasks.length" style="text-align:center;padding:28px 0;color:var(--text-3);font-size:13px">
          Nenhum retorno urgente.
        </div>
        <div v-for="t in todayTasks" :key="t.id"
          style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-soft)">
          <div>
            <div style="font-size:13px;font-weight:500;color:var(--text-1)">{{ t.decisor }}</div>
            <div style="font-size:12px;color:var(--text-2)">{{ t.sub }}</div>
          </div>
          <span class="tag" :class="t.tagClass">{{ t.tagLabel }}</span>
        </div>
        <NuxtLink to="/dashboard/followup" style="display:block;margin-top:12px;font-size:13px;color:var(--accent);text-decoration:none;font-weight:500">
          Ver todos →
        </NuxtLink>
      </div>
    </div>

    <!-- ── ESTE MÊS ─────────────────────────────────────── -->
    <div class="ck-head">
      <div class="ck-label" style="margin:0">Este mês · {{ MONTH_NAMES[currentMonth-1] }}</div>
      <span class="tag" :class="paceBanner.tagClass">{{ paceBanner.tagLabel }}</span>
    </div>

    <!-- Pace banner -->
    <div class="pace-banner" :class="paceBanner.bannerClass"
      style="border-radius:10px;padding:13px 16px;display:flex;align-items:center;gap:10px;margin-bottom:14px;border:1px solid">
      <div style="flex:1">
        <div style="font-size:14px;font-weight:500">{{ paceBanner.title }}</div>
        <div style="font-size:12px;margin-top:3px;opacity:.8">{{ paceBanner.sub }}</div>
      </div>
    </div>

    <!-- Metric cards -->
    <div class="cockpit-kpi-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
      <div v-if="diaryPending" v-for="i in 4" :key="i"
        class="metric-card" style="animation:pulse 1.5s infinite;min-height:88px">
        <div style="height:10px;background:var(--bg-subtle);border-radius:3px;margin-bottom:10px;width:55%" />
        <div style="height:30px;background:var(--bg-subtle);border-radius:3px;width:40%" />
      </div>
      <UiMetricCard v-else v-for="m in metricCards" :key="m.label" :value="m.value" :sub="m.sub" :sub-class="m.subClass">
        <template #label>
          <span style="display:flex;align-items:center;gap:4px">
            <UiMetricTooltip v-if="['CE no mês','RM no mês','RR no mês','FR no mês'].includes(m.label)"
              :metric="(m.label.split(' ')[0] as MetricKey)" />
            <span v-else>{{ m.label }}</span>
            <span v-if="['CE no mês','RM no mês','RR no mês','FR no mês'].includes(m.label)"
              style="font-size:11px;color:var(--text-3);font-weight:400"> no mês</span>
          </span>
        </template>
      </UiMetricCard>
    </div>

    <!-- Charts row -->
    <div class="cockpit-charts" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <!-- Pace bars -->
      <div class="card">
        <div class="card-label">Ritmo · {{ MONTH_NAMES[currentMonth-1] }}</div>
        <div v-for="r in paceRows" :key="r.label" style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px">
            <span style="font-size:13px;color:var(--text-2)">{{ r.label }}</span>
            <span style="font-size:13px;font-weight:500;color:var(--text-1)" class="tabular">{{ r.current }} / {{ r.target }}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: r.pct + '%', background: r.color }"></div>
          </div>
          <div style="font-size:11px;margin-top:3px" :style="{ color: r.color }">{{ r.note }}</div>
        </div>
      </div>

      <!-- Sparkline CE -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div class="card-label" style="margin-bottom:0">Evolução CE no mês</div>
          <span style="font-size:12px;color:var(--text-3)">acumulado vs meta</span>
        </div>
        <div v-if="diaryPending"
          style="height:80px;background:var(--bg-subtle);border-radius:8px;animation:pulse 1.5s infinite" />
        <svg v-else viewBox="0 0 240 80" style="width:100%;height:80px;overflow:visible">
          <line :x1="0" :y1="ceGoalY" :x2="240" :y2="ceGoalY"
            stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 2" />
          <text x="2" :y="ceGoalY - 3" fill="#94a3b8" font-size="8">meta</text>
          <path :d="sparkAreaPath" fill="#193497" fill-opacity="0.08" />
          <path :d="sparkLinePath" fill="none" stroke="#193497" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round" />
          <circle v-if="sparkPoints.length"
            :cx="sparkPoints[sparkPoints.length-1].x"
            :cy="sparkPoints[sparkPoints.length-1].y"
            r="3" fill="#193497" />
          <text v-if="sparkPoints.length > 0"
            :x="sparkPoints[0].x" y="78" fill="#94a3b8" font-size="7" text-anchor="middle">1</text>
          <text v-if="sparkPoints.length > 1"
            :x="sparkPoints[Math.floor(sparkPoints.length/2)].x" y="78"
            fill="#94a3b8" font-size="7" text-anchor="middle">{{ Math.floor(sparkPoints.length/2) + 1 }}</text>
          <text v-if="sparkPoints.length > 2"
            :x="sparkPoints[sparkPoints.length-1].x" y="78"
            fill="#94a3b8" font-size="7" text-anchor="middle">{{ sparkPoints.length }}</text>
        </svg>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:6px">
          <span style="color:#193497;font-weight:500">{{ monthTotals.ce }} CE acumulados</span>
          <span style="color:var(--text-3)">meta: {{ ceNec }}</span>
        </div>
      </div>
    </div>

    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { DiaryEntry, Profile, MetricKey } from '~/types'
import { isHot } from '~/utils/leadDomain'
definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const { profile, org } = useProfile()

const metaMensal  = computed(() => org.value?.settings?.meta_mensal  || 10000)
const ticketMedio = computed(() => org.value?.settings?.ticket_medio || 2000)

const { fechNec, rrNec, rmNec, ceNec, cePerDay, rmPerDay } = useOutboundMath(metaMensal, ticketMedio)
const { leads, overdueLeads } = useLeads()

// Lead mais quente: maior valor estimado em status avancado
const hottestLead = computed(() => {
  const pool = (leads.value || []).filter(l =>
    isHot(l) && l.valor_estimado && l.valor_estimado > 0
  )
  if (!pool.length) return null
  return [...pool].sort((a, b) => (b.valor_estimado || 0) - (a.valor_estimado || 0))[0]
})

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const now          = new Date()
const currentMonth = now.getMonth() + 1
const currentYear  = now.getFullYear()
const todayStr     = now.toISOString().slice(0, 10)
const todayFormatted = now.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })
const toast        = ref<string|null>(null)
const saving       = ref(false)
const alreadySaved = ref(false)

const showToast  = (m: string) => { toast.value = m; setTimeout(() => toast.value = null, 2500) }
const hour       = now.getHours()
const greeting   = hour < 12 ? 'dia' : hour < 18 ? 'tarde' : 'noite'
const firstName  = computed(() => (profile.value?.name || '').split(' ')[0] || 'BDR')
const todayLabel = now.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })
const currentWeek = Math.ceil(now.getDate() / 7)

function countWorkdays(y: number, m: number, from = 1, to?: number) {
  const last = to || new Date(y, m, 0).getDate()
  let n = 0
  for (let i = from; i <= last; i++) {
    const d = new Date(y, m-1, i).getDay()
    if (d > 0 && d < 6) n++
  }
  return n
}

const totalWorkdays = countWorkdays(currentYear, currentMonth)
const daysGone      = countWorkdays(currentYear, currentMonth, 1, now.getDate())
const workdaysLeft  = totalWorkdays - daysGone

const selectedUserId = ref<string | null>(null)
const canFilterUsers = computed(() => ['owner', 'admin'].includes(profile.value?.role || ''))

const { data: orgMembers } = await useAsyncData(
  'cockpit-members',
  async () => {
    if (!canFilterUsers.value) return []
    try { return await $fetch<Profile[]>('/api/settings/members') }
    catch { return [] }
  },
  { watch: [canFilterUsers] }
)

const { data: diaryRows, refresh: refreshDiary, pending: diaryPending } = await useAsyncData(
  'cockpit-diary',
  async () => {
    const params: Record<string, string> = { month: String(currentMonth), year: String(currentYear) }
    if (selectedUserId.value) params.user_id = selectedUserId.value
    return await $fetch<DiaryEntry[]>('/api/diary', { query: params }).catch(() => [])
  },
  { watch: [selectedUserId] }
)

const monthTotals = computed(() => (diaryRows.value||[]).reduce(
  (a, e) => ({ ce:a.ce+e.ce, rm:a.rm+e.rm, rr:a.rr+e.rr, fr:a.fr+e.fr }),
  { ce:0, rm:0, rr:0, fr:0 }
))

const todayEntry = computed(() => (diaryRows.value||[]).find(e => e.date === todayStr))
const quickForm  = reactive<Record<string,number>>({ ce:0, rm:0, rr:0, fr:0 })

watch(todayEntry, e => {
  if (e) { quickForm.ce=e.ce; quickForm.rm=e.rm; quickForm.rr=e.rr; quickForm.fr=e.fr; alreadySaved.value=true }
}, { immediate: true })

const quickFields = computed(() => [
  { key:'ce', label:'CE', meta: String(cePerDay.value) },
  { key:'rm', label:'RM', meta: String(rmPerDay.value) },
  { key:'rr', label:'RR', meta: 'N/A' },
  { key:'fr', label:'FR', meta: String(fechNec.value) },
])

const todayCERMRate = computed(() =>
  quickForm.ce > 0 ? ((quickForm.rm / quickForm.ce) * 100).toFixed(1) : '0.0'
)
const monthCERMRate = computed(() =>
  monthTotals.value.ce > 0 ? ((monthTotals.value.rm / monthTotals.value.ce) * 100).toFixed(1) : '0.0'
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (!saving.value) saveQuick()
  }
}

async function saveQuick() {
  saving.value = true
  try {
    await $fetch('/api/diary', { method:'POST', body:{ date:todayStr, ...quickForm } })
    alreadySaved.value = true
    await refreshDiary()
    showToast('Dia registrado!')
  } finally {
    saving.value = false
  }
}

// ── Sparkline ───────────────────────────────────────────────────────────
const CHART_W = 240, CHART_H = 68, CHART_PAD = 4

const sparkPoints = computed(() => {
  const rows = diaryRows.value || []
  if (!rows.length) return []
  const max  = Math.max(ceNec.value, ...rows.map(r => r.ce), 1)
  const step = rows.length > 1 ? (CHART_W - CHART_PAD * 2) / (rows.length - 1) : CHART_W / 2
  return rows.map((r, i) => ({
    x: CHART_PAD + i * step,
    y: CHART_H - CHART_PAD - ((r.ce / max) * (CHART_H - CHART_PAD * 2)),
  }))
})

const ceGoalY = computed(() => {
  const rows = diaryRows.value || []
  const max  = Math.max(ceNec.value, ...rows.map(r => r.ce), 1)
  return CHART_H - CHART_PAD - ((ceNec.value / max) * (CHART_H - CHART_PAD * 2))
})

const sparkLinePath = computed(() => {
  const pts = sparkPoints.value
  if (!pts.length) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
})

const sparkAreaPath = computed(() => {
  const pts = sparkPoints.value
  if (!pts.length) return ''
  const line  = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const last  = pts[pts.length - 1]
  const first = pts[0]
  return `${line} L${last.x.toFixed(1)},${(CHART_H - CHART_PAD).toFixed(1)} L${first.x.toFixed(1)},${(CHART_H - CHART_PAD).toFixed(1)} Z`
})

// ── Pace banner ─────────────────────────────────────────────────────────
const ceNeededByToday = computed(() => cePerDay.value * daysGone)
const ceDelta         = computed(() => monthTotals.value.ce - ceNeededByToday.value)

const paceBanner = computed(() => {
  const d = ceDelta.value, t = monthTotals.value
  if (d >= 5) return {
    tagLabel: `+${d} a frente`, tagClass: 'tag-green', bannerClass: 'pace-ok',
    title: 'Voce esta no ritmo para bater a meta de CE',
    sub: `${t.ce} de ${ceNec.value} feitos. Precisava de ${ceNeededByToday.value} ate hoje.`,
  }
  if (d >= 0) return {
    tagLabel: 'no ritmo', tagClass: 'tag-amber', bannerClass: 'pace-warn',
    title: 'No ritmo, continue focado',
    sub: `${t.ce} de ${ceNec.value} feitos. ${d} acima do necessario.`,
  }
  return {
    tagLabel: `${Math.abs(d)} abaixo`, tagClass: 'tag-red', bannerClass: 'pace-bad',
    title: `${Math.abs(d)} contatos abaixo do ritmo`,
    sub: `${t.ce} de ${ceNec.value} feitos. Precisava de ${ceNeededByToday.value} ate hoje.`,
  }
})

// ── Foco agora: proxima acao prioritaria ────────────────────────────────
const focusAction = computed(() => {
  const ov = overdueLeads.value.length
  if (ov > 0) return {
    tone:  'urgent',
    title: `${ov} retorno${ov > 1 ? 's' : ''} vencido${ov > 1 ? 's' : ''} para ligar agora`,
    sub:   'Lead parado perde temperatura a cada dia. Comece pelos mais antigos.',
    cta:   'Trabalhar fila de vencidos',
    to:    '/dashboard/followup',
  }
  const dt = (urgentLeadsData.value || []).filter(l => l.data_retorno === todayStr).length
  if (dt > 0) return {
    tone:  'today',
    title: `${dt} retorno${dt > 1 ? 's' : ''} agendado${dt > 1 ? 's' : ''} para hoje`,
    sub:   'Mantenha a cadencia em dia para nao acumular amanha.',
    cta:   'Ver retornos de hoje',
    to:    '/dashboard/followup',
  }
  if (ceDelta.value < 0) return {
    tone:  'pace',
    title: `Faltam ${Math.abs(ceDelta.value)} contatos para o ritmo de hoje`,
    sub:   `Voce fez ${monthTotals.value.ce} CE no mes. O ritmo pede ${ceNeededByToday.value} ate agora.`,
    cta:   'Registrar contatos',
    to:    '/dashboard/diario',
  }
  if (hottestLead.value) return {
    tone:  'hot',
    title: `Avance ${hottestLead.value.decisor} no funil`,
    sub:   `Maior oportunidade aberta: R$ ${(hottestLead.value.valor_estimado || 0).toLocaleString('pt-BR')} em ${hottestLead.value.resultado}.`,
    cta:   'Abrir no pipeline',
    to:    `/dashboard/pipeline?highlight=${hottestLead.value.id}`,
  }
  return {
    tone:  'clear',
    title: 'Tudo em dia. Hora de prospectar.',
    sub:   'Sem pendencias urgentes. Gere novos contatos para alimentar o funil.',
    cta:   'Adicionar leads',
    to:    '/dashboard/pipeline',
  }
})

// ── Metric cards ────────────────────────────────────────────────────────
const metricCards = computed(() => {
  const t = monthTotals.value
  const needed   = Math.floor(ceNec.value  * daysGone / totalWorkdays)
  const rmNeeded = Math.floor(rmNec.value  * daysGone / totalWorkdays)
  return [
    { label:'CE no mês',  value:t.ce,
      sub:`meta: ${ceNec.value}`, subClass: t.ce >= needed ? 'metric-ok' : 'metric-bad' },
    { label:'RM no mês',  value:t.rm,
      sub:`tx: ${monthCERMRate.value}% · meta: ${rmNec.value}`,
      subClass: t.rm >= rmNeeded ? 'metric-ok' : 'metric-warn' },
    { label:'RR no mês',  value:t.rr,
      sub:`tx RM→RR: ${t.rm>0?((t.rr/t.rm)*100).toFixed(0):0}%`, subClass:'' },
    { label:'FR no mês',  value:t.fr,
      sub:`meta: ${fechNec.value}`,
      subClass: t.fr>=fechNec.value?'metric-ok':t.fr>0?'metric-warn':'metric-bad' },
  ]
})

const paceRows = computed(() => {
  const t     = monthTotals.value
  const color = (v: number, n: number) => v>=n ? '#16a34a' : v>=n*.8 ? '#d97706' : '#dc2626'
  const pct   = (v: number, n: number) => Math.min(100, n>0 ? Math.round((v/n)*100) : 0)
  const ceN   = Math.floor(ceNec.value  * daysGone / totalWorkdays)
  const rmN   = Math.floor(rmNec.value  * daysGone / totalWorkdays)
  return [
    { label:'Contatos efetivos', current:t.ce, target:ceNec.value,  pct:pct(t.ce,ceNec.value),
      color:color(t.ce,ceN),  note:`${cePerDay.value}/dia · hoje: ${quickForm.ce||0}` },
    { label:'Reuniões marcadas', current:t.rm, target:rmNec.value,  pct:pct(t.rm,rmNec.value),
      color:color(t.rm,rmN),  note:`meta: ${rmPerDay.value}/dia` },
    { label:'Fechamentos',       current:t.fr, target:fechNec.value, pct:pct(t.fr,fechNec.value),
      color:t.fr>=fechNec.value?'#16a34a':'#dc2626', note:`meta: ${fechNec.value} no mês` },
  ]
})

// ── Today tasks ─────────────────────────────────────────────────────────
const { data: urgentLeadsData } = await useAsyncData('urgent-leads', async () => {
  const { data } = await supabase.from('leads').select('id,decisor,data_retorno,resultado')
    .not('resultado', 'in', '("Fechado","Recusado","Sem interesse")')
    .not('data_retorno', 'is', null)
    .lte('data_retorno', new Date(Date.now() + 2*86400000).toISOString().slice(0,10))
    .order('data_retorno').limit(4)
  return data || []
})

const todayTasks = computed(() => (urgentLeadsData.value||[]).map(l => {
  const diff = Math.floor(
    (new Date(l.data_retorno!).setHours(0,0,0,0) - new Date(todayStr).setHours(0,0,0,0)) / 86400000
  )
  return {
    ...l,
    sub:      diff < 0 ? `atrasado ${Math.abs(diff)}d` : diff === 0 ? 'retorno hoje' : 'retorno amanhã',
    tagLabel: diff < 0 ? 'vencido' : diff === 0 ? 'hoje' : 'amanhã',
    tagClass: diff < 0 ? 'tag-red' : diff === 0 ? 'tag-amber' : 'tag-blue',
  }
}))
</script>

<style>
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }

.pace-ok   { background:#f0fdf4; border-color:#bbf7d0 !important; color:#14532d; }
.pace-warn { background:#fffbeb; border-color:#fde68a !important; color:#78350f; }
.pace-bad  { background:#fef2f2; border-color:#fecaca !important; color:#7f1d1d; }

.ck-label { font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-bottom:10px; }
.ck-head  { display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px; }

/* ── Foco agora (hero acionavel) ─────────────────────────── */
.focus-hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 14px;
  border: 1px solid var(--border);
  background: var(--bg-card);
}
.focus-hero:has(.focus-hot) { grid-template-columns: 1fr 220px; }
.focus-main { display: flex; flex-direction: column; min-width: 0; }
.focus-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--text-3);
  margin-bottom: 8px;
}
.focus-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); }
.focus-title { font-size: 18px; font-weight: 600; color: var(--text-1); letter-spacing: -.02em; line-height: 1.25; }
.focus-sub { font-size: 13px; color: var(--text-2); margin-top: 5px; line-height: 1.5; }
.focus-cta {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  align-self: flex-start;
  margin-top: 14px;
  padding: 8px 14px;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background .12s;
}
.focus-cta:hover { background: var(--accent-dark); }

/* Tom por urgencia: borda esquerda + cor do dot/cta */
.focus-hero--urgent { border-left: 3px solid #dc2626; }
.focus-hero--urgent .focus-dot, .focus-hero--urgent .focus-cta { background: #dc2626; }
.focus-hero--urgent .focus-cta:hover { background: #b91c1c; }
.focus-hero--today  { border-left: 3px solid #d97706; }
.focus-hero--today .focus-dot, .focus-hero--today .focus-cta { background: #d97706; }
.focus-hero--today .focus-cta:hover { background: #b45309; }
.focus-hero--pace   { border-left: 3px solid #d97706; }
.focus-hero--pace .focus-dot, .focus-hero--pace .focus-cta { background: #d97706; }
.focus-hero--pace .focus-cta:hover { background: #b45309; }
.focus-hero--hot    { border-left: 3px solid var(--accent); }
.focus-hero--clear  { border-left: 3px solid #16a34a; }
.focus-hero--clear .focus-dot, .focus-hero--clear .focus-cta { background: #16a34a; }
.focus-hero--clear .focus-cta:hover { background: #15803d; }

/* Card do lead mais quente */
.focus-hot {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px;
  border-radius: 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-soft);
  text-decoration: none;
  transition: border-color .12s;
}
.focus-hot:hover { border-color: var(--accent); }
.focus-hot-label {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: #d97706;
  margin-bottom: 4px;
}
.focus-hot-name { font-size: 14px; font-weight: 600; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.focus-hot-company { font-size: 12px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.focus-hot-footer { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 8px; }
.focus-hot-value { font-size: 15px; font-weight: 700; color: #16a34a; letter-spacing: -.01em; }
.focus-hot-status { font-size: 10px; font-weight: 500; color: var(--text-2); background: var(--bg-card); border: 1px solid var(--border); padding: 2px 6px; border-radius: 4px; white-space: nowrap; }

@media (max-width: 640px) {
  .focus-hero, .focus-hero:has(.focus-hot) { grid-template-columns: 1fr !important; }
}

@media (max-width: 640px) {
  .cockpit-kpi-grid   { grid-template-columns: repeat(2, 1fr) !important; }
  .cockpit-quick-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .cockpit-charts     { grid-template-columns: 1fr !important; }
}
</style>
