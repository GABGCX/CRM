<template>
  <div class="dash">
    <!-- Cabecalho editorial -->
    <header class="dash-head">
      <div>
        <h1 class="dash-greet">Bom {{ greeting }}, {{ firstName }}</h1>
        <p class="dash-date">{{ todayLabel }} · semana {{ currentWeek }} de 4</p>
      </div>
      <div class="dash-head-right">
        <select v-if="canFilterUsers && orgMembers?.length" v-model="selectedUserId" class="dash-select">
          <option :value="null">Toda equipe</option>
          <option v-for="m in orgMembers" :key="m.id" :value="m.id">{{ m.name || m.id.slice(0,8) }}</option>
        </select>
        <div class="dash-days">
          <span class="dash-days-n tabular">{{ workdaysLeft }}</span>
          <span class="dash-days-l">dias uteis restantes · {{ totalWorkdays }} no mes</span>
        </div>
      </div>
    </header>

    <!-- Foco agora -->
    <section class="dash-section" :class="`focus--${focusAction.tone}`">
      <div class="eyebrow"><span class="eyebrow-dot" /> Foco agora</div>
      <div class="focus-grid" :class="{ 'has-hot': hottestLead }">
        <div>
          <h2 class="focus-headline">{{ focusAction.title }}</h2>
          <p class="focus-desc">{{ focusAction.sub }}</p>
          <NuxtLink :to="focusAction.to" class="focus-link">
            {{ focusAction.cta }}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </NuxtLink>
        </div>
        <NuxtLink v-if="hottestLead" :to="`/dashboard/pipeline?highlight=${hottestLead.id}`" class="hot-aside">
          <div class="hot-eyebrow">Lead mais quente</div>
          <div class="hot-name">{{ hottestLead.decisor }}</div>
          <div class="hot-company">{{ hottestLead.negocio || 'Sem empresa' }}</div>
          <div class="hot-foot">
            <span class="hot-value">R$ {{ (hottestLead.valor_estimado || 0).toLocaleString('pt-BR') }}</span>
            <span class="hot-status">{{ hottestLead.resultado }}</span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Hoje -->
    <section class="dash-section">
      <div class="section-bar">
        <div class="eyebrow" style="margin-bottom:0">Hoje · {{ todayFormatted }}</div>
        <div class="bar-actions">
          <span v-if="alreadySaved && !saving" class="saved-flag">salvo</span>
          <span class="hint">Ctrl+S</span>
          <button class="btn btn-primary" :disabled="saving" @click="saveQuick">{{ saving ? 'Salvando...' : 'Salvar dia' }}</button>
        </div>
      </div>

      <div class="stat-strip">
        <div v-for="f in quickFields" :key="f.key" class="stat">
          <input type="number" min="0" v-model.number="quickForm[f.key]" class="stat-input tabular" />
          <div class="stat-label">
            <UiMetricTooltip v-if="['LD','CE','RM','RR','FR'].includes(f.label)" :metric="(f.label as MetricKey)" />
            <span v-else>{{ f.label }}</span>
          </div>
          <div class="stat-meta">meta {{ f.meta }}</div>
        </div>
      </div>

      <div class="today-line">
        <span class="today-line-label">Follow-ups</span>
        <template v-if="todayTasks.length">
          <span v-for="t in todayTasks" :key="t.id" class="task-chip">
            <span class="tag" :class="t.tagClass">{{ t.tagLabel }}</span>{{ t.decisor }}
          </span>
        </template>
        <span v-else class="today-empty">nenhum retorno urgente</span>
        <NuxtLink to="/dashboard/followup" class="today-all">Ver fila completa &rarr;</NuxtLink>
      </div>
    </section>

    <!-- Este mes -->
    <section class="dash-section">
      <div class="section-bar">
        <div class="eyebrow" style="margin-bottom:0">Este mes · {{ MONTH_NAMES[currentMonth-1] }}</div>
        <span class="tag" :class="paceBanner.tagClass">{{ paceBanner.tagLabel }}</span>
      </div>

      <div v-if="diaryPending" class="stat-strip">
        <div v-for="i in 4" :key="i" class="stat">
          <div class="skel" style="height:30px;width:50%" />
          <div class="skel" style="height:10px;width:70%;margin-top:10px" />
        </div>
      </div>
      <div v-else class="stat-strip">
        <div v-for="m in metricCards" :key="m.label" class="stat">
          <div class="stat-num tabular" :class="m.subClass">{{ m.value }}</div>
          <div class="stat-label">
            <UiMetricTooltip v-if="['CE no mês','RM no mês','RR no mês','FR no mês'].includes(m.label)"
              :metric="(m.label.split(' ')[0] as MetricKey)" />
            <span v-else>{{ m.label }}</span>
          </div>
          <div class="stat-meta">{{ m.sub }}</div>
        </div>
      </div>

      <p class="pace-line"><strong>{{ paceBanner.title }}.</strong> {{ paceBanner.sub }}</p>

      <div class="dash-two">
        <div>
          <div class="mini-label">Ritmo · {{ MONTH_NAMES[currentMonth-1] }}</div>
          <div v-for="r in paceRows" :key="r.label" class="pace-row">
            <div class="pace-row-head">
              <span>{{ r.label }}</span>
              <span class="tabular">{{ r.current }} / {{ r.target }}</span>
            </div>
            <div class="progress-track"><div class="progress-fill" :style="{ width: r.pct + '%', background: r.color }" /></div>
            <div class="pace-row-note" :style="{ color: r.color }">{{ r.note }}</div>
          </div>
        </div>

        <div>
          <div class="mini-label">Evolucao CE no mes · acumulado vs meta</div>
          <div v-if="diaryPending" class="skel" style="height:88px;margin-top:6px" />
          <svg v-else viewBox="0 0 240 80" style="width:100%;height:88px;overflow:visible">
            <line :x1="0" :y1="ceGoalY" :x2="240" :y2="ceGoalY" stroke="#ece7dd" stroke-width="1" stroke-dasharray="4 3" />
            <text x="2" :y="ceGoalY - 3" fill="#b0a898" font-size="8">meta</text>
            <path :d="sparkAreaPath" fill="#193497" fill-opacity="0.06" />
            <path :d="sparkLinePath" fill="none" stroke="#193497" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <circle v-if="sparkPoints.length" :cx="sparkPoints[sparkPoints.length-1].x" :cy="sparkPoints[sparkPoints.length-1].y" r="3" fill="#193497" />
          </svg>
          <div class="spark-foot">
            <span>{{ monthTotals.ce }} CE acumulados</span>
            <span style="color:var(--text-3)">meta {{ ceNec }}</span>
          </div>
        </div>
      </div>
    </section>

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
  const color = (v: number, n: number) => v>=n ? 'var(--ok)' : v>=n*.8 ? 'var(--warn)' : 'var(--bad)'
  const pct   = (v: number, n: number) => Math.min(100, n>0 ? Math.round((v/n)*100) : 0)
  const ceN   = Math.floor(ceNec.value  * daysGone / totalWorkdays)
  const rmN   = Math.floor(rmNec.value  * daysGone / totalWorkdays)
  return [
    { label:'Contatos efetivos', current:t.ce, target:ceNec.value,  pct:pct(t.ce,ceNec.value),
      color:color(t.ce,ceN),  note:`${cePerDay.value}/dia · hoje: ${quickForm.ce||0}` },
    { label:'Reuniões marcadas', current:t.rm, target:rmNec.value,  pct:pct(t.rm,rmNec.value),
      color:color(t.rm,rmN),  note:`meta: ${rmPerDay.value}/dia` },
    { label:'Fechamentos',       current:t.fr, target:fechNec.value, pct:pct(t.fr,fechNec.value),
      color:t.fr>=fechNec.value?'var(--ok)':'var(--bad)', note:`meta: ${fechNec.value} no mês` },
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

<style scoped>
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
.skel { background:var(--bg-subtle); border-radius:var(--radius-sm); animation:pulse 1.5s infinite; }

.dash { max-width: 1080px; }

/* ── Cabecalho ───────────────────────────────────────────── */
.dash-head { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; }
.dash-greet { font-size:30px; font-weight:600; letter-spacing:-.03em; color:var(--text-1); line-height:1.1; }
.dash-date { font-size:13px; color:var(--text-3); margin-top:7px; text-transform:capitalize; }
.dash-head-right { display:flex; align-items:center; gap:18px; flex-shrink:0; }
.dash-select { font-size:13px; padding:7px 11px; max-width:160px; width:auto; }
.dash-days { display:flex; flex-direction:column; align-items:flex-end; line-height:1.15; }
.dash-days-n { font-size:22px; font-weight:600; color:var(--text-2); }
.dash-days-l { font-size:11px; color:var(--text-3); margin-top:2px; }

/* ── Secao (separada por hairline + muito respiro) ───────── */
.dash-section { margin-top:40px; padding-top:40px; border-top:1px solid var(--border-soft); }

.eyebrow { display:inline-flex; align-items:center; gap:8px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.12em; color:var(--text-3); margin-bottom:18px; }
.eyebrow-dot { width:6px; height:6px; border-radius:50%; background:var(--accent); }
.focus--urgent .eyebrow-dot { background:var(--bad); }
.focus--today .eyebrow-dot, .focus--pace .eyebrow-dot { background:var(--warn); }
.focus--clear .eyebrow-dot { background:var(--ok); }

.section-bar { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:22px; }
.bar-actions { display:flex; align-items:center; gap:12px; }
.saved-flag { font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--ok); }
.hint { font-size:11px; color:var(--text-3); background:var(--bg-subtle); padding:2px 7px; border-radius:var(--radius-sm); }

