<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div>
        <div class="eyebrow" style="margin-bottom:6px">Registro diário</div>
        <div class="page-title">Meu Dia</div>
        <div class="page-sub">{{ MONTH_NAMES[currentMonth-1] }} {{ currentYear }}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <button class="btn" @click="changeMonth(-1)" title="Mês anterior" style="padding:5px 8px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style="font-size:13px;font-weight:500;min-width:120px;text-align:center">{{ MONTH_NAMES[currentMonth-1] }} {{ currentYear }}</span>
        <button class="btn" @click="changeMonth(1)" title="Próximo mês" style="padding:5px 8px"
          :disabled="currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <button v-if="currentMonth !== now.getMonth() + 1 || currentYear !== now.getFullYear()"
          class="btn" @click="goToCurrentMonth"
          style="font-size:11px;padding:4px 10px;color:#0f62fe;border-color:var(--accent-bd);background:var(--accent-soft)">
          Mês atual
        </button>
      </div>
    </div>

    <!-- Registro do dia (hero) -->
    <div class="card md-today">
      <div class="md-today-head">
        <div class="card-label" style="margin-bottom:0">{{ isToday ? 'Registro de hoje' : 'Editar dia' }} · {{ fmtDateBr(form.date) }}</div>
        <input type="date" v-model="form.date" :max="todayStr" @change="onDateChange" class="md-date" />
      </div>
      <div class="md-steppers">
        <div v-for="f in FIELDS" :key="f.key" class="md-stepper">
          <div class="md-stepper-label" :style="{ color: f.color }">{{ f.label }}</div>
          <div class="md-stepper-row">
            <button class="md-step-btn" @click="step(f.key, -1)" :disabled="form[f.key] === 0" aria-label="menos">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <input type="number" v-model.number="form[f.key]" min="0" class="md-step-input tabular" />
            <button class="md-step-btn md-step-plus" @click="step(f.key, 1)" aria-label="mais">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          <div class="md-stepper-goal">
            <template v-if="f.meta !== 'N/A'">
              <span>meta {{ f.meta }}</span>
              <div class="md-progress"><div class="md-progress-fill" :style="{ width: pct(form[f.key], f.meta), background: f.color }" /></div>
            </template>
            <span v-else style="color:var(--text-3)">livre</span>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" :disabled="saving" @click="save" style="width:100%;justify-content:center;margin-top:4px">
        {{ saving ? 'Salvando...' : selectedEntry ? 'Atualizar dia' : 'Salvar dia' }}
      </button>
    </div>

    <!-- Resumo do mês -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0" class="md-totals">
      <UiMetricCard v-for="m in totalCards" :key="m.label" :value="m.value" :sub="m.sub" :sub-class="m.subClass">
        <template #label>
          <UiMetricTooltip v-if="['CE total','RM total','RR total','FR total'].includes(m.label)"
            :metric="(m.label.split(' ')[0] as MetricKey)" />
          <span v-else>{{ m.label }}</span>
        </template>
      </UiMetricCard>
    </div>

    <!-- Histórico -->
    <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div class="card-label" style="margin-bottom:0">{{ entries.length }} dias registrados</div>
          <div style="display:flex;gap:12px;font-size:11px;color:var(--text-2)">
            <span>CE→RM: <strong style="color:var(--text-1)">{{ monthCERMRate }}%</strong></span>
            <span>RM→RR: <strong style="color:var(--text-1)">{{ monthRMRRRate }}%</strong></span>
          </div>
        </div>

        <div v-if="!entries.length"
          style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 16px;text-align:center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:12px">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div style="font-size:14px;font-weight:500;color:var(--text-2);margin-bottom:4px">Nenhum dia registrado</div>
          <div style="font-size:12px;color:var(--text-3)">Selecione uma data e preencha as métricas.</div>
        </div>

        <div v-else style="overflow-x:auto;-webkit-overflow-scrolling:touch">
        <table style="width:100%;min-width:460px;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="border-bottom:1px solid var(--border-soft)">
              <th style="text-align:left;font-size:10px;font-weight:500;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;padding:0 8px 8px 0">Dia</th>
              <th v-for="f in FIELDS" :key="f.key" style="text-align:right;font-size:10px;font-weight:500;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;padding:0 8px 8px 0">{{ f.key.toUpperCase() }}</th>
              <th style="text-align:center;font-size:10px;font-weight:500;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;padding:0 0 8px">vs meta</th>
              <th style="width:32px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in entries" :key="e.id"
              @click="selectEntry(e)"
              style="cursor:pointer;transition:background .1s"
              :style="{ background: form.date === e.date ? 'var(--accent-soft)' : 'transparent' }"
              onmouseenter="this.style.background='var(--bg-subtle)'"
              onmouseleave="this.style.background=''">
              <td style="padding:8px 8px 8px 0;color:var(--text-1);font-weight:500;white-space:nowrap"
                :style="{ borderLeft: form.date === e.date ? '2px solid #0f62fe' : '2px solid transparent', paddingLeft: '6px' }">
                {{ fmtDateBr(e.date) }}
                <span v-if="e.date === todayStr" style="font-size:10px;color:#0f62fe;margin-left:4px">hoje</span>
              </td>
              <td v-for="f in FIELDS" :key="f.key"
                style="text-align:right;padding:8px;font-variant-numeric:tabular-nums;font-weight:500"
                :style="{ color: f.color }">
                {{ e[f.key] }}
              </td>
              <td style="text-align:center;padding:8px">
                <span class="tag" :class="dayTag(e).cls">{{ dayTag(e).label }}</span>
              </td>
              <td style="text-align:center;padding:4px">
                <button @click.stop="remove(e.id)"
                  style="border:none;background:none;color:var(--text-3);cursor:pointer;padding:4px;border-radius:4px;font-size:13px"
                  onmouseenter="this.style.color='#dc2626'"
                  onmouseleave="this.style.color='#cbd5e1'">
                  <i class="ti ti-trash" aria-hidden="true"></i>
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="border-top:1px solid var(--border)">
              <td style="padding:10px 8px 0 0;font-size:12px;font-weight:500;color:var(--text-2)">Total</td>
              <td v-for="f in FIELDS" :key="f.key"
                style="text-align:right;padding:10px 8px 0;font-weight:600;font-variant-numeric:tabular-nums"
                :style="{ color: f.color }">
                {{ monthTotals[f.key] }}
              </td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>

    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { DiaryEntry, MetricKey } from '~/types'
