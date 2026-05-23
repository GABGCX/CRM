<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div>
        <div class="page-title">Diário de bordo</div>
        <div class="page-sub">{{ MONTH_NAMES[currentMonth-1] }} {{ currentYear }}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <button class="btn" @click="changeMonth(-1)">‹</button>
        <span style="font-size:13px;font-weight:500;min-width:120px;text-align:center">{{ MONTH_NAMES[currentMonth-1] }} {{ currentYear }}</span>
        <button class="btn" @click="changeMonth(1)">›</button>
      </div>
    </div>

    <!-- Month totals -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
      <div class="metric-card" v-for="m in totalCards" :key="m.label">
        <div class="metric-label">{{ m.label }}</div>
        <div class="metric-value">{{ m.value }}</div>
        <div class="metric-sub" :class="m.subClass">{{ m.sub }}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:280px 1fr;gap:12px">
      <!-- Form -->
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="card">
          <div class="card-label">{{ selectedEntry ? 'Editar · ' + fmtDateBr(form.date) : 'Novo registro' }}</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Data</div>
              <input type="date" v-model="form.date" :max="todayStr" @change="onDateChange" />
            </div>
            <div v-for="f in FIELDS" :key="f.key">
              <div style="font-size:11px;margin-bottom:3px" :style="{ color: f.color }">{{ f.label }}</div>
              <input type="number" v-model.number="form[f.key]" min="0" :placeholder="'meta: ' + f.meta" />
            </div>
            <button class="btn btn-primary" :disabled="saving" @click="save" style="width:100%;justify-content:center">
              {{ saving ? 'Salvando...' : selectedEntry ? 'Atualizar' : 'Salvar dia' }}
            </button>
          </div>
        </div>

        <!-- Metas reference -->
        <div class="card">
          <div class="card-label">Metas diárias</div>
          <div v-for="f in FIELDS" :key="f.key"
            style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f5f5f5">
            <span style="font-size:12px;color:#525252">{{ f.label }}</span>
            <span style="font-size:14px;font-weight:500" :style="{ color: f.color }">{{ f.meta }}</span>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div class="card-label" style="margin-bottom:0">{{ entries.length }} dias registrados</div>
          <div style="display:flex;gap:12px;font-size:11px;color:#737373">
            <span>CE→RM: <strong style="color:#0a0a0a">{{ monthCERMRate }}%</strong></span>
            <span>RM→RR: <strong style="color:#0a0a0a">{{ monthRMRRRate }}%</strong></span>
          </div>
        </div>

        <div v-if="!entries.length" style="text-align:center;padding:40px 0;color:#a3a3a3;font-size:13px">
          Nenhum dia registrado.<br>
          <span style="font-size:12px">Selecione uma data e preencha as métricas.</span>
        </div>

        <table v-else style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="border-bottom:1px solid #f0f0f0">
              <th style="text-align:left;font-size:10px;font-weight:500;color:#a3a3a3;text-transform:uppercase;letter-spacing:.06em;padding:0 8px 8px 0">Dia</th>
              <th v-for="f in FIELDS" :key="f.key" style="text-align:right;font-size:10px;font-weight:500;color:#a3a3a3;text-transform:uppercase;letter-spacing:.06em;padding:0 8px 8px 0">{{ f.key.toUpperCase() }}</th>
              <th style="text-align:center;font-size:10px;font-weight:500;color:#a3a3a3;text-transform:uppercase;letter-spacing:.06em;padding:0 0 8px">vs meta</th>
              <th style="width:32px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in entries" :key="e.id"
              @click="selectEntry(e)"
              style="cursor:pointer;transition:background .1s"
              :style="{ background: form.date === e.date ? '#f5f5f5' : 'transparent' }"
              onmouseenter="this.style.background='#f9f9f9'"
              onmouseleave="this.style.background=''">
              <td style="padding:8px 8px 8px 0;color:#0a0a0a;font-weight:500;white-space:nowrap">
                {{ fmtDateBr(e.date) }}
                <span v-if="e.date === todayStr" style="font-size:10px;color:#2563eb;margin-left:4px">hoje</span>
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
                  style="border:none;background:none;color:#d1d5db;cursor:pointer;padding:4px;border-radius:4px;font-size:13px"
                  onmouseenter="this.style.color='#dc2626'"
                  onmouseleave="this.style.color='#d1d5db'">
                  <i class="ti ti-trash" aria-hidden="true"></i>
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="border-top:1px solid #e5e5e5">
              <td style="padding:10px 8px 0 0;font-size:12px;font-weight:500;color:#737373">Total</td>
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
      <div v-if="toast" class="toast">✓ {{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const { org } = useProfile()

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const now = new Date()
const todayStr = now.toISOString().slice(0,10)

const currentMonth = ref(now.getMonth() + 1)
const currentYear  = ref(now.getFullYear())
const toast  = ref<string|null>(null)
const saving = ref(false)

const showToast = (m: string) => { toast.value = m; setTimeout(() => toast.value = null, 2500) }
const fmtDateBr = (iso: string) => new Date(iso+'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', weekday:'short' })

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

const FIELDS = computed(() => [
  { key:'ce', label:'Contatos efetivos', color:'#2563eb', meta: String(cePerDay.value) },
  { key:'rm', label:'Reuniões marcadas', color:'#7c3aed', meta: String(rmPerDay.value) },
  { key:'rr', label:'Reuniões realizadas',color:'#0d9488', meta: '—' },
  { key:'fr', label:'Fechamentos',        color:'#d97706', meta: '—' },
] as const)

// Fetch
const { data: entries, refresh } = await useAsyncData<any[]>(
  () => `diary-${currentYear.value}-${currentMonth.value}`,
  () => $fetch('/api/diary', { query:{ month:currentMonth.value, year:currentYear.value } }),
  { watch:[currentMonth, currentYear], default:()=>[] }
)

const monthTotals = computed(() => (entries.value||[]).reduce(
  (a,e) => ({ ce:a.ce+e.ce, rm:a.rm+e.rm, rr:a.rr+e.rr, fr:a.fr+e.fr }),
  { ce:0, rm:0, rr:0, fr:0 }
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
const form = reactive<Record<string,any>>({ date: todayStr, ce:0, rm:0, rr:0, fr:0 })
const selectedEntry = computed(() => (entries.value||[]).find((e:any) => e.date === form.date) || null)

function onDateChange() {
  const e = selectedEntry.value
  if (e) { form.ce=e.ce; form.rm=e.rm; form.rr=e.rr; form.fr=e.fr }
  else   { form.ce=0; form.rm=0; form.rr=0; form.fr=0 }
}

function selectEntry(e: any) {
  form.date=e.date; form.ce=e.ce; form.rm=e.rm; form.rr=e.rr; form.fr=e.fr
}

async function save() {
  saving.value = true
  try {
    await $fetch('/api/diary', { method:'POST', body:{ date:form.date, ce:form.ce||0, rm:form.rm||0, rr:form.rr||0, fr:form.fr||0 } })
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
function dayTag(e: any) {
  const ceGoal = cePerDay.value
  if (e.ce === 0) return { cls:'tag-gray', label:'zerou' }
  if (e.ce >= ceGoal && e.rm >= 1) return { cls:'tag-green', label:'acima' }
  if (e.ce >= ceGoal * 0.8) return { cls:'tag-amber', label:'parcial' }
  return { cls:'tag-red', label:'abaixo' }
}
</script>
