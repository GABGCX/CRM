<template>
  <div>
    <div style="margin-bottom:20px">
      <div class="page-title">Relatórios</div>
      <div class="page-sub">Análise de desempenho do funil comercial</div>
    </div>

    <!-- Filtros -->
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
      <div style="display:flex;gap:2px;background:#f1f5f9;border-radius:10px;padding:3px">
        <button v-for="opt in [{ value: 3, label: '3 meses' }, { value: 6, label: '6 meses' }, { value: 12, label: '1 ano' }]"
          :key="opt.value"
          type="button"
          @click="months = opt.value"
          style="padding:5px 14px;border-radius:8px;border:none;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .12s"
          :style="months === opt.value
            ? 'background:#fff;color:#282828;box-shadow:0 1px 3px rgba(0,0,0,.08)'
            : 'background:transparent;color:#64748b'">
          {{ opt.label }}
        </button>
      </div>
      <select v-if="profile?.role !== 'bdr'" v-model="selectedUser" style="width:auto">
        <option value="">Toda a equipe</option>
        <option v-for="m in membersList" :key="m.id" :value="m.id">{{ m.name || m.email }}</option>
      </select>
    </div>

    <!-- KPIs do período -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px">
      <UiMetricCard v-for="k in kpis" :key="k.label"
        :value="k.value.toLocaleString('pt-BR')" :sub="k.sub" :sub-class="k.subClass">
        <template #label>
          <UiMetricTooltip v-if="k.metric" :metric="k.metric" />
          <span v-else>{{ k.label }}</span>
        </template>
      </UiMetricCard>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">

      <!-- Funil por mês (barras horizontais) -->
      <div class="card">
        <div class="card-label">Funil por mes: CE &gt; RM &gt; RR &gt; FR</div>
        <div v-if="funnelLoading" style="height:160px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px">
          Carregando...
        </div>
        <div v-else-if="!funnelData.length" style="height:160px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px">
          Sem dados no período.
        </div>
        <div v-else style="overflow-x:auto">
          <div style="display:flex;flex-direction:column;gap:10px;min-width:240px">
            <div v-for="row in funnelData" :key="row.month">
              <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;font-weight:500">
                {{ formatMonth(row.month) }}
              </div>
              <div v-for="(bar, label) in funnelBars(row)" :key="label"
                style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <div style="width:24px;font-size:10px;color:#64748b;text-align:right;flex-shrink:0">{{ label }}</div>
                <div style="flex:1;height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden">
                  <div :style="{ width: bar.pct + '%', background: bar.color, height:'100%', borderRadius:'99px', transition:'width .3s' }" />
                </div>
                <div style="width:28px;font-size:11px;color:#282828;text-align:right;flex-shrink:0;font-weight:500">{{ bar.value }}</div>
                <div v-if="label !== 'CE'" style="width:36px;font-size:10px;color:#94a3b8;flex-shrink:0">
                  {{ row.ce > 0 ? (bar.value / row.ce * 100).toFixed(1) + '%' : '-' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Leads por status (donut via SVG) -->
      <div class="card">
        <div class="card-label">Leads por status</div>
        <div v-if="statusLoading" style="height:160px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px">
          Carregando...
        </div>
        <div v-else-if="!statusData.length" style="height:160px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px">
          Sem dados.
        </div>
        <div v-else style="display:flex;gap:12px;align-items:flex-start">
          <!-- Donut SVG -->
          <svg width="100" height="100" viewBox="0 0 100 100" style="flex-shrink:0">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" stroke-width="16"/>
            <circle
              v-for="(seg, i) in donutSegments" :key="i"
              cx="50" cy="50" r="38"
              fill="none"
              :stroke="seg.color"
              stroke-width="16"
              :stroke-dasharray="`${seg.dash} ${239 - seg.dash}`"
              :stroke-dashoffset="seg.offset"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <!-- Legenda -->
          <div style="flex:1;display:flex;flex-direction:column;gap:5px;overflow:hidden">
            <div v-for="s in statusData.slice(0,6)" :key="s.status"
              style="display:flex;align-items:center;gap:6px;font-size:12px">
              <div :style="{ width:'8px', height:'8px', borderRadius:'50%', background: statusColor(s.status), flexShrink:0 }"/>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#475569">{{ s.status }}</span>
              <span style="margin-left:auto;font-weight:600;color:#282828;flex-shrink:0">{{ s.count }}</span>
              <span style="font-size:10px;color:#94a3b8;flex-shrink:0">
                {{ statusData.reduce((a,b) => a + b.count, 0) > 0 ? (s.count / statusData.reduce((a,b) => a + b.count, 0) * 100).toFixed(0) + '%' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Motivos de perda + CE line — side by side -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">

    <!-- Motivos de perda -->
    <div class="card">
      <div class="card-label">Motivos de perda</div>
      <div v-if="lossLoading" style="height:120px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px">
        Carregando...
      </div>
      <div v-else-if="!lossData.length" style="height:120px;display:flex;align-items:center;justify-content:center;text-align:center">
        <div>
          <div style="font-size:13px;color:#94a3b8">Nenhum lead com motivo de perda registrado.</div>
          <div style="font-size:11px;color:#b0a898;margin-top:4px">Registre um motivo ao mover um lead para Recusado ou Sem interesse.</div>
        </div>
      </div>
      <div v-else>
        <div style="font-size:11px;color:#94a3b8;margin-bottom:10px">
          Total: {{ lossTotal }} leads com motivo registrado
        </div>
        <div style="display:flex;flex-direction:column;gap:7px">
          <div v-for="row in lossData" :key="row.reason">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
              <span style="font-size:12px;font-weight:500;color:var(--text-1)">{{ row.reason }}</span>
              <span style="font-size:12px;color:var(--text-2);font-variant-numeric:tabular-nums">
                {{ row.count }} &middot; {{ lossTotal > 0 ? ((row.count / lossTotal) * 100).toFixed(0) + '%' : '0%' }}
              </span>
            </div>
            <div style="height:6px;background:var(--bg-subtle);border-radius:99px;overflow:hidden">
              <div :style="{
                width: lossTotal > 0 ? (row.count / lossData[0].count * 100) + '%' : '0%',
                height: '100%',
                background: '#ef4444',
                borderRadius: '99px',
                transition: 'width .35s',
                opacity: 0.5 + (row.count / lossData[0].count) * 0.5
              }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Evolução de CE ao longo do tempo (linha simplificada) -->
    <div class="card">
      <div class="card-label">Contatos Efetivos (CE) por mês</div>
      <div v-if="!funnelData.length" style="padding:24px;text-align:center;color:#94a3b8;font-size:12px">
        Sem dados.
      </div>
      <div v-else style="overflow-x:auto">
        <svg :width="Math.max(400, funnelData.length * 80)" height="100" style="display:block">
          <polyline
            :points="ceLinePoints"
            fill="none"
            stroke="#193497"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <circle
            v-for="(pt, i) in cePoints" :key="i"
            :cx="pt.x" :cy="pt.y" r="3"
            fill="#193497"
          />
          <text
            v-for="(pt, i) in cePoints" :key="'l'+i"
            :x="pt.x" :y="pt.y - 7"
            font-size="9" text-anchor="middle" fill="#64748b"
          >{{ pt.val }}</text>
          <text
            v-for="(pt, i) in cePoints" :key="'m'+i"
            :x="pt.x" :y="96"
            font-size="9" text-anchor="middle" fill="#94a3b8"
          >{{ formatMonthShort(funnelData[i].month) }}</text>
        </svg>
      </div>
    </div>

    </div><!-- end grid motivos+CE -->

  </div>
</template>

<script setup lang="ts">
import type { Profile } from '~/types'
definePageMeta({ layout: 'dashboard' })

const { profile } = useProfile()

const months      = ref(6)
const selectedUser = ref('')

// ── Membros para filtro (owner/admin) ──────────────────────────────────
const membersList = ref<(Profile & { email: string })[]>([])
onMounted(async () => {
  if (profile.value?.role !== 'bdr') {
    try {
      membersList.value = await $fetch<(Profile & { email: string })[]>('/api/settings/members')
    } catch { /* silencioso */ }
  }
})

// ── Funil ──────────────────────────────────────────────────────────────
interface FunnelRow { month: string; ce: number; rm: number; rr: number; fr: number }
const funnelData    = ref<FunnelRow[]>([])
const funnelLoading = ref(false)

async function loadFunnel() {
  funnelLoading.value = true
  try {
    const params = new URLSearchParams({ months: String(months.value) })
    if (selectedUser.value) params.set('user_id', selectedUser.value)
    funnelData.value = await $fetch<FunnelRow[]>(`/api/reports/funnel?${params}`)
  } finally {
    funnelLoading.value = false
  }
}

// ── Status ─────────────────────────────────────────────────────────────
interface StatusRow { status: string; count: number }
const statusData    = ref<StatusRow[]>([])
const statusLoading = ref(false)

async function loadStatus() {
  statusLoading.value = true
  try {
    statusData.value = await $fetch<StatusRow[]>('/api/reports/leads-by-status')
    statusData.value.sort((a, b) => b.count - a.count)
  } finally {
    statusLoading.value = false
  }
}

// ── Motivos de perda ───────────────────────────────────────────────────
interface LossRow { reason: string; count: number }
const lossData    = ref<LossRow[]>([])
const lossLoading = ref(false)

async function loadLossReasons() {
  lossLoading.value = true
  try {
    lossData.value = await $fetch<LossRow[]>('/api/reports/loss-reasons')
  } finally {
    lossLoading.value = false
  }
}

const lossTotal = computed(() => lossData.value.reduce((s, r) => s + r.count, 0))

watch([months, selectedUser], () => loadFunnel(), { immediate: true })
onMounted(() => { loadStatus(); loadLossReasons() })

// ── KPIs ───────────────────────────────────────────────────────────────
const kpis = computed(() => {
  const tot = funnelData.value.reduce((a, r) => ({
    ce: a.ce + r.ce, rm: a.rm + r.rm, rr: a.rr + r.rr, fr: a.fr + r.fr
  }), { ce: 0, rm: 0, rr: 0, fr: 0 })
  const txCeRm = tot.ce ? ((tot.rm / tot.ce) * 100).toFixed(1) : '0'
  const txRrFr = tot.rr ? ((tot.fr / tot.rr) * 100).toFixed(1) : '0'
  return [
    { label: 'Contatos efetivos',  metric: 'CE' as const, value: tot.ce, sub: `${months.value} meses`, subClass: '' },
    { label: 'Reunioes marcadas',  metric: 'RM' as const, value: tot.rm, sub: `TX ${txCeRm}% de CE`,  subClass: '' },
    { label: 'Reunioes realizadas',metric: 'RR' as const, value: tot.rr, sub: '',                      subClass: '' },
    { label: 'Fechamentos',        metric: 'FR' as const, value: tot.fr, sub: `TX ${txRrFr}% de RR`,  subClass: tot.fr > 0 ? 'metric-ok' : '' },
  ]
})

// ── Funil bars ─────────────────────────────────────────────────────────
const FUNNEL_COLORS = { CE: '#193497', RM: '#7c3aed', RR: '#d97706', FR: '#16a34a' }

function funnelBars(row: FunnelRow) {
  const max = row.ce || 1
  return {
    CE: { value: row.ce, pct: 100, color: '#193497' },
    RM: { value: row.rm, pct: (row.rm / max) * 100, color: '#7c3aed' },
    RR: { value: row.rr, pct: (row.rr / max) * 100, color: '#d97706' },
    FR: { value: row.fr, pct: (row.fr / max) * 100, color: '#16a34a' },
  }
}

// ── Donut ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  'Aguardando retorno': '#f59e0b', 'Follow-up': '#3b82f6', 'De molho': '#8b5cf6',
  'Reunião agendada': '#14b8a6', 'Enviar proposta': '#f97316', 'Proposta enviada': '#6366f1',
  'Fechado': '#22c55e', 'Recusado': '#ef4444', 'Sem interesse': '#94a3b8', 'Não atende': '#cbd5e1',
}
function statusColor(s: string) { return STATUS_COLORS[s] || '#e2e8f0' }

const CIRCUM = 2 * Math.PI * 38 // ≈ 238.76

const donutSegments = computed(() => {
  const total = statusData.value.reduce((s, r) => s + r.count, 0) || 1
  let offset = 0
  return statusData.value.map(r => {
    const pct = r.count / total
    const dash = pct * CIRCUM
    const seg = { dash, offset: -offset, color: statusColor(r.status) }
    offset += dash
    return seg
  })
})

// ── CE line chart ──────────────────────────────────────────────────────
const cePoints = computed(() => {
  if (!funnelData.value.length) return []
  const vals = funnelData.value.map(r => r.ce)
  const maxVal = Math.max(...vals, 1)
  const w = Math.max(400, funnelData.value.length * 80)
  const step = w / (vals.length + 1)
  return vals.map((v, i) => ({
    x: step * (i + 1),
    y: 80 - (v / maxVal) * 65,
    val: v,
  }))
})

const ceLinePoints = computed(() =>
  cePoints.value.map(p => `${p.x},${p.y}`).join(' ')
)

// ── Formatadores ───────────────────────────────────────────────────────
function formatMonth(m: string) {
  return new Date(m + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
function formatMonthShort(m: string) {
  return new Date(m + '-02').toLocaleDateString('pt-BR', { month: 'short' })
}
</script>
