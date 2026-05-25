<template>
  <div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px">
      <div>
        <div class="page-title">Bom {{ greeting }}, {{ firstName }}</div>
        <div class="page-sub">{{ todayLabel }} · semana {{ currentWeek }} de 4</div>
      </div>
      <div style="font-size:11px;color:#a3a3a3;text-align:right">
        <div>{{ workdaysLeft }} dias úteis restantes</div>
        <div>{{ totalWorkdays }} dias úteis no mês</div>
      </div>
    </div>

    <!-- fix #6: banner de vencidos urgentes -->
    <div v-if="overdueLeads.length && !diaryPending"
      style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <span style="font-size:16px">⚠️</span>
      <div style="flex:1;font-size:13px;color:#7f1d1d">
        Você tem <strong>{{ overdueLeads.length }} retorno(s) vencido(s)</strong> para ligar hoje.
      </div>
      <NuxtLink to="/dashboard/followup"
        style="font-size:12px;font-weight:500;color:#dc2626;text-decoration:none;white-space:nowrap">
        Ver agora →
      </NuxtLink>
    </div>

    <!-- Pace banner -->
    <div :style="paceBanner.style"
      style="border-radius:8px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:16px;border:1px solid">
      <div style="font-size:18px">{{ paceBanner.icon }}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">{{ paceBanner.title }}</div>
        <div style="font-size:11px;margin-top:2px;opacity:.8">{{ paceBanner.sub }}</div>
      </div>
      <span class="tag" :class="paceBanner.tagClass">{{ paceBanner.tagLabel }}</span>
    </div>

    <!-- Metric cards with loading (fix #10) -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
      <div v-if="diaryPending" v-for="i in 4" :key="i"
        class="metric-card" style="animation:pulse 1.5s infinite;min-height:72px">
        <div style="height:10px;background:#e5e5e5;border-radius:3px;margin-bottom:8px;width:55%" />
        <div style="height:26px;background:#e5e5e5;border-radius:3px;width:40%" />
      </div>
      <div v-else class="metric-card" v-for="m in metricCards" :key="m.label">
        <div class="metric-label">{{ m.label }}</div>
        <div class="metric-value">{{ m.value }}</div>
        <div class="metric-sub" :class="m.subClass">{{ m.sub }}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <!-- Pace bars -->
      <div class="card">
        <div class="card-label">Ritmo · {{ MONTH_NAMES[currentMonth-1] }}</div>
        <div v-for="r in paceRows" :key="r.label" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:12px;color:#525252">{{ r.label }}</span>
            <span style="font-size:12px;font-weight:500" class="tabular">{{ r.current }} / {{ r.target }}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: r.pct + '%', background: r.color }"></div>
          </div>
          <div style="font-size:11px;margin-top:2px" :style="{ color: r.color }">{{ r.note }}</div>
        </div>
      </div>

      <!-- fix #4: sparkline de evolução diária do CE no mês -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div class="card-label" style="margin-bottom:0">Evolução CE no mês</div>
          <span style="font-size:11px;color:#737373">acumulado vs meta</span>
        </div>
        <div v-if="diaryPending"
          style="height:80px;background:#f5f5f5;border-radius:6px;animation:pulse 1.5s infinite" />
        <svg v-else viewBox="0 0 240 80" style="width:100%;height:80px;overflow:visible">
          <!-- Meta line -->
          <line :x1="0" :y1="ceGoalY" :x2="240" :y2="ceGoalY"
            stroke="#e5e5e5" stroke-width="1" stroke-dasharray="4 2" />
          <text x="2" :y="ceGoalY - 3" fill="#a3a3a3" font-size="8">meta</text>

          <!-- Area fill -->
          <path :d="sparkAreaPath" fill="#2563eb" fill-opacity="0.08" />
          <!-- Line -->
          <path :d="sparkLinePath" fill="none" stroke="#2563eb" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round" />

          <!-- Today dot -->
          <circle v-if="sparkPoints.length"
            :cx="sparkPoints[sparkPoints.length-1].x"
            :cy="sparkPoints[sparkPoints.length-1].y"
            r="3" fill="#2563eb" />

          <!-- X labels (first, mid, last) -->
          <text v-if="sparkPoints.length > 0"
            :x="sparkPoints[0].x" y="78" fill="#a3a3a3" font-size="7" text-anchor="middle">
            1
          </text>
          <text v-if="sparkPoints.length > 1"
            :x="sparkPoints[Math.floor(sparkPoints.length/2)].x" y="78"
            fill="#a3a3a3" font-size="7" text-anchor="middle">
            {{ Math.floor(sparkPoints.length/2) + 1 }}
          </text>
          <text v-if="sparkPoints.length > 2"
            :x="sparkPoints[sparkPoints.length-1].x" y="78"
            fill="#a3a3a3" font-size="7" text-anchor="middle">
            {{ sparkPoints.length }}
          </text>
        </svg>
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-top:4px">
          <span style="color:#2563eb;font-weight:500">{{ monthTotals.ce }} CE acumulados</span>
          <span style="color:#a3a3a3">meta: {{ ceNec }}</span>
        </div>
      </div>
    </div>

    <!-- Today tasks + quick entry -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <div class="card">
        <div class="card-label">Follow-ups hoje</div>
        <div v-if="!todayTasks.length" style="text-align:center;padding:24px 0;color:#a3a3a3;font-size:12px">
          Nenhum retorno urgente 🎉
        </div>
        <div v-for="t in todayTasks" :key="t.id"
          style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f5f5f5">
          <div>
            <div style="font-size:12px;font-weight:500;color:#0a0a0a">{{ t.decisor }}</div>
            <div style="font-size:11px;color:#737373">{{ t.sub }}</div>
          </div>
          <span class="tag" :class="t.tagClass">{{ t.tagLabel }}</span>
        </div>
        <NuxtLink to="/dashboard/followup" style="display:block;margin-top:10px;font-size:12px;color:#2563eb;text-decoration:none">
          Ver todos →
        </NuxtLink>
      </div>

      <!-- Quick entry -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div class="card-label" style="margin-bottom:0">
            Registrar hoje · {{ todayFormatted }}
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <!-- fix #14: keyboard shortcut hint -->
            <span style="font-size:10px;color:#a3a3a3;background:#f5f5f5;padding:2px 6px;border-radius:4px">
              Ctrl+S
            </span>
            <span v-if="alreadySaved" style="font-size:11px;color:#16a34a;font-weight:500">✓ salvo</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px">
          <div v-for="f in quickFields" :key="f.key" style="text-align:center">
            <div style="font-size:10px;color:#a3a3a3;margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">
              {{ f.label }}
            </div>
            <input type="number" v-model.number="quickForm[f.key]" min="0"
              style="text-align:center;font-size:18px;font-weight:500;padding:8px 4px" />
            <div style="font-size:10px;color:#a3a3a3;margin-top:2px">meta: {{ f.meta }}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:11px;color:#737373">
            CE→RM hoje: <strong>{{ todayCERMRate }}%</strong>
            &nbsp;·&nbsp; mês: <strong>{{ monthCERMRate }}%</strong>
          </div>
          <button class="btn btn-primary" :disabled="saving" @click="saveQuick">
            {{ saving ? 'Salvando...' : 'Salvar dia' }}
          </button>
        </div>
      </div>
    </div>

    <Transition name="toast">
      <div v-if="toast" class="toast">✓ {{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const { profile, org } = useProfile()

// ── useOutboundMath elimina lógica duplicada ────────────────────────────
const metaMensal  = computed(() => org.value?.settings?.meta_mensal  || 10000)
const ticketMedio = computed(() => org.value?.settings?.ticket_medio || 2000)

const {
  fechNec, rrNec, rmNec, ceNec,
  cePerDay, rmPerDay,
} = useOutboundMath(metaMensal, ticketMedio)

// ── useLeads para badge de vencidos (fix #6) ───────────────────────────
const { overdueLeads } = useLeads()

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

const showToast    = (m: string) => { toast.value = m; setTimeout(() => toast.value = null, 2500) }
const hour         = now.getHours()
const greeting     = hour < 12 ? 'dia' : hour < 18 ? 'tarde' : 'noite'
const firstName    = computed(() => (profile.value?.name || '').split(' ')[0] || 'BDR')
const todayLabel   = now.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })
const currentWeek  = Math.ceil(now.getDate() / 7)

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