/* ── Foco agora ──────────────────────────────────────────── */
.focus-grid { display:grid; grid-template-columns:1fr; gap:28px; }
.focus-grid.has-hot { grid-template-columns:minmax(0,1fr) 260px; align-items:start; }
.focus-headline { font-size:25px; font-weight:600; letter-spacing:-.025em; line-height:1.2; color:var(--text-1); max-width:680px; }
.focus-desc { font-size:14px; color:var(--text-2); margin-top:12px; line-height:1.6; max-width:580px; }
.focus-link { display:inline-flex; align-items:center; gap:7px; margin-top:20px; font-size:13px; font-weight:600; color:var(--accent); text-decoration:none; transition:gap .12s; }
.focus-link:hover { gap:11px; }

.hot-aside { display:block; padding:18px; border:1px solid var(--border-soft); border-radius:var(--radius); background:var(--bg-card); text-decoration:none; transition:border-color .12s; }
.hot-aside:hover { border-color:var(--accent-bd); }
.hot-eyebrow { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; color:var(--text-3); }
.hot-name { font-size:15px; font-weight:600; color:var(--text-1); margin-top:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.hot-company { font-size:12px; color:var(--text-2); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.hot-foot { display:flex; align-items:baseline; justify-content:space-between; gap:8px; margin-top:14px; }
.hot-value { font-size:16px; font-weight:600; color:var(--text-1); letter-spacing:-.01em; }
.hot-status { font-size:10px; color:var(--text-3); white-space:nowrap; }

/* ── Faixa panoramica de numeros (sem caixa) ─────────────── */
.stat-strip { display:flex; flex-wrap:wrap; gap:24px 0; }
.stat { flex:1 1 0; min-width:110px; padding:0 26px; border-left:1px solid var(--border-soft); }
.stat:first-child { padding-left:0; border-left:none; }
.stat-num { font-size:30px; font-weight:600; color:var(--text-1); letter-spacing:-.03em; line-height:1; }
.stat-label { font-size:11px; text-transform:uppercase; letter-spacing:.09em; color:var(--text-3); margin-top:10px; display:flex; align-items:center; gap:4px; }
.stat-meta { font-size:11px; color:var(--text-3); margin-top:5px; }

input.stat-input { font-size:30px; font-weight:600; color:var(--text-1); letter-spacing:-.03em; line-height:1; width:100%; border:none; background:transparent; padding:0 0 4px; border-bottom:1px solid var(--border-soft); border-radius:0; transition:border-color .12s; }
input.stat-input:focus { box-shadow:none; border-bottom:1px solid var(--accent); }
input.stat-input::-webkit-outer-spin-button, input.stat-input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }

/* ── Linha de follow-ups ─────────────────────────────────── */
.today-line { margin-top:26px; display:flex; flex-wrap:wrap; align-items:center; gap:10px 18px; font-size:13px; color:var(--text-1); }
.today-line-label { font-size:11px; text-transform:uppercase; letter-spacing:.09em; color:var(--text-3); }
.task-chip { display:inline-flex; align-items:center; gap:8px; }
.today-empty { color:var(--text-3); }
.today-all { margin-left:auto; font-size:13px; font-weight:500; color:var(--accent); text-decoration:none; }

/* ── Pace como frase + colunas fluidas ───────────────────── */
.pace-line { font-size:14px; color:var(--text-2); line-height:1.6; margin:24px 0 0; max-width:700px; }
.pace-line strong { color:var(--text-1); font-weight:600; }

.dash-two { display:grid; grid-template-columns:1.15fr 1fr; gap:48px; margin-top:32px; }
.mini-label { font-size:11px; text-transform:uppercase; letter-spacing:.09em; color:var(--text-3); margin-bottom:16px; }
.pace-row { margin-bottom:18px; }
.pace-row:last-child { margin-bottom:0; }
.pace-row-head { display:flex; justify-content:space-between; font-size:13px; color:var(--text-2); margin-bottom:6px; }
.pace-row-head span:last-child { color:var(--text-1); font-weight:500; }
.pace-row-note { font-size:11px; margin-top:4px; }
.spark-foot { display:flex; justify-content:space-between; font-size:12px; margin-top:8px; color:var(--accent); font-weight:500; }

@media (max-width: 720px) {
  .stat { min-width:80px; padding:0 14px; }
  .stat-num, input.stat-input { font-size:24px; }
  .dash-two { grid-template-columns:1fr; gap:32px; }
  .focus-grid.has-hot { grid-template-columns:1fr; }
}
</style>