import { localDateISO } from '~/utils/leadDomain'
definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const { org } = useProfile()

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const now = new Date()
const todayStr = localDateISO(now)

const currentMonth = ref(now.getMonth() + 1)
const currentYear  = ref(now.getFullYear())
const toast  = ref<string|null>(null)
const saving = ref(false)

const showToast = (m: string) => { toast.value = m; setTimeout(() => toast.value = null, 2500) }
const fmtDateBr = (iso: string) => new Date(iso+'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', weekday:'short' })

function goToCurrentMonth() {
  currentMonth.value = now.getMonth() + 1
  currentYear.value  = now.getFullYear()
}

function changeMonth(d: number) {
  let m = currentMonth.value + d, y = currentYear.value
  if (m > 12) { m = 1; y++ }
  if (m < 1)  { m = 12; y-- }
  currentMonth.value = m; currentYear.value = y
}

// Metas
const cePerDay = computed(() => {
  const s = org.value?.settings
  if (!s) return 37
  const fechNec = Math.ceil((s.meta_mensal||10000) / (s.ticket_medio||2000))
  const rmNec = Math.ceil(fechNec / 0.4 / 0.4)
  const ceNec = Math.ceil(rmNec / 0.027)
  return Math.ceil(ceNec / 22)
})
const rmPerDay = computed(() => Math.max(1, Math.ceil(cePerDay.value * 0.027)))

// Paleta categorica Carbon, alinhada com Relatórios (LD cinza = volume bruto,
// CE/RM/RR/FR = conversoes). Hex literal: vao em :style de cor/barra.
const FIELDS = computed(() => [
  { key:'ld', label:'Ligações',          color:'#8d8d8d', meta: 'N/A' },
  { key:'ce', label:'Contatos efetivos', color:'#0f62fe', meta: String(cePerDay.value) },
  { key:'rm', label:'Reuniões marcadas', color:'#8a3ffc', meta: String(rmPerDay.value) },
  { key:'rr', label:'Reuniões realizadas',color:'#009d9a', meta: 'N/A' },
  { key:'fr', label:'Fechamentos',        color:'#24a148', meta: 'N/A' },
] as const)

// Fetch
const { data: entries, refresh } = await useAsyncData<DiaryEntry[]>(
  () => `diary-${currentYear.value}-${currentMonth.value}`,
  () => $fetch<DiaryEntry[]>('/api/diary', { query:{ month:currentMonth.value, year:currentYear.value } }),
  { watch:[currentMonth, currentYear], default:()=>[] }
)

const monthTotals = computed(() => (entries.value||[]).reduce(
  (a,e) => ({ ld:a.ld+(e.ld||0), ce:a.ce+e.ce, rm:a.rm+e.rm, rr:a.rr+e.rr, fr:a.fr+e.fr }),
  { ld:0, ce:0, rm:0, rr:0, fr:0 }
))

const monthCERMRate = computed(() => monthTotals.value.ce > 0 ? ((monthTotals.value.rm/monthTotals.value.ce)*100).toFixed(1) : '0.0')
const monthRMRRRate = computed(() => monthTotals.value.rm > 0 ? ((monthTotals.value.rr/monthTotals.value.rm)*100).toFixed(0) : '0')

