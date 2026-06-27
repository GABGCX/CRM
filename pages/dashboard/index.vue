<template>
  <div class="dash">
    <!-- Cabecalho -->
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

    <div class="bento">
      <!-- Foco agora -->
      <section class="panel b-focus">
        <div class="focus-eyebrow"><span class="tone-dot" :class="`tone-${focusAction.tone}`" /> Foco agora</div>
        <h2 class="focus-title">{{ focusAction.title }}</h2>
        <p class="focus-desc">{{ focusAction.sub }}</p>
        <NuxtLink :to="focusAction.to" class="btn btn-primary focus-cta">
          {{ focusAction.cta }}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </NuxtLink>
      </section>

      <!-- Lead quente -->
      <component :is="hottestLead ? 'NuxtLink' : 'section'"
        :to="hottestLead ? `/dashboard/pipeline?highlight=${hottestLead.id}` : undefined"
        class="panel b-hot">
        <div class="panel-eyebrow">Lead mais quente</div>
        <template v-if="hottestLead">
          <div class="hot-name">{{ hottestLead.decisor }}</div>
          <div class="hot-company">{{ hottestLead.negocio || 'Sem empresa' }}</div>
          <div class="hot-spacer" />
          <div class="hot-value tabular">R$ {{ (hottestLead.valor_estimado || 0).toLocaleString('pt-BR') }}</div>
          <div class="hot-status">{{ hottestLead.resultado }}</div>
        </template>
        <div v-else class="hot-empty">Nenhuma oportunidade aberta com valor.</div>
      </component>

      <!-- KPIs do mes -->
      <section v-for="m in kpiPanels" :key="m.label" class="panel b-kpi">
        <div class="kpi-label">
          <UiMetricTooltip v-if="m.metric" :metric="m.metric" />
          <span v-else>{{ m.label }}</span>
        </div>
        <div v-if="diaryPending" class="skel" style="height:30px;width:55%;margin-top:12px" />
        <div v-else class="kpi-num tabular" :class="m.cls">{{ m.value }}</div>
        <div class="kpi-sub">{{ m.sub }}</div>
      </section>

      <!-- Registrar hoje -->
      <section class="panel b-reg">
        <div class="panel-head">
          <div class="panel-eyebrow" style="margin-bottom:0">Registrar hoje · {{ todayFormatted }}</div>
          <div class="panel-actions">
            <span v-if="alreadySaved && !saving" class="saved-flag">salvo</span>
            <span class="hint">Ctrl+S</span>
            <button class="btn btn-primary" :disabled="saving" @click="saveQuick">{{ saving ? 'Salvando...' : 'Salvar dia' }}</button>
          </div>
        </div>
        <div class="reg-grid">
          <div v-for="f in quickFields" :key="f.key" class="reg-cell">
            <div class="reg-cell-label">
              <UiMetricTooltip v-if="['LD','CE','RM','RR','FR'].includes(f.label)" :metric="(f.label as MetricKey)" />
              <span v-else>{{ f.label }}</span>
            </div>
            <input type="number" min="0" v-model.number="quickForm[f.key]" class="reg-input tabular" />
            <div class="reg-cell-meta">meta {{ f.meta }}</div>
          </div>
        </div>
        <div class="reg-foot">CE&rarr;RM hoje <strong>{{ todayCERMRate }}%</strong> · mes <strong>{{ monthCERMRate }}%</strong></div>
      </section>

      <!-- Ritmo -->
      <section class="panel b-ritmo">
        <div class="panel-head">
          <div class="panel-eyebrow" style="margin-bottom:0">Ritmo · {{ MONTH_NAMES[currentMonth-1] }}</div>
          <span class="pill" :class="paceBanner.toneClass">{{ paceBanner.tagLabel }}</span>
        </div>
        <div v-for="r in paceRows" :key="r.label" class="pace-row">
          <div class="pace-row-head">
            <span>{{ r.label }}</span>
            <span class="tabular">{{ r.current }} / {{ r.target }}</span>
          </div>
          <div class="track"><div class="track-fill" :style="{ width: r.pct + '%', background: r.color }" /></div>
          <div class="pace-row-note" :style="{ color: r.color }">{{ r.note }}</div>
        </div>
      </section>

      <!-- Follow-ups hoje -->
      <section class="panel b-follow">
        <div class="panel-eyebrow">Follow-ups hoje</div>
        <div v-if="!todayTasks.length" class="follow-empty">Nenhum retorno urgente.</div>
        <NuxtLink v-for="t in todayTasks" :key="t.id" to="/dashboard/followup" class="follow-row">
          <span class="follow-dot" :class="t.cls" />
          <span class="follow-name">{{ t.decisor }}</span>
          <span class="follow-sub">{{ t.sub }}</span>
        </NuxtLink>
        <NuxtLink to="/dashboard/followup" class="follow-all">Ver fila completa &rarr;</NuxtLink>
      </section>

      <!-- Evolucao CE -->
      <section class="panel b-spark">
        <div class="panel-head">
          <div class="panel-eyebrow" style="margin-bottom:0">Evolucao CE no mes</div>
          <span class="spark-cap">acumulado vs meta {{ ceNec }}</span>
        </div>
        <div v-if="diaryPending" class="skel" style="height:96px" />
        <svg v-else viewBox="0 0 240 80" preserveAspectRatio="none" style="width:100%;height:96px;overflow:visible">
          <defs>
            <linearGradient id="ceArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#193497" stop-opacity="0.10"/>
              <stop offset="100%" stop-color="#193497" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <line :x1="0" :y1="ceGoalY" :x2="240" :y2="ceGoalY" stroke="#eaeaea" stroke-width="1" stroke-dasharray="4 4" />
          <path :d="sparkAreaPath" fill="url(#ceArea)" />
          <path :d="sparkLinePath" fill="none" stroke="#193497" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <circle v-if="sparkPoints.length" :cx="sparkPoints[sparkPoints.length-1].x" :cy="sparkPoints[sparkPoints.length-1].y" r="3" fill="#193497" />
        </svg>
        <div class="spark-foot">
          <span>{{ monthTotals.ce }} CE acumulados</span>
          <span class="spark-foot-meta">meta {{ ceNec }}</span>
        </div>
      </section>
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
    tagLabel: `+${d} a frente`, toneClass: 'is-ok',
    title: 'Voce esta no ritmo para bater a meta de CE',
    sub: `${t.ce} de ${ceNec.value} feitos. Precisava de ${ceNeededByToday.value} ate hoje.`,
  }
  if (d >= 0) return {
    tagLabel: 'no ritmo', toneClass: 'is-warn',
    title: 'No ritmo, continue focado',
    sub: `${t.ce} de ${ceNec.value} feitos. ${d} acima do necessario.`,
  }
  return {
    tagLabel: `${Math.abs(d)} abaixo`, toneClass: 'is-bad',
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

// ── KPIs do mes ─────────────────────────────────────────────────────────
const kpiPanels = computed(() => {
  const t = monthTotals.value
  const needed   = Math.floor(ceNec.value  * daysGone / totalWorkdays)
  const rmNeeded = Math.floor(rmNec.value  * daysGone / totalWorkdays)
  return [
    { label:'CE no mês', metric:'CE' as MetricKey, value:t.ce,
      sub:`meta ${ceNec.value}`, cls: t.ce >= needed ? 'is-ok' : 'is-bad' },
    { label:'RM no mês', metric:'RM' as MetricKey, value:t.rm,
      sub:`tx ${monthCERMRate.value}% · meta ${rmNec.value}`,
      cls: t.rm >= rmNeeded ? 'is-ok' : 'is-warn' },
    { label:'RR no mês', metric:'RR' as MetricKey, value:t.rr,
      sub:`RM→RR ${t.rm>0?((t.rr/t.rm)*100).toFixed(0):0}%`, cls:'' },
    { label:'FR no mês', metric:'FR' as MetricKey, value:t.fr,
      sub:`meta ${fechNec.value}`,
      cls: t.fr>=fechNec.value?'is-ok':t.fr>0?'is-warn':'is-bad' },
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
    .order('data_retorno').limit(5)
  return data || []
})

const todayTasks = computed(() => (urgentLeadsData.value||[]).map(l => {
  const diff = Math.floor(
    (new Date(l.data_retorno!).setHours(0,0,0,0) - new Date(todayStr).setHours(0,0,0,0)) / 86400000
  )
  return {
    ...l,
    sub: diff < 0 ? `atrasado ${Math.abs(diff)}d` : diff === 0 ? 'hoje' : 'amanhã',
    cls: diff < 0 ? 'is-bad' : diff === 0 ? 'is-warn' : 'is-info',
  }
}))
</script>

<style scoped>
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
.skel { background:var(--bg-subtle); border-radius:6px; animation:pulse 1.5s infinite; }

.dash { max-width: 1180px; }

/* ── Cabecalho ───────────────────────────────────────────── */
.dash-head { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin-bottom:24px; }
.dash-greet { font-size:24px; font-weight:600; letter-spacing:-.03em; color:var(--text-1); line-height:1.1; }
.dash-date { font-size:13px; color:var(--text-3); margin-top:7px; text-transform:capitalize; }
.dash-head-right { display:flex; align-items:center; gap:18px; flex-shrink:0; }
.dash-select { font-size:13px; padding:7px 11px; max-width:170px; width:auto; }
.dash-days { display:flex; flex-direction:column; align-items:flex-end; line-height:1.15; }
.dash-days-n { font-size:20px; font-weight:600; color:var(--text-2); }
.dash-days-l { font-size:11px; color:var(--text-3); margin-top:2px; }

/* ── Bento ───────────────────────────────────────────────── */
.bento { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.b-focus  { grid-column:span 3; }
.b-hot    { grid-column:span 1; }
.b-kpi    { grid-column:span 1; }
.b-reg    { grid-column:span 4; }
.b-ritmo  { grid-column:span 2; }
.b-follow { grid-column:span 2; }
.b-spark  { grid-column:span 4; }

.panel { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:20px 22px; display:flex; flex-direction:column; box-shadow:var(--shadow-sm); }
.panel-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:18px; }
.panel-actions { display:flex; align-items:center; gap:11px; }
.panel-eyebrow { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.1em; color:var(--text-3); margin-bottom:14px; }
.saved-flag { font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--ok); }
.hint { font-size:11px; color:var(--text-3); background:var(--bg-subtle); border:1px solid var(--border-soft); padding:2px 7px; border-radius:var(--radius-sm); }

/* ── Foco agora ──────────────────────────────────────────── */
.focus-eyebrow { display:inline-flex; align-items:center; gap:8px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.1em; color:var(--text-3); margin-bottom:14px; }
.tone-dot { width:6px; height:6px; border-radius:50%; background:var(--accent); }
.tone-urgent { background:var(--bad); }
.tone-today, .tone-pace { background:var(--warn); }
.tone-clear { background:var(--ok); }
.focus-title { font-size:21px; font-weight:600; letter-spacing:-.02em; line-height:1.28; color:var(--text-1); max-width:600px; }
.focus-desc { font-size:13px; color:var(--text-2); margin-top:11px; line-height:1.6; max-width:540px; }
.focus-cta { align-self:flex-start; margin-top:22px; }

/* ── Lead quente ─────────────────────────────────────────── */
.b-hot { text-decoration:none; transition:border-color .12s, box-shadow .12s; }
.b-hot:hover { border-color:var(--text-3); box-shadow:var(--shadow-md); }
.hot-name { font-size:15px; font-weight:600; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.hot-company { font-size:12px; color:var(--text-2); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.hot-spacer { flex:1; min-height:18px; }
.hot-value { font-size:21px; font-weight:600; color:var(--text-1); letter-spacing:-.02em; }
.hot-status { font-size:11px; color:var(--text-3); margin-top:4px; }
.hot-empty { font-size:12px; color:var(--text-3); line-height:1.5; margin-top:4px; }

/* ── KPIs ────────────────────────────────────────────────── */
.kpi-label { font-size:12px; color:var(--text-2); display:flex; align-items:center; gap:4px; }
.kpi-num { font-size:30px; font-weight:600; color:var(--text-1); letter-spacing:-.035em; line-height:1; margin-top:12px; }
.kpi-num.is-ok { color:var(--ok); }
.kpi-num.is-warn { color:var(--warn); }
.kpi-num.is-bad { color:var(--bad); }
.kpi-sub { font-size:11px; color:var(--text-3); margin-top:9px; }

/* ── Registrar ───────────────────────────────────────────── */
.reg-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; }
.reg-cell { text-align:center; }
.reg-cell-label { font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:var(--text-3); margin-bottom:7px; display:flex; align-items:center; justify-content:center; gap:3px; }
input.reg-input { text-align:center; font-size:22px; font-weight:600; padding:9px 4px; }
.reg-cell-meta { font-size:10px; color:var(--text-3); margin-top:7px; }
.reg-foot { font-size:12px; color:var(--text-2); margin-top:16px; }
.reg-foot strong { color:var(--text-1); font-weight:600; }

/* ── Pill ────────────────────────────────────────────────── */
.pill { font-size:11px; font-weight:600; padding:2px 9px; border-radius:999px; background:var(--bg-subtle); color:var(--text-2); }
.pill.is-ok { color:var(--ok); background:var(--ok-bg); }
.pill.is-warn { color:var(--warn); background:var(--warn-bg); }
.pill.is-bad { color:var(--bad); background:var(--bad-bg); }

/* ── Ritmo ───────────────────────────────────────────────── */
.pace-row { margin-bottom:17px; }
.pace-row:last-child { margin-bottom:0; }
.pace-row-head { display:flex; justify-content:space-between; font-size:13px; color:var(--text-2); margin-bottom:7px; }
.pace-row-head span:last-child { color:var(--text-1); font-weight:600; }
.track { height:6px; background:var(--bg-subtle); border-radius:999px; overflow:hidden; }
.track-fill { height:100%; border-radius:999px; transition:width .35s; }
.pace-row-note { font-size:11px; margin-top:5px; }

/* ── Follow-ups ──────────────────────────────────────────── */
.follow-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--border-soft); text-decoration:none; }
.follow-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.follow-dot.is-bad { background:var(--bad); }
.follow-dot.is-warn { background:var(--warn); }
.follow-dot.is-info { background:var(--info); }
.follow-name { font-size:13px; font-weight:500; color:var(--text-1); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.follow-sub { font-size:12px; color:var(--text-3); flex-shrink:0; }
.follow-empty { font-size:13px; color:var(--text-3); padding:16px 0; }
.follow-all { font-size:13px; font-weight:500; color:var(--accent); text-decoration:none; margin-top:14px; }

/* ── Spark ───────────────────────────────────────────────── */
.spark-cap { font-size:12px; color:var(--text-3); }
.spark-foot { display:flex; justify-content:space-between; font-size:12px; margin-top:10px; color:var(--text-1); font-weight:600; }
.spark-foot-meta { color:var(--text-3); font-weight:400; }

@media (max-width: 920px) {
  .bento { grid-template-columns:repeat(2,1fr); }
  .b-focus, .b-reg, .b-ritmo, .b-follow, .b-spark { grid-column:span 2; }
  .b-hot, .b-kpi { grid-column:span 1; }
}
@media (max-width: 540px) {
  .bento { grid-template-columns:1fr; }
  .b-focus, .b-hot, .b-kpi, .b-reg, .b-ritmo, .b-follow, .b-spark { grid-column:span 1; }
  .reg-grid { gap:7px; }
  input.reg-input { font-size:18px; }
}
</style>