// ── Diary data ─────────────────────────────────────────────────────────
const { data: diaryRows, refresh: refreshDiary, pending: diaryPending } = await useAsyncData(
  'cockpit-diary',
  async () => {
    const ms = `${currentYear}-${String(currentMonth).padStart(2,'0')}-01`
    const me = new Date(currentYear, currentMonth, 0).toISOString().slice(0, 10)
    const { data } = await supabase
      .from('daily_diary').select('*').gte('date', ms).lte('date', me)
      .order('date', { ascending: true })
    return data || []
  }
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
  { key:'rr', label:'RR', meta: '—' },
  { key:'fr', label:'FR', meta: String(fechNec.value) },
])

const todayCERMRate = computed(() =>
  quickForm.ce > 0 ? ((quickForm.rm / quickForm.ce) * 100).toFixed(1) : '0.0'
)
const monthCERMRate = computed(() =>
  monthTotals.value.ce > 0 ? ((monthTotals.value.rm / monthTotals.value.ce) * 100).toFixed(1) : '0.0'
)

// fix #14: Ctrl+S para salvar
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

// ── Sparkline (fix #4) ─────────────────────────────────────────────────
const CHART_W = 240, CHART_H = 68, CHART_PAD = 4

const sparkPoints = computed(() => {
  const rows   = diaryRows.value || []
  if (!rows.length) return []
  const max    = Math.max(ceNec.value, ...rows.map(r => r.ce), 1)
  const step   = rows.length > 1 ? (CHART_W - CHART_PAD * 2) / (rows.length - 1) : CHART_W / 2

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

// ── Pace banner ────────────────────────────────────────────────────────
const ceNeededByToday = computed(() => cePerDay.value * daysGone)
const ceDelta         = computed(() => monthTotals.value.ce - ceNeededByToday.value)

const paceBanner = computed(() => {
  const d = ceDelta.value, t = monthTotals.value
  if (d >= 5)  return { icon:'🎯', tagLabel:`+${d} à frente`,      tagClass:'tag-green',
    title:'Você está no ritmo para bater a meta de CE',
    sub:`${t.ce} de ${ceNec.value} feitos · precisava de ${ceNeededByToday.value} até hoje`,
    style:'background:#f0fdf4;border-color:#bbf7d0;color:#14532d' }
  if (d >= 0)  return { icon:'⚡', tagLabel:'no ritmo',             tagClass:'tag-amber',
    title:'No ritmo — continue focado',
    sub:`${t.ce} de ${ceNec.value} feitos · ${d} acima do necessário`,
    style:'background:#fffbeb;border-color:#fde68a;color:#78350f' }
  return       { icon:'⚠️', tagLabel:`${Math.abs(d)} abaixo`,      tagClass:'tag-red',
    title:`${Math.abs(d)} contatos abaixo do ritmo`,
    sub:`${t.ce} de ${ceNec.value} feitos · precisava de ${ceNeededByToday.value} até hoje`,
    style:'background:#fef2f2;border-color:#fecaca;color:#7f1d1d' }
})

// ── Metric cards ───────────────────────────────────────────────────────
const metricCards = computed(() => {
  const t       = monthTotals.value
  const needed  = Math.floor(ceNec.value  * daysGone / totalWorkdays)
  const rmNeeded = Math.floor(rmNec.value * daysGone / totalWorkdays)
  return [
    { label:'CE no mês',  value:t.ce, sub:`meta: ${ceNec.value}`,
      subClass: t.ce >= needed ? 'metric-ok' : 'metric-bad' },
    { label:'RM no mês',  value:t.rm, sub:`tx: ${monthCERMRate.value}% · meta: ${rmNec.value}`,
      subClass: t.rm >= rmNeeded ? 'metric-ok' : 'metric-warn' },
    { label:'RR no mês',  value:t.rr, sub:`tx RM→RR: ${t.rm>0?((t.rr/t.rm)*100).toFixed(0):0}%`, subClass:'' },
    { label:'FR no mês',  value:t.fr, sub:`meta: ${fechNec.value}`,
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

// ── Today follow-up tasks ──────────────────────────────────────────────
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
</style>