// Total cards
const totalCards = computed(() => {
  const t = monthTotals.value
  const daysWithEntries = (entries.value||[]).length
  return [
    { label:'CE total', value:t.ce, sub:`média: ${daysWithEntries>0?Math.round(t.ce/daysWithEntries):0}/dia`, subClass: t.ce > 0 ? 'metric-ok' : '' },
    { label:'RM total', value:t.rm, sub:`tx: ${monthCERMRate.value}%`, subClass: parseFloat(monthCERMRate.value) >= 2.5 ? 'metric-ok' : 'metric-warn' },
    { label:'RR total', value:t.rr, sub:`tx: ${monthRMRRRate.value}%`, subClass:'' },
    { label:'FR total', value:t.fr, sub:`faturamento: R$ ${(t.fr * (org.value?.settings?.ticket_medio||2000)).toLocaleString('pt-BR')}`, subClass: t.fr > 0 ? 'metric-ok' : '' },
  ]
})

// Form
const form = reactive<Record<string,any>>({ date: todayStr, ld:0, ce:0, rm:0, rr:0, fr:0 })
const selectedEntry = computed(() => (entries.value||[]).find((e:any) => e.date === form.date) || null)

const isToday = computed(() => form.date === todayStr)

function onDateChange() {
  const e = selectedEntry.value
  if (e) { form.ld=e.ld||0; form.ce=e.ce; form.rm=e.rm; form.rr=e.rr; form.fr=e.fr }
  else   { form.ld=0; form.ce=0; form.rm=0; form.rr=0; form.fr=0 }
}

function step(key: 'ld'|'ce'|'rm'|'rr'|'fr', delta: number) {
  const v = (form[key] || 0) + delta
  if (v >= 0) form[key] = v
}

function pct(value: number, meta: string) {
  const m = Number(meta)
  return m > 0 ? Math.min(100, (value / m) * 100) + '%' : '0%'
}

function selectEntry(e: DiaryEntry) {
  form.date=e.date; form.ld=e.ld||0; form.ce=e.ce; form.rm=e.rm; form.rr=e.rr; form.fr=e.fr
}

async function save() {
  saving.value = true
  try {
    await $fetch('/api/diary', { method:'POST', body:{ date:form.date, ld:form.ld||0, ce:form.ce||0, rm:form.rm||0, rr:form.rr||0, fr:form.fr||0 } })
    await refresh()
    showToast(selectedEntry.value ? 'Dia atualizado!' : 'Dia salvo!')
  } finally { saving.value = false }
}

async function remove(id: string) {
  if (!confirm('Remover este registro?')) return
  await $fetch(`/api/diary/${id}`, { method:'DELETE' })
  await refresh()
  showToast('Removido.')
}

// Day performance tag
function dayTag(e: DiaryEntry) {
  const ceGoal = cePerDay.value
  if (e.ce === 0) return { cls:'tag-gray', label:'zerou' }
  if (e.ce >= ceGoal && e.rm >= 1) return { cls:'tag-green', label:'acima' }
  if (e.ce >= ceGoal * 0.8) return { cls:'tag-amber', label:'parcial' }
  return { cls:'tag-red', label:'abaixo' }
}
</script>

<style scoped>
.md-today-head { display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;flex-wrap:wrap }
.md-date { width:auto;flex-shrink:0 }
.md-steppers { display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:10px;margin-bottom:14px }
@media (max-width:640px){ .md-steppers{ grid-template-columns:repeat(2,1fr) } }
.md-stepper { background:var(--bg-subtle);border:1px solid var(--border-soft);border-radius:10px;padding:12px 10px;display:flex;flex-direction:column;gap:8px }
.md-stepper-label { font-size:11px;font-weight:600;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.md-stepper-row { display:flex;align-items:center;gap:6px }
.md-step-btn { width:30px;height:34px;border-radius:7px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-2);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .1s }
.md-step-btn:hover:not(:disabled){ border-color:var(--accent);color:var(--accent) }
.md-step-btn:disabled{ opacity:.35;cursor:not-allowed }
.md-step-plus{ background:var(--accent);border-color:var(--accent);color:#fff }
.md-step-plus:hover:not(:disabled){ background:var(--accent-dark);border-color:var(--accent-dark);color:#fff }
.md-step-input { width:100%;text-align:center;font-size:var(--num-md);font-weight:600;padding:5px 2px;color:var(--text-1);font-family:var(--font-mono);font-variant-numeric:tabular-nums }
.md-stepper-goal { font-size:10px;color:var(--text-3);text-align:center;display:flex;flex-direction:column;gap:4px;align-items:center }
.md-progress { width:100%;height:4px;background:var(--border-soft);border-radius:2px;overflow:hidden }
.md-progress-fill { height:100%;border-radius:2px;transition:width .3s }
@media (max-width:640px){ .md-totals{ grid-template-columns:repeat(2,1fr) !important } }
</style>
